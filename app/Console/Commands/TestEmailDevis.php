<?php

namespace App\Console\Commands;

use App\Models\Devis;
use App\Mail\DevisClientMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestEmailDevis extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:test-devis {devis_id : ID du devis à envoyer} {--email= : Email de destination (optionnel)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Teste l\'envoi d\'email de devis avec PDF en pièce jointe';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $devisId = $this->argument('devis_id');
        $emailDestination = $this->option('email');

        $this->info("📧 Test d'envoi d'email pour le devis ID: {$devisId}");
        $this->newLine();

        // Récupérer le devis
        $devis = Devis::with(['client.entreprise'])->find($devisId);

        if (!$devis) {
            $this->error("❌ Devis avec l'ID {$devisId} introuvable.");
            return 1;
        }

        $this->info("✅ Devis trouvé: {$devis->numero_devis}");
        $this->info("👤 Client: {$devis->client->prenom} {$devis->client->nom}");
        $this->info("📧 Email: {$devis->client->email}");

        // Vérifier si le PDF existe
        $pdfService = app(\App\Services\DevisPdfService::class);
        $cheminPdf = $pdfService->getCheminPdf($devis);
        $urlSupabase = $pdfService->getUrlSupabasePdf($devis);

        if ($cheminPdf && file_exists($cheminPdf)) {
            $this->info("📄 PDF local: ✅ Disponible");
            $taillePdf = filesize($cheminPdf);
            $this->info("📏 Taille: " . $this->formatBytes($taillePdf));
        } else {
            $this->warn("📄 PDF local: ❌ Non trouvé");
        }

        if ($urlSupabase) {
            $this->info("🔗 URL Supabase: {$urlSupabase}");
        } else {
            $this->warn("🔗 URL Supabase: ❌ Non configurée");
        }

        $this->newLine();

        // Demander confirmation
        $emailDestinationFinal = $emailDestination ?: $devis->client->email;

        if (!$this->confirm("Envoyer l'email de test à {$emailDestinationFinal} ?")) {
            $this->info("Test annulé.");
            return 0;
        }

                // Préparer l'email
        try {
            $this->info("📨 Préparation de l'email...");

            $client = $devis->client;

            // Si un email personnalisé est fourni, créer un clone du client
            if ($emailDestination) {
                $client = clone $client;
                $client->email = $emailDestination;
            }

            $this->info("🏗️ Création de l'objet DevisClientMail...");
            $mail = new DevisClientMail(
                $devis,
                $client,
                "Ceci est un email de test envoyé via la commande artisan. 🧪"
            );

            $this->info("📎 Vérification des pièces jointes...");
            $attachments = $mail->attachments();
            $this->info("📎 Nombre de pièces jointes: " . count($attachments));

            $this->info("📤 Envoi en cours...");

            // Augmenter le timeout pour l'envoi
            ini_set('max_execution_time', 120);

            // Utiliser to() au lieu de send() pour plus de contrôle
            Mail::to($emailDestinationFinal)->send($mail);

            $this->newLine();
            $this->info("🎉 Email envoyé avec succès !");
            $this->info("📧 Destinataire: {$emailDestinationFinal}");
            $this->info("📄 Pièce jointe: " . ($cheminPdf ? "✅ PDF inclus" : "❌ Pas de PDF"));
            $this->info("🔗 Lien Supabase: " . ($urlSupabase ? "✅ Inclus" : "❌ Non disponible"));

        } catch (\Exception $e) {
            $this->error("❌ Erreur lors de l'envoi:");
            $this->error("Type: " . get_class($e));
            $this->error("Message: " . $e->getMessage());
            $this->error("Fichier: " . $e->getFile() . ":" . $e->getLine());

            // Afficher plus de détails si c'est une erreur de mail
            if (method_exists($e, 'getCode')) {
                $this->error("Code: " . $e->getCode());
            }

            return 1;
        }

        return 0;
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
