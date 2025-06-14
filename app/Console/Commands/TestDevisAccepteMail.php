<?php

namespace App\Console\Commands;

use App\Models\Devis;
use App\Models\Client;
use App\Mail\DevisAccepteMail;
use App\Mail\DevisAccepteAdminMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class TestDevisAccepteMail extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'mail:test-devis-accepte {email} {--admin : Test admin email instead of client email}';

    /**
     * The console command description.
     */
    protected $description = 'Test l\'envoi des emails de confirmation d\'acceptation de devis';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $isAdmin = $this->option('admin');

        $this->info("🧪 Test d'envoi d'email de confirmation d'acceptation de devis");
        $this->info("📧 Destination: $email");
        $this->info("🎯 Type: " . ($isAdmin ? 'Admin' : 'Client'));
        $this->line('');

        // Vérifier la configuration mail
        $this->info("📋 Configuration mail actuelle:");
        $this->info("  - Mailer: " . config('mail.default'));
        $this->info("  - Host: " . config('mail.mailers.smtp.host', 'N/A'));
        $this->info("  - Port: " . config('mail.mailers.smtp.port', 'N/A'));
        $this->info("  - From: " . config('mail.from.address', 'N/A'));
        $this->info("  - Admin Email: " . config('mail.admin_email', 'N/A'));
        $this->line('');

        // Créer des données de test
        $client = new Client([
            'nom' => 'Dupont',
            'prenom' => 'Marie',
            'email' => $email,
            'telephone' => '0123456789',
        ]);

        // Simuler un devis accepté
        $devis = new Devis([
            'numero_devis' => 'DV-25-TEST',
            'objet' => 'Développement site web e-commerce',
            'description' => 'Création d\'un site e-commerce avec paiement en ligne et gestion des stocks.',
            'conditions' => 'Paiement en 3 fois : 40% à la commande, 40% à mi-parcours, 20% à la livraison.',
            'notes' => 'Projet prioritaire - Délai souhaité : 6 semaines',
            'montant_ht' => 8500.00,
            'taux_tva' => 20.00,
            'montant_ttc' => 10200.00,
            'date_devis' => now()->subDays(7),
            'date_validite' => now()->addDays(23),
            'date_acceptation' => now(),
            'statut' => 'accepte',
        ]);

        $devis->id = 999; // ID fictif pour les tests
        $devis->setRelation('client', $client);

        try {
            $this->info("🚀 Tentative d'envoi de l'email...");

            if ($isAdmin) {
                $this->info("📤 Envoi de l'email admin de test à : $email");

                Log::info('Test envoi email admin devis accepté via commande', [
                    'email' => $email,
                    'devis_numero' => $devis->numero_devis,
                ]);

                Mail::to($email)->send(new DevisAccepteAdminMail($devis, $client));

                $this->info("✅ Email admin envoyé avec succès !");
            } else {
                $this->info("📤 Envoi de l'email client de test à : $email");

                Log::info('Test envoi email client devis accepté via commande', [
                    'email' => $email,
                    'devis_numero' => $devis->numero_devis,
                ]);

                Mail::to($email)->send(new DevisAccepteMail($devis, $client));

                $this->info("✅ Email client envoyé avec succès !");
            }

            $this->line('');
            $this->info("📊 Vérifications post-envoi:");
            $this->info("  - Vérifiez vos logs dans storage/logs/laravel.log");
            $this->info("  - Vérifiez votre boîte Mailtrap ou autre service de mail");
            $this->info("  - Si vous utilisez les queues, vérifiez: php artisan queue:work");

        } catch (\Exception $e) {
            $this->error("❌ Erreur lors de l'envoi:");
            $this->error("Type: " . get_class($e));
            $this->error("Message: " . $e->getMessage());
            $this->error("Fichier: " . $e->getFile() . ":" . $e->getLine());

            Log::error('Erreur test envoi email devis accepté', [
                'email' => $email,
                'type' => $isAdmin ? 'admin' : 'client',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return 1;
        }

        return 0;
    }
}
