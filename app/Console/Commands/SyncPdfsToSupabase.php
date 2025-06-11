<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\File;
use Exception;

class SyncPdfsToSupabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'supabase:sync-pdfs {--test : Tester avec seulement quelques fichiers} {--force : Forcer le remplacement des fichiers existants}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchroniser les PDFs locaux vers Supabase Storage';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Synchronisation des PDFs vers Supabase Storage...');
        $this->newLine();

        $isTest = $this->option('test');
        $force = $this->option('force');

        // Dossiers à synchroniser
        $dossiers = [
            'devis' => storage_path('app/public/pdfs/devis'),
            'factures' => storage_path('app/public/pdfs/factures'),
        ];

        $totalFichiers = 0;
        $totalSyncs = 0;
        $erreurs = 0;

        foreach ($dossiers as $type => $chemin) {
            $this->info("📁 Synchronisation des {$type}...");

            if (!File::exists($chemin)) {
                $this->warn("   ⚠️ Dossier {$chemin} non trouvé");
                continue;
            }

            $fichiers = File::files($chemin);
            $totalFichiers += count($fichiers);

            if ($isTest) {
                $fichiers = array_slice($fichiers, 0, 3); // Limiter à 3 fichiers en test
                $this->warn("   🧪 Mode test : seulement " . count($fichiers) . " fichier(s)");
            }

            $this->info("   📊 " . count($fichiers) . " fichier(s) à traiter");

            foreach ($fichiers as $fichier) {
                $nomFichier = $fichier->getFilename();
                $cheminRelatif = "{$type}/{$nomFichier}";

                $this->line("   📄 Traitement : {$nomFichier}");

                try {
                    // Vérifier si le fichier existe déjà
                    if (!$force && $this->fichierExisteDejaSupabase($cheminRelatif)) {
                        $this->line("      ⏭️ Fichier déjà présent (utilisez --force pour remplacer)");
                        continue;
                    }

                    // Upload du fichier
                    $resultat = $this->uploaderFichierSupabase($fichier->getPathname(), $cheminRelatif);

                    if ($resultat) {
                        $this->line("      ✅ Synchronisé avec succès");
                        $totalSyncs++;
                    } else {
                        $this->line("      ❌ Échec de la synchronisation");
                        $erreurs++;
                    }

                } catch (Exception $e) {
                    $this->line("      ❌ Erreur : " . $e->getMessage());
                    $erreurs++;
                }
            }

            $this->newLine();
        }

        // Résumé
        $this->info("📊 Résumé de la synchronisation :");
        $this->info("   📁 Fichiers trouvés : {$totalFichiers}");
        $this->info("   ✅ Fichiers synchronisés : {$totalSyncs}");
        $this->info("   ❌ Erreurs : {$erreurs}");

        if ($erreurs === 0) {
            $this->info("🎉 Synchronisation terminée avec succès !");
        } else {
            $this->warn("⚠️ Synchronisation terminée avec {$erreurs} erreur(s)");
        }

        // Vérifier le contenu du bucket après synchronisation
        $this->newLine();
        $this->info("🔍 Vérification du contenu du bucket...");
        $this->verifierContenuBucket();
    }

    private function fichierExisteDejaSupabase(string $cheminRelatif): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('supabase.service_role_key'),
            ])->head(config('supabase.url') . '/storage/v1/object/' . config('supabase.storage_bucket') . '/' . $cheminRelatif);

            return $response->successful();
        } catch (Exception $e) {
            return false;
        }
    }

    private function uploaderFichierSupabase(string $cheminLocal, string $cheminRelatif): bool
    {
        try {
            $contenuFichier = File::get($cheminLocal);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('supabase.service_role_key'),
                'Content-Type' => 'application/pdf',
            ])->withBody($contenuFichier, 'application/pdf')
              ->post(config('supabase.url') . '/storage/v1/object/' . config('supabase.storage_bucket') . '/' . $cheminRelatif);

            if ($response->successful()) {
                return true;
            } else {
                $this->line("        📄 Erreur HTTP: " . $response->status());
                $this->line("        📄 Réponse: " . $response->body());
                return false;
            }

        } catch (Exception $e) {
            $this->line("        📄 Exception: " . $e->getMessage());
            return false;
        }
    }

    private function verifierContenuBucket()
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('supabase.service_role_key'),
            ])->post(config('supabase.url') . '/storage/v1/object/list/' . config('supabase.storage_bucket'), [
                'limit' => 1000,
                'offset' => 0,
                'prefix' => '',
            ]);

            if ($response->successful()) {
                $fichiers = $response->json();

                if (empty($fichiers)) {
                    $this->warn('   ⚠️ Aucun fichier trouvé dans le bucket');
                } else {
                    $this->info('   ✅ ' . count($fichiers) . ' fichier(s) dans le bucket:');

                    // Grouper par type
                    $parType = ['devis' => 0, 'factures' => 0, 'autres' => 0];

                    foreach ($fichiers as $fichier) {
                        $nom = $fichier['name'] ?? '';
                        if (str_starts_with($nom, 'devis/')) {
                            $parType['devis']++;
                        } elseif (str_starts_with($nom, 'factures/')) {
                            $parType['factures']++;
                        } else {
                            $parType['autres']++;
                        }
                    }

                    $this->line("      📄 Devis: {$parType['devis']}");
                    $this->line("      📄 Factures: {$parType['factures']}");
                    if ($parType['autres'] > 0) {
                        $this->line("      📄 Autres: {$parType['autres']}");
                    }
                }
            } else {
                $this->error('   ❌ Erreur lors de la vérification: ' . $response->status());
            }
        } catch (Exception $e) {
            $this->error('   ❌ Erreur lors de la vérification: ' . $e->getMessage());
        }
    }
}
