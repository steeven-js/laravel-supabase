<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class DiagnoseMailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:diagnose {email?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Diagnostique la configuration mail et teste l\'envoi';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("🔍 Diagnostic de la configuration mail");
        $this->line('');

        // 1. Configuration mail
        $this->info("📋 Configuration actuelle:");
        $this->displayConfig();
        $this->line('');

        // 2. Test de connexion
        $this->info("🔌 Test de connexion:");
        $this->testConnection();
        $this->line('');

        // 3. Test d'envoi simple si email fourni
        $email = $this->argument('email');
        if ($email) {
            $this->info("📧 Test d'envoi à: $email");
            $this->testSimpleEmail($email);
        } else {
            $this->info("💡 Pour tester l'envoi d'un email: php artisan mail:diagnose votre@email.com");
        }

        $this->line('');
        $this->info("📊 Logs disponibles dans: storage/logs/laravel.log");
    }

    private function displayConfig()
    {
        $configs = [
            'Mail Driver' => config('mail.default'),
            'SMTP Host' => config('mail.mailers.smtp.host'),
            'SMTP Port' => config('mail.mailers.smtp.port'),
            'SMTP Username' => config('mail.mailers.smtp.username') ? '***configuré***' : 'non configuré',
            'SMTP Password' => config('mail.mailers.smtp.password') ? '***configuré***' : 'non configuré',
            'SMTP Encryption' => config('mail.mailers.smtp.encryption'),
            'From Address' => config('mail.from.address'),
            'From Name' => config('mail.from.name'),
            'Admin Email' => config('mail.admin_email', 'non configuré'),
        ];

        foreach ($configs as $key => $value) {
            $status = $value ? '✅' : '❌';
            $this->line("  $status $key: " . ($value ?: 'non configuré'));
        }
    }

    private function testConnection()
    {
        try {
            // Tentative de connexion au serveur SMTP
            $host = config('mail.mailers.smtp.host');
            $port = config('mail.mailers.smtp.port');

            if (!$host || !$port) {
                $this->error("  ❌ Configuration SMTP incomplète");
                return;
            }

            $this->info("  🔄 Test de connexion à $host:$port...");

            // Test basique de connexion TCP
            $connection = @fsockopen($host, $port, $errno, $errstr, 10);

            if ($connection) {
                fclose($connection);
                $this->info("  ✅ Connexion TCP réussie");
            } else {
                $this->error("  ❌ Connexion TCP échouée: $errstr ($errno)");
            }

        } catch (\Exception $e) {
            $this->error("  ❌ Erreur de connexion: " . $e->getMessage());
        }
    }

    private function testSimpleEmail($email)
    {
        try {
            Log::info('Test envoi email simple via commande diagnose', [
                'email' => $email,
                'timestamp' => now()->toISOString(),
            ]);

            $this->info("  🚀 Envoi d'un email de test...");

            Mail::raw('Test d\'envoi depuis Laravel. Si vous recevez cet email, la configuration fonctionne !', function ($message) use ($email) {
                $message->to($email)
                        ->subject('Test Laravel Mail - ' . now()->format('H:i:s'));
            });

            $this->info("  ✅ Email envoyé sans erreur Laravel");
            $this->info("  🔍 Vérifiez votre boîte mail (y compris spam)");

            Log::info('Test envoi email simple réussi', [
                'email' => $email,
            ]);

        } catch (\Exception $e) {
            $this->error("  ❌ Erreur lors de l'envoi:");
            $this->error("     " . $e->getMessage());

            Log::error('Test envoi email simple échoué', [
                'email' => $email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
