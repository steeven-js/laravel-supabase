<?php

namespace App\Console\Commands;

use App\Models\Devis;
use App\Services\DevisPdfService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DiagnosticPdfSupabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'diagnostic:pdf-supabase {devis_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Diagnostique les problèmes de PDF Supabase pour un devis donné ou tous les devis';

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
        $devisId = $this->argument('devis_id');

        if ($devisId) {
            $devis = Devis::find($devisId);
            if (!$devis) {
                $this->error("Devis avec l'ID {$devisId} non trouvé.");
                return 1;
            }
            $this->diagnostiquerDevis($devis);
        } else {
            $this->diagnostiquerConfiguration();
        }

        return 0;
    }

    private function diagnostiquerDevis(Devis $devis)
    {
        $this->info("🔍 Diagnostic pour le devis {$devis->numero_devis} (ID: {$devis->id})");
        $this->newLine();

        // 1. Vérifier les URLs
        $urlSupabase = $this->pdfService->getUrlSupabasePdf($devis);
        $urlLocale = $this->pdfService->getUrlPdf($devis);
        $pdfExiste = $this->pdfService->pdfExiste($devis);

        $this->table(['Propriété', 'Valeur'], [
            ['Numéro devis', $devis->numero_devis],
            ['PDF file (DB)', $devis->pdf_file ?? 'NULL'],
            ['PDF URL (DB)', $devis->pdf_url ?? 'NULL'],
            ['URL Supabase générée', $urlSupabase ?? 'NULL'],
            ['URL locale générée', $urlLocale ?? 'NULL'],
            ['PDF existe localement', $pdfExiste ? 'OUI' : 'NON'],
        ]);

        // 2. Tester l'accès à l'URL Supabase
        if ($urlSupabase) {
            $this->newLine();
            $this->info("🌐 Test d'accès à l'URL Supabase...");

            try {
                $response = Http::timeout(10)->get($urlSupabase);

                if ($response->successful()) {
                    $this->info("✅ URL Supabase accessible (Status: {$response->status()})");
                    $this->info("📄 Taille du PDF: " . number_format(strlen($response->body())) . " bytes");
                } else {
                    $this->error("❌ URL Supabase inaccessible (Status: {$response->status()})");
                    $this->error("Réponse: " . $response->body());
                }
            } catch (\Exception $e) {
                $this->error("❌ Erreur lors de l'accès à l'URL Supabase: " . $e->getMessage());
            }
        }

        // 3. Vérifier le fichier local
        if ($pdfExiste) {
            $cheminLocal = $this->pdfService->getCheminPdf($devis);
            if ($cheminLocal && file_exists($cheminLocal)) {
                $taille = filesize($cheminLocal);
                $this->info("📁 Fichier local trouvé: {$cheminLocal} ({$taille} bytes)");
            }
        }

        // 4. Proposer des solutions
        $this->newLine();
        $this->info("🔧 Actions recommandées:");

        if (!$pdfExiste) {
            $this->warn("• Générer le PDF localement: php artisan devis:generate-pdfs --force");
        }

        if ($pdfExiste && !$urlSupabase) {
            $this->warn("• Synchroniser vers Supabase: php artisan devis:generate-pdfs --sync-supabase");
        }

        if ($urlSupabase && !$this->testUrlSupabase($urlSupabase)) {
            $this->warn("• Vérifier la configuration Supabase");
            $this->warn("• Régénérer et synchroniser: php artisan devis:generate-pdfs --force --sync-supabase");
        }
    }

    private function diagnostiquerConfiguration()
    {
        $this->info("🔍 Diagnostic de la configuration Supabase");
        $this->newLine();

        $supabaseUrl = config('supabase.url');
        $serviceKey = config('supabase.service_role_key');
        $bucketName = config('supabase.storage_bucket', 'pdfs');

        $this->table(['Configuration', 'Valeur'], [
            ['Supabase URL', $supabaseUrl ?? 'NON CONFIGURÉ'],
            ['Service Key', $serviceKey ? 'CONFIGURÉ' : 'NON CONFIGURÉ'],
            ['Bucket name', $bucketName],
        ]);

        // Test de connexion à Supabase
        if ($supabaseUrl && $serviceKey) {
            $this->newLine();
            $this->info("🌐 Test de connexion à Supabase Storage...");

            try {
                $response = Http::withHeaders([
                    'Authorization' => "Bearer {$serviceKey}",
                ])->get("{$supabaseUrl}/storage/v1/bucket");

                if ($response->successful()) {
                    $buckets = $response->json();
                    $this->info("✅ Connexion Supabase réussie");
                    $this->info("📁 Buckets disponibles: " . collect($buckets)->pluck('name')->implode(', '));

                    // Vérifier si le bucket pdfs existe
                    $pdfsBucketExists = collect($buckets)->contains('name', $bucketName);
                    if ($pdfsBucketExists) {
                        $this->info("✅ Bucket '{$bucketName}' trouvé");
                    } else {
                        $this->error("❌ Bucket '{$bucketName}' non trouvé");
                        $this->warn("💡 Créez le bucket '{$bucketName}' dans votre dashboard Supabase");
                    }
                } else {
                    $this->error("❌ Échec de connexion à Supabase (Status: {$response->status()})");
                    $this->error("Réponse: " . $response->body());
                }
            } catch (\Exception $e) {
                $this->error("❌ Erreur de connexion à Supabase: " . $e->getMessage());
            }
        } else {
            $this->error("❌ Configuration Supabase incomplète");
        }
    }

    private function testUrlSupabase(string $url): bool
    {
        try {
            $response = Http::timeout(10)->get($url);
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}
