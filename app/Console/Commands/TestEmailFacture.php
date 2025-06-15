<?php

namespace App\Console\Commands;

use App\Models\Facture;
use App\Mail\FactureClientMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class TestEmailFacture extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:email-facture {facture_id} {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test l\'envoi d\'email avec PDF en pièce jointe pour une facture';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $factureId = $this->argument('facture_id');
        $email = $this->argument('email');

        try {
            $facture = Facture::with('client.entreprise', 'devis')->find($factureId);

            if (!$facture) {
                $this->error("Facture avec l'ID {$factureId} non trouvée.");
                return 1;
            }

            $this->info("Test d'envoi d'email pour la facture {$facture->numero_facture}");
            $this->info("Destinataire : {$email}");

            // Vérifier si le PDF existe
            $pdfService = app(\App\Services\FacturePdfService::class);
            $cheminPdf = $pdfService->getCheminPdf($facture);

            if (!$cheminPdf || !file_exists($cheminPdf)) {
                $this->warn("PDF non trouvé, génération en cours...");
                $nomFichierPdf = $pdfService->genererEtSauvegarder($facture);
                $facture->pdf_file = $nomFichierPdf;
                $facture->save();
                $this->info("PDF généré : {$nomFichierPdf}");
            } else {
                $tailleFichier = filesize($cheminPdf);
                $this->info("PDF trouvé : {$cheminPdf} ({$tailleFichier} bytes)");
            }

            // Test d'envoi d'email
            $messageTest = "Ceci est un email de test envoyé via la commande test:email-facture. Le PDF doit être en pièce jointe.";

            $this->info("Envoi de l'email en cours...");

            // Utiliser Log pour capturer les détails
            Log::info('=== TEST ENVOI EMAIL FACTURE ===', [
                'facture_id' => $facture->id,
                'facture_numero' => $facture->numero_facture,
                'email_test' => $email,
                'pdf_file' => $facture->pdf_file,
                'pdf_path' => $cheminPdf,
            ]);

            // Créer un devis fictif pour la compatibilité
            $devis = $facture->devis ?? new \App\Models\Devis([
                'numero_devis' => 'N/A',
                'objet' => $facture->objet
            ]);

            Mail::to($email)->send(new FactureClientMail(
                $devis,
                $facture,
                $facture->client,
                $messageTest
            ));

            $this->info("✅ Email envoyé avec succès !");
            $this->info("Vérifiez votre boîte email : {$email}");
            $this->info("Le PDF {$facture->numero_facture} doit être en pièce jointe.");

            return 0;

        } catch (\Exception $e) {
            $this->error("❌ Erreur lors de l'envoi : " . $e->getMessage());
            Log::error('Erreur test email facture', [
                'facture_id' => $factureId,
                'email' => $email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return 1;
        }
    }
}
