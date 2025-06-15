<?php

namespace App\Console\Commands;

use App\Models\Facture;
use App\Services\FacturePdfService;
use Illuminate\Console\Command;
use Exception;

class GenerateFacturesPdfs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'factures:generate-pdfs
                           {--force : Forcer la régénération même si le PDF existe}
                           {--sync-supabase : Synchroniser les PDFs vers Supabase}
                           {--fix-amounts : Corriger les calculs de montants}
                           {--test-supabase : Tester la connexion et les permissions Supabase}
                           {--facture_id= : ID spécifique de la facture à traiter}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Génère les PDFs pour les factures existantes et corrige les calculs si nécessaire';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $force = $this->option('force');
        $syncSupabase = $this->option('sync-supabase');
        $fixAmounts = $this->option('fix-amounts');
        $testSupabase = $this->option('test-supabase');
        $factureId = $this->option('facture_id');

        // Récupérer le service PDF
        $facturePdfService = app(FacturePdfService::class);

        // Si test Supabase demandé
        if ($testSupabase) {
            return $this->testSupabaseConnection($facturePdfService);
        }

        // Si un ID spécifique est fourni
        if ($factureId) {
            return $this->handleSingleFacture($factureId, $facturePdfService, $force, $fixAmounts);
        }

        // Si on veut juste corriger les calculs
        if ($fixAmounts) {
            return $this->fixAllAmounts();
        }

        $this->info('🧾 Génération des PDFs pour les factures...');

        // Récupérer toutes les factures non archivées
        $factures = Facture::with(['client.entreprise', 'devis', 'administrateur', 'lignes'])
                           ->where('archive', false)
                           ->get();

        if ($factures->isEmpty()) {
            $this->warn('❌ Aucune facture trouvée.');
            return 1;
        }

        $this->info("📊 {$factures->count()} facture(s) trouvée(s).");

        // Barre de progression
        $bar = $this->output->createProgressBar($factures->count());
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% -- Facture: %message%');

        $succes = 0;
        $erreurs = 0;

        foreach ($factures as $factureItem) {
            try {
                $bar->setMessage($factureItem->numero_facture);

                // Recalculer les montants si nécessaire
                $factureItem->calculerMontants();
                $factureItem->save();

                $nomFichier = $force
                    ? $facturePdfService->mettreAJour($factureItem)
                    : $facturePdfService->genererEtSauvegarder($factureItem);

                $factureItem->pdf_file = $nomFichier;
                $factureItem->save();

                $succes++;
            } catch (Exception $e) {
                $this->newLine();
                $this->error("❌ Erreur pour la facture {$factureItem->numero_facture}: {$e->getMessage()}");
                $erreurs++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Afficher le résumé
        $this->table(
            ['Résultat', 'Nombre'],
            [
                ['✅ Succès', $succes],
                ['❌ Erreurs', $erreurs],
                ['📊 Total', $factures->count()],
            ]
        );

        if ($succes > 0) {
            $this->info("🎉 Génération terminée! {$succes} PDF(s) généré(s) avec succès.");
        }

        if ($erreurs > 0) {
            $this->warn("⚠️  {$erreurs} erreur(s) rencontrée(s).");
        }

        // Synchroniser vers Supabase si demandé
        if ($syncSupabase) {
            $this->newLine();
            $this->handleSupabaseSync($facturePdfService);
        }

        return $erreurs > 0 ? 1 : 0;
    }

    /**
     * Traite une facture spécifique
     */
    private function handleSingleFacture(int $factureId, FacturePdfService $facturePdfService, bool $force, bool $fixAmounts): int
    {
        $this->info("🎯 Traitement de la facture ID: {$factureId}");

        $facture = Facture::with(['client.entreprise', 'devis', 'administrateur', 'lignes'])->find($factureId);

        if (!$facture) {
            $this->error("❌ Facture avec l'ID {$factureId} non trouvée.");
            return 1;
        }

        try {
            $this->info("📄 Facture: {$facture->numero_facture}");

            // Afficher les montants actuels
            $this->table(
                ['Champ', 'Valeur actuelle'],
                [
                    ['Montant HT', number_format($facture->montant_ht, 2) . '€'],
                    ['Taux TVA', number_format($facture->taux_tva, 2) . '%'],
                    ['Montant TVA', number_format($facture->montant_tva, 2) . '€'],
                    ['Montant TTC', number_format($facture->montant_ttc, 2) . '€'],
                ]
            );

            // Corriger les calculs si demandé
            if ($fixAmounts) {
                $this->info("🔧 Correction des calculs...");
                $facture->calculerMontants();
                $facture->save();

                $this->table(
                    ['Champ', 'Nouvelle valeur'],
                    [
                        ['Montant HT', number_format($facture->montant_ht, 2) . '€'],
                        ['Taux TVA', number_format($facture->taux_tva, 2) . '%'],
                        ['Montant TVA', number_format($facture->montant_tva, 2) . '€'],
                        ['Montant TTC', number_format($facture->montant_ttc, 2) . '€'],
                    ]
                );
            }

            // Générer le PDF
            $this->info("📄 Génération du PDF...");
            $nomFichier = $force
                ? $facturePdfService->mettreAJour($facture)
                : $facturePdfService->genererEtSauvegarder($facture);

            $facture->pdf_file = $nomFichier;
            $facture->save();

            $this->info("✅ PDF généré avec succès: {$nomFichier}");
            return 0;

        } catch (Exception $e) {
            $this->error("❌ Erreur: {$e->getMessage()}");
            return 1;
        }
    }

    /**
     * Corrige les calculs de toutes les factures
     */
    private function fixAllAmounts(): int
    {
        $this->info('🔧 Correction des calculs pour toutes les factures...');

        $factures = Facture::with(['lignes'])->where('archive', false)->get();

        if ($factures->isEmpty()) {
            $this->warn('❌ Aucune facture trouvée.');
            return 1;
        }

        $corrected = 0;
        $bar = $this->output->createProgressBar($factures->count());

        foreach ($factures as $facture) {
            $ancienTTC = $facture->montant_ttc;
            $facture->calculerMontants();

            if ($facture->isDirty()) {
                $facture->save();
                $corrected++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $this->info("✅ {$corrected} facture(s) corrigée(s).");
        return 0;
    }

    /**
     * Gère la synchronisation des PDFs vers Supabase Storage
     */
    private function handleSupabaseSync(FacturePdfService $facturePdfService): int
    {
        $this->info('🔄 Synchronisation des PDFs vers Supabase Storage...');

        // Récupérer toutes les factures ayant un PDF
        $factures = Facture::with(['client.entreprise', 'devis'])
            ->where('archive', false)
            ->whereNotNull('pdf_file')
            ->get();

        if ($factures->isEmpty()) {
            $this->warn('Aucune facture avec PDF trouvée pour la synchronisation.');
            return 0;
        }

        $this->info("📤 {$factures->count()} facture(s) à synchroniser vers Supabase...");

        $bar = $this->output->createProgressBar($factures->count());
        $bar->start();

        $synchronises = 0;
        $erreurs = 0;
        $deja_synchro = 0;

        foreach ($factures as $factureItem) {
            try {
                // Vérifier si le PDF existe localement
                $cheminLocal = $facturePdfService->getCheminPdf($factureItem);

                if (!$cheminLocal || !file_exists($cheminLocal)) {
                    $this->newLine();
                    $this->warn("⚠️  PDF local introuvable pour la facture {$factureItem->numero_facture}");
                    $erreurs++;
                    $bar->advance();
                    continue;
                }

                // Vérifier si déjà sur Supabase
                $urlSupabase = $facturePdfService->getUrlSupabasePdf($factureItem);
                if ($urlSupabase && $this->checkUrlExists($urlSupabase)) {
                    $deja_synchro++;
                } else {
                    // Synchroniser vers Supabase
                    if ($facturePdfService->synchroniserVersSupabase($factureItem)) {
                        $synchronises++;
                    } else {
                        $erreurs++;
                    }
                }
            } catch (Exception $e) {
                $this->newLine();
                $this->error("❌ Erreur sync facture {$factureItem->numero_facture}: {$e->getMessage()}");
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
                ['📊 Total', $factures->count()],
            ]
        );

        if ($synchronises > 0) {
            $this->info("🎉 Synchronisation terminée! {$synchronises} PDF(s) envoyé(s) vers Supabase.");
        }

        if ($erreurs > 0) {
            $this->warn("⚠️  {$erreurs} erreur(s) de synchronisation.");
            return 1;
        }

        return 0;
    }

    /**
     * Vérifie si une URL existe
     */
    private function checkUrlExists(string $url): bool
    {
        try {
            $response = \Illuminate\Support\Facades\Http::head($url);
            return $response->successful();
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Teste la connexion et les permissions Supabase
     */
    private function testSupabaseConnection(FacturePdfService $facturePdfService): int
    {
        $this->info('🧪 Test de la connexion Supabase pour les factures...');
        $this->newLine();

        // Test 1: Configuration
        $this->info('1. 📋 Vérification de la configuration...');

        $supabaseUrl = config('supabase.url');
        $serviceKey = config('supabase.service_role_key');
        $bucketName = config('supabase.storage_bucket', 'pdfs');

        $this->table(['Configuration', 'Valeur'], [
            ['Supabase URL', $supabaseUrl ?: '❌ NON CONFIGURÉ'],
            ['Service Role Key', $serviceKey ? '✅ CONFIGURÉ' : '❌ NON CONFIGURÉ'],
            ['Bucket Name', $bucketName],
        ]);

        if (!$supabaseUrl || !$serviceKey) {
            $this->error('❌ Configuration Supabase incomplète.');
            $this->warn('💡 Vérifiez vos variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
            return 1;
        }

        // Test 2: Connexion au bucket
        $this->newLine();
        $this->info('2. 🗂️ Test d\'accès au bucket...');

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => "Bearer {$serviceKey}",
            ])->get("{$supabaseUrl}/storage/v1/bucket/{$bucketName}");

            if ($response->successful()) {
                $this->info('✅ Accès au bucket réussi');
                $bucketInfo = $response->json();
                $this->line("   📊 Bucket public: " . (($bucketInfo['public'] ?? false) ? 'Oui' : 'Non'));
            } else {
                $this->error("❌ Erreur d'accès au bucket: " . $response->status());
                $this->line("   📄 Réponse: " . $response->body());
                return 1;
            }
        } catch (\Exception $e) {
            $this->error("❌ Exception lors de l'accès au bucket: " . $e->getMessage());
            return 1;
        }

        // Test 3: Test avec une facture réelle
        $this->newLine();
        $this->info('3. 📄 Test avec une facture existante...');

        $facture = \App\Models\Facture::with(['client.entreprise', 'devis', 'administrateur'])
            ->where('archive', false)
            ->first();

        if (!$facture) {
            $this->warn('⚠️ Aucune facture trouvée pour le test.');
            return 0;
        }

        $this->info("   📄 Test avec la facture: {$facture->numero_facture}");

        try {
            // Générer le PDF localement
            $this->info("   🔄 Génération du PDF...");
            $nomFichier = $facturePdfService->genererEtSauvegarder($facture);
            $this->info("   ✅ PDF généré: {$nomFichier}");

            // Vérifier le stockage local
            $cheminLocal = $facturePdfService->getCheminPdf($facture);
            if ($cheminLocal && file_exists($cheminLocal)) {
                $taille = filesize($cheminLocal);
                $this->info("   ✅ Fichier local: " . $this->formatBytes($taille));
            } else {
                $this->error("   ❌ Fichier local non trouvé");
                return 1;
            }

            // Tester la synchronisation Supabase
            $this->info("   🔄 Test de synchronisation Supabase...");
            $success = $facturePdfService->synchroniserVersSupabase($facture);

            if ($success) {
                $this->info("   ✅ Synchronisation Supabase réussie");

                // Vérifier l'URL publique
                $urlPublique = $facturePdfService->getUrlSupabasePdf($facture);
                if ($urlPublique) {
                    $this->info("   🔗 URL publique: {$urlPublique}");

                    // Tester l'accès à l'URL
                    $this->info("   🔄 Test d'accès à l'URL publique...");
                    try {
                        $testResponse = \Illuminate\Support\Facades\Http::head($urlPublique);
                        if ($testResponse->successful()) {
                            $this->info("   ✅ URL publique accessible");
                        } else {
                            $this->warn("   ⚠️ URL publique non accessible (Status: {$testResponse->status()})");
                        }
                    } catch (\Exception $e) {
                        $this->warn("   ⚠️ Erreur lors du test d'accès: " . $e->getMessage());
                    }
                } else {
                    $this->warn("   ⚠️ URL publique non générée");
                }
            } else {
                $this->error("   ❌ Échec de la synchronisation Supabase");
                return 1;
            }

        } catch (\Exception $e) {
            $this->error("   ❌ Erreur lors du test: " . $e->getMessage());
            return 1;
        }

        $this->newLine();
        $this->info('✅ Tous les tests Supabase sont passés avec succès !');
        return 0;
    }

    /**
     * Formate la taille en bytes en format lisible
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
