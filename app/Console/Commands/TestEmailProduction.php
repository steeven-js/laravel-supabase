<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\DevisClientMail;
use App\Models\Devis;
use Symfony\Component\Mailer\Exception\TransportException;

class TestEmailProduction extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'email:test-production {email} {--timeout=30} {--service=smtp}';

    /**
     * The description of the console command.
     */
    protected $description = 'Teste la configuration email en production avec diagnostics complets';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $timeout = (int) $this->option('timeout');
        $service = $this->option('service');

        $this->info("🔄 Test de configuration email production");
        $this->info("📧 Email destination: {$email}");
        $this->info("⏱️  Timeout: {$timeout}s");
        $this->info("🔗 Service: {$service}");
        $this->line('');

        // 1. Vérification de la configuration
        $this->testConfiguration();

        // 2. Test de connectivité réseau
        $this->testNetworkConnectivity();

        // 3. Test d'envoi simple
        $this->testSimpleEmail($email, $timeout);

        // 4. Test avec un vrai devis si disponible
        $this->testDevisEmail($email);

        $this->info("✅ Tests terminés !");
    }

    private function testConfiguration()
    {
        $this->info("🔧 Configuration actuelle:");

        $config = [
            'MAIL_MAILER' => config('mail.default'),
            'MAIL_HOST' => config('mail.mailers.smtp.host'),
            'MAIL_PORT' => config('mail.mailers.smtp.port'),
            'MAIL_ENCRYPTION' => config('mail.mailers.smtp.encryption'),
            'MAIL_USERNAME' => config('mail.mailers.smtp.username') ? '✓ Configuré' : '❌ Non configuré',
            'MAIL_PASSWORD' => config('mail.mailers.smtp.password') ? '✓ Configuré' : '❌ Non configuré',
            'MAIL_FROM_ADDRESS' => config('mail.from.address'),
            'MAIL_FROM_NAME' => config('mail.from.name'),
        ];

        foreach ($config as $key => $value) {
            $this->line("  {$key}: {$value}");
        }
        $this->line('');
    }

    private function testNetworkConnectivity()
    {
        $this->info("🌐 Test de connectivité réseau:");

        $host = config('mail.mailers.smtp.host');
        $port = config('mail.mailers.smtp.port');

        $this->line("  Test connexion à {$host}:{$port}...");

        $startTime = microtime(true);
        $connection = @fsockopen($host, $port, $errno, $errstr, 10);
        $duration = round((microtime(true) - $startTime) * 1000, 2);

        if ($connection) {
            $this->info("  ✅ Connexion réussie en {$duration}ms");
            fclose($connection);
        } else {
            $this->error("  ❌ Connexion échouée: {$errstr} (code: {$errno})");
        }
        $this->line('');
    }

    private function testSimpleEmail($email, $timeout)
    {
        $this->info("📤 Test d'envoi email simple:");

        try {
            $startTime = microtime(true);

            Mail::raw('Test email production depuis Laravel Cloud ✅', function ($message) use ($email) {
                $message->to($email)
                       ->subject('🧪 Test Email Production - ' . now()->format('Y-m-d H:i:s'));
            });

            $duration = round((microtime(true) - $startTime) * 1000, 2);
            $this->info("  ✅ Email simple envoyé en {$duration}ms");

        } catch (TransportException $e) {
            $this->error("  ❌ Erreur transport: " . $e->getMessage());
            $this->line("     Suggestion: Vérifiez vos identifiants SMTP");
        } catch (\Exception $e) {
            $this->error("  ❌ Erreur générale: " . $e->getMessage());
        }
        $this->line('');
    }

    private function testDevisEmail($email)
    {
        $this->info("📋 Test avec un devis réel:");

        $devis = Devis::with('client')->first();

        if (!$devis) {
            $this->warn("  ⚠️  Aucun devis trouvé, test ignoré");
            return;
        }

        try {
            $this->line("  Test avec le devis #{$devis->numero_devis}...");

            $startTime = microtime(true);

            // Créer un client temporaire pour le test
            $clientTest = new \App\Models\Client([
                'nom' => 'Test',
                'prenom' => 'Production',
                'email' => $email
            ]);

            Mail::to($email)->send(new DevisClientMail($devis, $clientTest, "Test email production"));

            $duration = round((microtime(true) - $startTime) * 1000, 2);
            $this->info("  ✅ Email avec devis envoyé en {$duration}ms");

        } catch (\Exception $e) {
            $this->error("  ❌ Erreur envoi devis: " . $e->getMessage());
        }
    }
}
