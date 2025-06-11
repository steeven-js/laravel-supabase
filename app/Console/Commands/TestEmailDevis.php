<?php

namespace App\Console\Commands;

use App\Models\Devis;
use App\Mail\DevisClientMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class TestEmailDevis extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:email-devis {devis_id} {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test l\'envoi d\'email avec PDF en pièce jointe pour un devis';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $devisId = $this->argument('devis_id');
        $email = $this->argument('email');

        try {
            $devis = Devis::with('client.entreprise')->find($devisId);

            if (!$devis) {
                $this->error("Devis avec l'ID {$devisId} non trouvé.");
                return 1;
            }

            $this->info("Test d'envoi d'email pour le devis {$devis->numero_devis}");
            $this->info("Destinataire : {$email}");

            // Vérifier si le PDF existe
            $pdfService = app(\App\Services\DevisPdfService::class);
            $cheminPdf = $pdfService->getCheminPdf($devis);

            if (!$cheminPdf || !file_exists($cheminPdf)) {
                $this->warn("PDF non trouvé, génération en cours...");
                $nomFichierPdf = $pdfService->genererEtSauvegarder($devis);
                $devis->pdf_file = $nomFichierPdf;
                $devis->save();
                $this->info("PDF généré : {$nomFichierPdf}");
            } else {
                $tailleFichier = filesize($cheminPdf);
                $this->info("PDF trouvé : {$cheminPdf} ({$tailleFichier} bytes)");
            }

            // Test d'envoi d'email
            $messageTest = "Ceci est un email de test envoyé via la commande test:email-devis. Le PDF doit être en pièce jointe.";

            $this->info("Envoi de l'email en cours...");

            // Utiliser Log pour capturer les détails
            Log::info('=== TEST ENVOI EMAIL DEVIS ===', [
                'devis_id' => $devis->id,
                'devis_numero' => $devis->numero_devis,
                'email_test' => $email,
                'pdf_file' => $devis->pdf_file,
                'pdf_path' => $cheminPdf,
            ]);

            Mail::to($email)->send(new DevisClientMail(
                $devis,
                $devis->client,
                $messageTest
            ));

            $this->info("✅ Email envoyé avec succès !");
            $this->info("Vérifiez votre boîte email : {$email}");
            $this->info("Le PDF {$devis->numero_devis} doit être en pièce jointe.");

            return 0;

        } catch (\Exception $e) {
            $this->error("❌ Erreur lors de l'envoi : " . $e->getMessage());
            Log::error('Erreur test email devis', [
                'devis_id' => $devisId,
                'email' => $email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return 1;
        }
    }
}
