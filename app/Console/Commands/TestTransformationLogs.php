<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\TransformationLogService;

class TestTransformationLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'transformation:test-logs
                        {scenario=success : Le scénario à tester (success, error, complex)}
                        {--devis=DV-25-TEST : Numéro de devis pour le test}
                        {--client=Jean Dupont : Nom du client pour le test}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Teste le système de logs de transformation avec différents scénarios';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $scenario = $this->argument('scenario');
        $devisNumero = $this->option('devis');
        $clientNom = $this->option('client');

        $this->info("🧪 Test du système de logs de transformation");
        $this->info("Scénario: {$scenario}");
        $this->info("Devis: {$devisNumero}");
        $this->info("Client: {$clientNom}");
        $this->newLine();

        switch ($scenario) {
            case 'success':
                return $this->testSuccessScenario($devisNumero, $clientNom);
            case 'error':
                return $this->testErrorScenario($devisNumero, $clientNom);
            case 'complex':
                return $this->testComplexScenario($devisNumero, $clientNom);
            default:
                $this->error("Scénario inconnu: {$scenario}");
                $this->info("Scénarios disponibles: success, error, complex");
                return Command::FAILURE;
        }
    }

    /**
     * Test d'un scénario de transformation réussie
     */
    private function testSuccessScenario(string $devisNumero, string $clientNom): int
    {
        $this->info("🚀 Test du scénario SUCCESS");

        // Démarrer la session
        $sessionId = TransformationLogService::startTransformationSession($devisNumero, $clientNom);
        $this->info("Session démarrée: {$sessionId}");

        // Simuler les paramètres
        $params = [
            'date_facture' => now()->format('Y-m-d'),
            'date_echeance' => now()->addDays(30)->format('Y-m-d'),
            'conditions_paiement' => 'Net 30 jours',
            'notes_facture' => 'Facture générée automatiquement depuis le devis'
        ];
        TransformationLogService::logTransformationParams($params);

        // Simuler la désactivation des notifications
        TransformationLogService::logNotificationOptimization(true);

        // Simuler la transformation
        sleep(1); // Simuler du traitement
        TransformationLogService::logEvent("🔄 Début de la transformation en base de données");

        $factureNumero = "FACT-25-" . rand(1000, 9999);
        TransformationLogService::logFactureCreated($factureNumero);

        $montantHT = 1250.00;
        $montantTTC = 1500.00;
        TransformationLogService::logMontantsCalculated($montantHT, $montantTTC);

        $nbLignes = 3;
        TransformationLogService::logLignesCopied($nbLignes);

        TransformationLogService::logEvent("📅 Date d'envoi admin définie");

        // Réactiver les notifications
        TransformationLogService::logNotificationOptimization(false);

        // Simuler les emails
        TransformationLogService::logEvent("📧 Envoi email client en cours...");
        sleep(1);
        TransformationLogService::logEmailSent('client', 'client@example.com');

        TransformationLogService::logEvent("📨 Envoi email admin en cours...");
        TransformationLogService::logEmailSent('admin', 'admin@madinia.com');

        TransformationLogService::logEvent("🔔 Notification envoyée aux administrateurs");

        // Simuler les performances
        $executionTime = 2500.0; // 2.5 secondes
        TransformationLogService::logPerformance($executionTime, 15);

        // Terminer avec succès
        TransformationLogService::endTransformationSession(true, [
            'facture_numero' => $factureNumero,
            'execution_time_ms' => $executionTime
        ]);

        $this->info("✅ Test SUCCESS terminé avec succès!");
        $this->info("Facture créée: {$factureNumero}");
        $this->info("Temps d'exécution: {$executionTime}ms");

        return Command::SUCCESS;
    }

    /**
     * Test d'un scénario d'erreur
     */
    private function testErrorScenario(string $devisNumero, string $clientNom): int
    {
        $this->info("💥 Test du scénario ERROR");

        // Démarrer la session
        $sessionId = TransformationLogService::startTransformationSession($devisNumero, $clientNom);
        $this->info("Session démarrée: {$sessionId}");

        // Simuler les paramètres
        $params = [
            'date_facture' => now()->format('Y-m-d'),
            'date_echeance' => now()->addDays(30)->format('Y-m-d'),
        ];
        TransformationLogService::logTransformationParams($params);

        // Simuler la désactivation des notifications
        TransformationLogService::logNotificationOptimization(true);

        // Simuler une erreur durant la transformation
        sleep(1);
        TransformationLogService::logEvent("🔄 Début de la transformation en base de données");

        try {
            // Simuler une exception
            throw new \Exception("Violation de contrainte unique sur le numéro de facture", 23000);
        } catch (\Exception $e) {
            TransformationLogService::logError("Échec de la transformation", $e);
        }

        // Terminer avec échec
        TransformationLogService::endTransformationSession(false, [
            'error_message' => 'Violation de contrainte unique sur le numéro de facture',
            'error_file' => 'FactureService.php',
            'error_line' => 142
        ]);

        $this->error("❌ Test ERROR terminé - Erreur simulée avec succès!");

        return Command::SUCCESS;
    }

    /**
     * Test d'un scénario complexe avec emails partiels
     */
    private function testComplexScenario(string $devisNumero, string $clientNom): int
    {
        $this->info("🎯 Test du scénario COMPLEX");

        // Démarrer la session
        $sessionId = TransformationLogService::startTransformationSession($devisNumero, $clientNom);
        $this->info("Session démarrée: {$sessionId}");

        // Transformation réussie
        $params = [
            'date_facture' => now()->format('Y-m-d'),
            'date_echeance' => now()->addDays(30)->format('Y-m-d'),
            'conditions_paiement' => 'Net 15 jours',
            'notes_facture' => 'Transformation complexe avec erreurs d\'email'
        ];
        TransformationLogService::logTransformationParams($params);

        TransformationLogService::logNotificationOptimization(true);

        TransformationLogService::logEvent("🔄 Début de la transformation en base de données");

        $factureNumero = "FACT-25-" . rand(1000, 9999);
        TransformationLogService::logFactureCreated($factureNumero);

        TransformationLogService::logMontantsCalculated(2100.00, 2520.00);
        TransformationLogService::logLignesCopied(5);
        TransformationLogService::logEvent("📅 Date d'envoi admin définie");

        TransformationLogService::logNotificationOptimization(false);

        // Email client réussi
        TransformationLogService::logEvent("📧 Envoi email client en cours...");
        TransformationLogService::logEmailSent('client', 'client@example.com');

        // Email admin échoué
        TransformationLogService::logEvent("📨 Envoi email admin en cours...");
        try {
            throw new \Exception("Connexion SMTP refusée - timeout après 30 secondes");
        } catch (\Exception $e) {
            TransformationLogService::logError("Échec envoi email admin", $e);
        }

        TransformationLogService::logEvent("🔔 Notification envoyée aux administrateurs");

        $executionTime = 8500.0; // 8.5 secondes (lent)
        TransformationLogService::logPerformance($executionTime, 28);

        // Terminer avec succès partiel
        TransformationLogService::endTransformationSession(true, [
            'facture_numero' => $factureNumero,
            'execution_time_ms' => $executionTime,
            'email_errors' => ['Erreur lors de l\'envoi de l\'email à l\'admin : Connexion SMTP refusée']
        ]);

        $this->warn("⚠️ Test COMPLEX terminé - Succès partiel!");
        $this->info("Facture créée: {$factureNumero}");
        $this->warn("Erreur email admin simulée");

        return Command::SUCCESS;
    }
}
