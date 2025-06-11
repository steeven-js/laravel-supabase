<?php

namespace App\Console\Commands;

use App\Models\Devis;
use App\Models\Facture;
use App\Models\Client;
use App\Mail\FactureClientMail;
use App\Mail\FactureAdminMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestMailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test-facture {email} {--admin : Test admin email instead of client email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test l\'envoi des emails de facture';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $isAdmin = $this->option('admin');

        // Créer des données de test
        $client = new Client([
            'nom' => 'Dupont',
            'prenom' => 'Jean',
            'email' => $email,
            'telephone' => '0123456789',
        ]);

        $devis = new Devis([
            'numero_devis' => 'DEV-TEST-001',
            'objet' => 'Test de devis pour l\'envoi d\'email',
            'description' => 'Description de test pour le devis',
            'montant_ht' => 1000.00,
            'taux_tva' => 20.0,
            'montant_ttc' => 1200.00,
        ]);

        $facture = new Facture([
            'numero_facture' => 'FAC-TEST-001',
            'date_facture' => now()->toDateString(),
            'date_echeance' => now()->addDays(30)->toDateString(),
            'objet' => 'Test de facture pour l\'envoi d\'email',
            'description' => 'Description de test pour la facture',
            'montant_ht' => 1000.00,
            'taux_tva' => 20.0,
            'montant_ttc' => 1200.00,
            'statut' => 'brouillon',
            'conditions_paiement' => 'Paiement à 30 jours par virement bancaire.',
            'notes' => 'Ceci est une facture de test.',
        ]);

        try {
            if ($isAdmin) {
                $this->info("Envoi de l'email admin de test à : $email");
                Mail::to($email)->send(new FactureAdminMail($devis, $facture, $client));
                $this->info("✅ Email admin envoyé avec succès !");
            } else {
                $this->info("Envoi de l'email client de test à : $email");
                $messagePersonnalise = "Bonjour Jean,\n\nCeci est un message de test pour votre facture.\n\nCordialement";
                Mail::to($email)->send(new FactureClientMail($devis, $facture, $client, $messagePersonnalise));
                $this->info("✅ Email client envoyé avec succès !");
            }
        } catch (\Exception $e) {
            $this->error("❌ Erreur lors de l'envoi de l'email : " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
