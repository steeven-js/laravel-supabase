<?php

namespace App\Console\Commands;

use App\Models\Devis;
use App\Models\Facture;
use App\Services\DevisPdfService;
use App\Services\FacturePdfService;
use App\Services\PdfCacheService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncPdfsCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'pdf:sync
                           {--type=all : Type de document (devis, factures, all)}
                           {--force : Force la régénération même si le PDF existe}
                           {--cleanup : Nettoie les anciens PDFs}
                           {--stats : Affiche les statistiques du cache}';

    /**
     * The console command description.
     */
    protected $description = 'Synchronise les PDFs entre le stockage local et Supabase';

    private DevisPdfService $devisPdfService;
    private FacturePdfService $facturePdfService;
    private PdfCacheService $pdfCacheService;

    public function __construct(
        DevisPdfService $devisPdfService,
        FacturePdfService $facturePdfService,
        PdfCacheService $pdfCacheService
    ) {
        parent::__construct();
        $this->devisPdfService = $devisPdfService;
        $this->facturePdfService = $facturePdfService;
        $this->pdfCacheService = $pdfCacheService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🚀 Début de la synchronisation des PDFs...');

        try {
            // Afficher les statistiques si demandé
            if ($this->option('stats')) {
                $this->displayStats();
            }

            // Nettoyer les anciens PDFs si demandé
            if ($this->option('cleanup')) {
                $this->cleanupOldPdfs();
            }

            $type = $this->option('type');
            $force = $this->option('force');

            // Synchroniser selon le type
            switch ($type) {
                case 'devis':
                    $this->syncDevis($force);
                    break;
                case 'factures':
                    $this->syncFactures($force);
                    break;
                case 'all':
                default:
                    $this->syncDevis($force);
                    $this->syncFactures($force);
                    break;
            }

            $this->info('✅ Synchronisation terminée avec succès !');
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Erreur lors de la synchronisation : ' . $e->getMessage());
            Log::error('Erreur synchronisation PDFs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return Command::FAILURE;
        }
    }

    /**
     * Synchronise les PDFs des devis
     */
    private function syncDevis(bool $force = false): void
    {
        $this->info('📄 Synchronisation des devis...');

        $devis = Devis::with(['client', 'administrateur'])
                     ->whereIn('statut', ['envoye', 'accepte'])
                     ->get();

        $this->withProgressBar($devis, function ($devis) use ($force) {
            try {
                $needsUpdate = $force || !$this->pdfCacheService->isPdfUpToDate(
                    'devis',
                    $devis->id,
                    $devis->updated_at
                );

                if ($needsUpdate) {
                    // Générer et sauvegarder le PDF
                    $nomFichier = $this->devisPdfService->genererEtSauvegarder($devis);

                    // Mettre à jour le cache
                    $this->pdfCacheService->cachePdfInfo('devis', $devis->id, [
                        'local_path' => "pdfs/{$nomFichier}",
                        'file_size' => filesize(storage_path("app/pdfs/{$nomFichier}")),
                        'last_modified' => now()->toISOString(),
                    ]);

                    // Marquer le PDF comme mis à jour
                    $devis->update(['pdf_file' => $nomFichier]);
                }

            } catch (\Exception $e) {
                Log::error('Erreur sync devis', [
                    'devis_id' => $devis->id,
                    'error' => $e->getMessage()
                ]);
            }
        });

        $this->newLine();
        $this->info("✅ Synchronisation de {$devis->count()} devis terminée");
    }

    /**
     * Synchronise les PDFs des factures
     */
    private function syncFactures(bool $force = false): void
    {
        $this->info('🧾 Synchronisation des factures...');

        $factures = Facture::with(['client', 'administrateur'])
                           ->whereIn('statut', ['envoyee', 'payee'])
                           ->get();

        $this->withProgressBar($factures, function ($facture) use ($force) {
            try {
                $needsUpdate = $force || !$this->pdfCacheService->isPdfUpToDate(
                    'facture',
                    $facture->id,
                    $facture->updated_at
                );

                if ($needsUpdate) {
                    // Générer et sauvegarder le PDF
                    $nomFichier = $this->facturePdfService->genererEtSauvegarder($facture);

                    // Mettre à jour le cache
                    $this->pdfCacheService->cachePdfInfo('facture', $facture->id, [
                        'local_path' => "pdfs/{$nomFichier}",
                        'file_size' => filesize(storage_path("app/pdfs/{$nomFichier}")),
                        'last_modified' => now()->toISOString(),
                    ]);

                    // Marquer le PDF comme mis à jour
                    $facture->update(['pdf_file' => $nomFichier]);
                }

            } catch (\Exception $e) {
                Log::error('Erreur sync facture', [
                    'facture_id' => $facture->id,
                    'error' => $e->getMessage()
                ]);
            }
        });

        $this->newLine();
        $this->info("✅ Synchronisation de {$factures->count()} factures terminée");
    }

    /**
     * Nettoie les anciens PDFs
     */
    private function cleanupOldPdfs(): void
    {
        $this->info('🧹 Nettoyage des anciens PDFs...');

        $cleaned = $this->pdfCacheService->cleanupOldPdfs(30);
        $this->info("✅ {$cleaned} anciens PDFs supprimés");
    }

    /**
     * Affiche les statistiques du cache
     */
    private function displayStats(): void
    {
        $this->info('📊 Statistiques du cache PDF');
        $this->newLine();

        $stats = $this->pdfCacheService->getCacheStats();

        $this->table([
            'Métrique', 'Valeur'
        ], [
            ['Fichiers locaux', $stats['total_local_files'] ?? 0],
            ['Espace utilisé', $this->formatBytes($stats['storage_usage'] ?? 0)],
            ['Taille moyenne', $this->formatBytes(
                $stats['total_local_files'] > 0
                    ? ($stats['storage_usage'] / $stats['total_local_files'])
                    : 0
            )],
        ]);

        $this->newLine();
    }

    /**
     * Formate les octets en format lisible
     */
    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }
        return $bytes . ' bytes';
    }
}
