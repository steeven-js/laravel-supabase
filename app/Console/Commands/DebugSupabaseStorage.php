<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Exception;

class DebugSupabaseStorage extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'supabase:debug-storage';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Déboguer le contenu détaillé du storage Supabase';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Debug détaillé du storage Supabase...');
        $this->newLine();

        // 1. Lister le contenu racine
        $this->debugContenuRacine();

        // 2. Lister le contenu des dossiers devis et factures
        $this->debugContenuDossier('devis');
        $this->debugContenuDossier('factures');

        // 3. Essayer de télécharger un fichier pour vérifier
        $this->testTelechargerFichier();
    }

    private function debugContenuRacine()
    {
        $this->info('📁 1. Contenu racine du bucket...');

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
                $this->info('   ✅ Réponse réussie, ' . count($fichiers) . ' éléments trouvés');

                foreach ($fichiers as $index => $fichier) {
                    $this->line("   [{$index}] " . json_encode($fichier, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
                    $this->newLine();
                }
            } else {
                $this->error('   ❌ Erreur: ' . $response->status());
                $this->error('   📄 Réponse: ' . $response->body());
            }
        } catch (Exception $e) {
            $this->error('   ❌ Exception: ' . $e->getMessage());
        }

        $this->newLine();
    }

    private function debugContenuDossier(string $dossier)
    {
        $this->info("📁 2. Contenu du dossier '{$dossier}'...");

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('supabase.service_role_key'),
            ])->post(config('supabase.url') . '/storage/v1/object/list/' . config('supabase.storage_bucket'), [
                'limit' => 100,
                'offset' => 0,
                'prefix' => $dossier . '/',
            ]);

            if ($response->successful()) {
                $fichiers = $response->json();
                $this->info("   ✅ {$dossier}: " . count($fichiers) . ' fichier(s) trouvé(s)');

                foreach (array_slice($fichiers, 0, 5) as $index => $fichier) {
                    $nom = $fichier['name'] ?? 'N/A';
                    $taille = isset($fichier['metadata']['size']) ? $this->formatBytes($fichier['metadata']['size']) : 'N/A';
                    $this->line("      [{$index}] {$nom} ({$taille})");
                }

                if (count($fichiers) > 5) {
                    $this->line("      ... et " . (count($fichiers) - 5) . " autre(s)");
                }
            } else {
                $this->error("   ❌ Erreur {$dossier}: " . $response->status());
                $this->error('   📄 Réponse: ' . $response->body());
            }
        } catch (Exception $e) {
            $this->error("   ❌ Exception {$dossier}: " . $e->getMessage());
        }

        $this->newLine();
    }

    private function testTelechargerFichier()
    {
        $this->info('📥 3. Test de téléchargement d\'un fichier...');

        // D'abord, récupérer la liste pour trouver un fichier
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('supabase.service_role_key'),
            ])->post(config('supabase.url') . '/storage/v1/object/list/' . config('supabase.storage_bucket'), [
                'limit' => 10,
                'offset' => 0,
                'prefix' => 'devis/',
            ]);

            if ($response->successful()) {
                $fichiers = $response->json();

                if (!empty($fichiers)) {
                    $premierFichier = $fichiers[0];
                    $nomFichier = $premierFichier['name'] ?? null;

                    if ($nomFichier) {
                        $this->info("   📄 Test avec: {$nomFichier}");

                        // Essayer de télécharger
                        $cheminComplet = 'devis/' . $nomFichier;
                        $downloadResponse = Http::withHeaders([
                            'Authorization' => 'Bearer ' . config('supabase.service_role_key'),
                        ])->get(config('supabase.url') . '/storage/v1/object/' . config('supabase.storage_bucket') . '/' . $cheminComplet);

                        if ($downloadResponse->successful()) {
                            $taille = strlen($downloadResponse->body());
                            $this->info("   ✅ Téléchargement réussi: " . $this->formatBytes($taille));
                        } else {
                            $this->error("   ❌ Erreur téléchargement: " . $downloadResponse->status());
                        }
                    }
                } else {
                    $this->warn('   ⚠️ Aucun fichier trouvé pour le test');
                }
            }
        } catch (Exception $e) {
            $this->error('   ❌ Exception test téléchargement: ' . $e->getMessage());
        }
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
