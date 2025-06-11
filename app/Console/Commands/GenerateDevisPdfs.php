<?php

namespace App\Console\Commands;

use App\Models\Devis;
use App\Services\DevisPdfService;
use Illuminate\Console\Command;

class GenerateDevisPdfs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'devis:generate-pdfs
                                        {--force : Forcer la régénération même si le PDF existe déjà}
                                        {--sync-supabase : Synchroniser tous les PDFs existants vers Supabase Storage}
                                        {--only-supabase : Uniquement synchroniser vers Supabase sans générer de nouveaux PDFs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Génère les PDFs pour tous les devis existants et les synchronise avec Supabase Storage';

    protected DevisPdfService $pdfService;

    public function __construct(DevisPdfService $pdfService)
    {
        parent::__construct();
        $this->pdfService = $pdfService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $onlySupabase = $this->option('only-supabase');
        $syncSupabase = $this->option('sync-supabase') || $onlySupabase;
        $force = $this->option('force');

        if ($onlySupabase) {
            return $this->handleSupabaseSync();
        }

        $this->info('🚀 Début de la génération des PDFs des devis...');

        $devis = Devis::with(['client.entreprise'])
            ->where('archive', false)
            ->get();

        if ($devis->isEmpty()) {
            $this->warn('Aucun devis trouvé.');

            if ($syncSupabase) {
                return $this->handleSupabaseSync();
            }

            return self::SUCCESS;
        }

        $this->info("📄 {$devis->count()} devis trouvés.");

        $progressBar = $this->output->createProgressBar($devis->count());
        $progressBar->start();

        $generated = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($devis as $devisItem) {
            try {
                $existeDeja = $this->pdfService->pdfExiste($devisItem);

                if ($existeDeja && !$force) {
                    $skipped++;
                } else {
                    $nomFichier = $this->pdfService->genererEtSauvegarder($devisItem);
                    $devisItem->pdf_file = $nomFichier;
                    $devisItem->save();
                    $generated++;
                }

            } catch (\Exception $e) {
                $this->error("Erreur pour le devis {$devisItem->numero_devis}: " . $e->getMessage());
                $errors++;
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        // Résumé
        $this->info('✅ Génération terminée !');
        $this->table(['Statut', 'Nombre'], [
            ['PDFs générés', $generated],
            ['PDFs ignorés (existent déjà)', $skipped],
            ['Erreurs', $errors],
            ['Total traité', $devis->count()],
        ]);

        if ($skipped > 0 && !$force) {
            $this->comment('💡 Utilisez --force pour régénérer les PDFs existants.');
        }

        // Synchroniser vers Supabase si demandé
        if ($syncSupabase) {
            $this->newLine();
            $this->handleSupabaseSync();
        }

        return self::SUCCESS;
    }

    /**
     * Gère la synchronisation des PDFs vers Supabase Storage
     */
    private function handleSupabaseSync(): int
    {
        $this->info('🔄 Synchronisation des PDFs des devis vers Supabase Storage...');

        // Récupérer tous les devis ayant un PDF
        $devis = Devis::with(['client.entreprise'])
            ->where('archive', false)
            ->whereNotNull('pdf_file')
            ->get();

        if ($devis->isEmpty()) {
            $this->warn('Aucun devis avec PDF trouvé pour la synchronisation.');
            return self::SUCCESS;
        }

        $this->info("📤 {$devis->count()} devis à synchroniser vers Supabase...");

        $bar = $this->output->createProgressBar($devis->count());
        $bar->start();

        $synchronises = 0;
        $erreurs = 0;
        $deja_synchro = 0;

        foreach ($devis as $devisItem) {
            try {
                // Vérifier si le PDF existe localement
                $cheminLocal = $this->pdfService->getCheminPdf($devisItem);

                if (!$cheminLocal || !file_exists($cheminLocal)) {
                    $this->newLine();
                    $this->warn("⚠️  PDF local introuvable pour le devis {$devisItem->numero_devis}");
                    $erreurs++;
                    $bar->advance();
                    continue;
                }

                // Vérifier si déjà sur Supabase
                $urlSupabase = $this->pdfService->getUrlSupabasePdf($devisItem);
                if ($urlSupabase && $this->checkUrlExists($urlSupabase)) {
                    $deja_synchro++;
                } else {
                    // Synchroniser vers Supabase
                    if ($this->pdfService->synchroniserVersSupabase($devisItem)) {
                        $synchronises++;
                    } else {
                        $erreurs++;
                    }
                }

            } catch (\Exception $e) {
                $this->newLine();
                $this->error("❌ Erreur sync devis {$devisItem->numero_devis}: {$e->getMessage()}");
                $erreurs++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Afficher le résumé de la synchronisation
        $this->table(
            ['Résultat Synchronisation', 'Nombre'],
            [
                ['📤 Synchronisés', $synchronises],
                ['✅ Déjà sur Supabase', $deja_synchro],
                ['❌ Erreurs', $erreurs],
                ['📊 Total', $devis->count()],
            ]
        );

        if ($synchronises > 0) {
            $this->info("🎉 Synchronisation terminée! {$synchronises} PDF(s) de devis envoyé(s) vers Supabase.");
        }

        if ($erreurs > 0) {
            $this->warn("⚠️  {$erreurs} erreur(s) de synchronisation.");
            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    /**
     * Vérifie si une URL existe
     */
    private function checkUrlExists(string $url): bool
    {
        try {
            $response = \Illuminate\Support\Facades\Http::head($url);
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}
