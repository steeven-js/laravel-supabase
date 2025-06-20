<?php

namespace App\Console\Commands;

use App\Models\Devis;
use App\Models\Client;
use App\Mail\DevisClientMail;
use App\Mail\DevisAdminMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class TestDevisMailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test-devis {email} {--admin : Test admin email instead of client email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test l\'envoi des emails de devis';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $isAdmin = $this->option('admin');

        $this->info("🧪 Test d'envoi d'email de devis");
        $this->info("📧 Destination: $email");
        $this->info("🎯 Type: " . ($isAdmin ? 'Admin' : 'Client'));
        $this->line('');

        // Vérifier la configuration mail
        $this->info("📋 Configuration mail actuelle:");
        $this->info("  - Mailer: " . config('mail.default'));
        $this->info("  - Host: " . config('mail.mailers.smtp.host', 'N/A'));
        $this->info("  - Port: " . config('mail.mailers.smtp.port', 'N/A'));
        $this->info("  - From: " . config('mail.from.address', 'N/A'));
        $this->line('');

        // Créer des données de test
        $client = new Client([
            'nom' => 'Martin',
            'prenom' => 'Sophie',
            'email' => $email,
            'telephone' => '0123456789',
        ]);

        $devis = new Devis([
            'numero_devis' => 'DEV-TEST-' . time(),
            'objet' => 'Test d\'envoi d\'email - Développement site web',
            'description' => 'Test d\'envoi d\'email pour un devis de développement de site web. Ceci est un test automatique.',
            'date_devis' => now()->toDateString(),
            'date_validite' => now()->addDays(30)->toDateString(),
            'montant_ht' => 2500.00,
            'taux_tva' => 8.5,
            'montant_ttc' => 2712.50,
            'statut' => 'brouillon',
            'statut_envoi' => 'non_envoye',
            'conditions' => 'Devis valable 30 jours. Acompte de 40% à la commande.',
            'notes' => 'Ceci est un devis de test généré automatiquement.',
        ]);

        // Assigner le client au devis
        $devis->setRelation('client', $client);

        try {
            $this->info("🚀 Tentative d'envoi de l'email...");

            if ($isAdmin) {
                $this->info("📤 Envoi de l'email admin de test à : $email");

                Log::info('Test envoi email admin devis via commande', [
                    'email' => $email,
                    'devis_numero' => $devis->numero_devis,
                ]);

                Mail::to($email)->send(new DevisAdminMail($devis, $client));

                $this->info("✅ Email admin envoyé avec succès !");
            } else {
                $this->info("📤 Envoi de l'email client de test à : $email");

                $messagePersonnalise = "Bonjour Sophie,\n\nCeci est un message de test pour votre devis.\n\nVeuillez trouver ci-joint votre devis de test.\n\nCordialement,\nÉquipe Test";

                Log::info('Test envoi email client devis via commande', [
                    'email' => $email,
                    'devis_numero' => $devis->numero_devis,
                    'message_length' => strlen($messagePersonnalise),
                ]);

                Mail::to($email)->send(new DevisClientMail($devis, $client, $messagePersonnalise));

                $this->info("✅ Email client envoyé avec succès !");
            }

            $this->line('');
            $this->info("📊 Vérifications post-envoi:");
            $this->info("  - Vérifiez vos logs dans storage/logs/laravel.log");
            $this->info("  - Vérifiez votre boîte Mailtrap ou autre service de mail");
            $this->info("  - Si vous utilisez les queues, vérifiez: php artisan queue:work");

        } catch (\Exception $e) {
            $this->error("❌ Erreur lors de l'envoi de l'email :");
            $this->error("   Message: " . $e->getMessage());
            $this->error("   Fichier: " . $e->getFile() . ':' . $e->getLine());

            Log::error('Erreur test envoi email devis via commande', [
                'email' => $email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return 1;
        }

        return 0;
    }
}
