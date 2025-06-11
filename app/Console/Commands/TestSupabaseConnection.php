<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Exception;

class TestSupabaseConnection extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'supabase:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tester la connexion avec Supabase Storage et l\'API';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Test de la connexion Supabase en cours...');
        $this->newLine();

        // Test 1: Vérifier la configuration
        $this->testConfiguration();

        // Test 2: Tester l'API Supabase
        $this->testSupabaseApi();

        // Test 3: Tester l'accès au Storage
        $this->testStorageAccess();

        // Test 4: Lister les fichiers existants
        $this->listExistingFiles();

        $this->newLine();
        $this->info('✅ Tests terminés !');
    }

    private function testConfiguration()
    {
        $this->info('📋 1. Vérification de la configuration...');

        $url = config('supabase.url');
        $anonKey = config('supabase.anon_key');
        $serviceKey = config('supabase.service_role_key');
        $bucket = config('supabase.storage_bucket');

        if (!$url) {
            $this->error('❌ SUPABASE_URL non configuré');
            return;
        }

        if (!$anonKey) {
            $this->error('❌ SUPABASE_ANON_KEY non configuré');
            return;
        }

        if (!$serviceKey) {
            $this->error('❌ SUPABASE_SERVICE_ROLE_KEY non configuré');
            return;
        }

        if (!$bucket) {
            $this->error('❌ SUPABASE_STORAGE_BUCKET non configuré');
            return;
        }

        $this->info("   ✅ URL: {$url}");
        $this->info("   ✅ Anon Key: " . substr($anonKey, 0, 20) . "...");
        $this->info("   ✅ Service Key: " . substr($serviceKey, 0, 20) . "...");
        $this->info("   ✅ Bucket: {$bucket}");
        $this->newLine();
    }

    private function testSupabaseApi()
    {
        $this->info('🌐 2. Test de l\'API Supabase...');

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('supabase.anon_key'),
                'apikey' => config('supabase.anon_key'),
            ])->get(config('supabase.url') . '/rest/v1/');

            if ($response->successful()) {
                $this->info('   ✅ Connexion API réussie');
            } else {
                $this->error('   ❌ Erreur API: ' . $response->status());
            }
        } catch (Exception $e) {
            $this->error('   ❌ Erreur de connexion: ' . $e->getMessage());
        }

        $this->newLine();
    }

    private function testStorageAccess()
    {
        $this->info('🗂️ 3. Test de l\'accès au Storage...');

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('supabase.service_role_key'),
            ])->get(config('supabase.url') . '/storage/v1/bucket/' . config('supabase.storage_bucket'));

            if ($response->successful()) {
                $this->info('   ✅ Accès au bucket réussi');
                $bucketInfo = $response->json();
                $this->info('   📊 Bucket ID: ' . ($bucketInfo['id'] ?? 'N/A'));
                $this->info('   📊 Bucket Name: ' . ($bucketInfo['name'] ?? 'N/A'));
                $this->info('   📊 Public: ' . (($bucketInfo['public'] ?? false) ? 'Oui' : 'Non'));
            } else {
                $this->error('   ❌ Erreur d\'accès au bucket: ' . $response->status());
                $this->error('   📄 Réponse: ' . $response->body());
            }
        } catch (Exception $e) {
            $this->error('   ❌ Erreur de connexion au storage: ' . $e->getMessage());
        }

        $this->newLine();
    }

    private function listExistingFiles()
    {
        $this->info('📁 4. Liste des fichiers dans le bucket...');

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('supabase.service_role_key'),
            ])->post(config('supabase.url') . '/storage/v1/object/list/' . config('supabase.storage_bucket'), [
                'limit' => 100,
                'offset' => 0,
                'prefix' => '',
            ]);

            if ($response->successful()) {
                $files = $response->json();

                if (empty($files)) {
                    $this->warn('   ⚠️ Aucun fichier trouvé dans le bucket');
                } else {
                    $this->info('   ✅ ' . count($files) . ' fichier(s) trouvé(s):');

                    foreach (array_slice($files, 0, 10) as $file) {
                        $name = $file['name'] ?? 'N/A';
                        $size = isset($file['metadata']['size']) ?
                            $this->formatBytes($file['metadata']['size']) : 'N/A';
                        $lastModified = isset($file['updated_at']) ?
                            date('d/m/Y H:i', strtotime($file['updated_at'])) : 'N/A';

                        $this->line("      📄 {$name} ({$size}) - {$lastModified}");
                    }

                    if (count($files) > 10) {
                        $this->line("      ... et " . (count($files) - 10) . " autre(s) fichier(s)");
                    }
                }
            } else {
                $this->error('   ❌ Erreur lors de la liste des fichiers: ' . $response->status());
                $this->error('   📄 Réponse: ' . $response->body());
            }
        } catch (Exception $e) {
            $this->error('   ❌ Erreur lors de la liste des fichiers: ' . $e->getMessage());
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
