<?php

namespace App\Mail;

use App\Models\Devis;
use App\Models\Client;
use App\Services\DevisPdfService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class DevisClientMail extends Mailable
{
    use Queueable, SerializesModels;

    public Devis $devis;
    public Client $client;
    public ?string $messagePersonnalise;
    public ?int $templateId;
    protected DevisPdfService $pdfService;

    /**
     * Create a new message instance.
     */
    public function __construct(
        Devis $devis,
        Client $client,
        string $messagePersonnalise = null,
        int $templateId = null
    ) {
        $this->devis = $devis;
        $this->client = $client;
        $this->messagePersonnalise = $messagePersonnalise;
        $this->templateId = $templateId;
        $this->pdfService = app(DevisPdfService::class);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = "Votre devis {$this->devis->numero_devis} - {$this->devis->objet}";

        // Utiliser le sujet du template personnalisé seulement si pas de message personnalisé complet
        if ($this->templateId && (empty($this->messagePersonnalise) || trim($this->messagePersonnalise) === '')) {
            Log::info('Template personnalisé détecté dans envelope()', ['template_id' => $this->templateId]);
            $template = \App\Models\EmailTemplate::find($this->templateId);
            if ($template) {
                Log::info('Template trouvé en base', ['template_name' => $template->name]);
                $donnees = $this->prepareTemplateData();
                $processed = $template->processTemplate($donnees);
                $subject = $processed['subject'];
                Log::info('Sujet personnalisé appliqué', ['subject' => $subject]);
            } else {
                Log::warning('Template non trouvé en base', ['template_id' => $this->templateId]);
            }
        } else {
            Log::info('Utilisation du sujet par défaut (message personnalisé ou pas de template)', [
                'has_custom_message' => !empty($this->messagePersonnalise),
                'template_id' => $this->templateId
            ]);
        }

        return new Envelope(
            subject: $subject,
            to: [
                $this->client->email
            ],
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
                        // Prioriser le message personnalisé de l'utilisateur s'il existe
        if (!empty($this->messagePersonnalise) && trim($this->messagePersonnalise) !== '') {
            Log::info('Message personnalisé détecté, utilisation du message de l\'utilisateur', [
                'message_length' => strlen($this->messagePersonnalise),
                'template_id' => $this->templateId
            ]);

            return new Content(
                markdown: 'emails.devis.client-custom',
                with: [
                    'contenuPersonnalise' => $this->messagePersonnalise,
                    'devis' => $this->devis,
                    'client' => $this->client,
                    'messagePersonnalise' => $this->messagePersonnalise,
                    'urlPdfSupabase' => $this->pdfService->getUrlSupabasePdf($this->devis),
                    'urlPdfLocal' => $this->pdfService->getUrlPdf($this->devis),
                ],
            );
        }

        // Si pas de message personnalisé mais template sélectionné, utiliser le template
        if ($this->templateId) {
            Log::info('Template personnalisé détecté sans message personnalisé', ['template_id' => $this->templateId]);
            $template = \App\Models\EmailTemplate::find($this->templateId);
            if ($template) {
                Log::info('Template trouvé, utilisation du template de la base', ['template_name' => $template->name]);
                $donnees = $this->prepareTemplateData();
                Log::info('Données préparées pour le template', ['donnees' => $donnees]);
                $processed = $template->processTemplate($donnees);
                Log::info('Template traité', ['processed_body' => substr($processed['body'], 0, 200) . '...']);

                return new Content(
                    markdown: 'emails.devis.client-custom',
                    with: [
                        'contenuPersonnalise' => $processed['body'],
                        'devis' => $this->devis,
                        'client' => $this->client,
                        'messagePersonnalise' => $this->messagePersonnalise,
                        'urlPdfSupabase' => $this->pdfService->getUrlSupabasePdf($this->devis),
                        'urlPdfLocal' => $this->pdfService->getUrlPdf($this->devis),
                    ],
                );
            } else {
                Log::warning('Template non trouvé en base dans content()', ['template_id' => $this->templateId]);
            }
        } else {
            Log::info('Aucun template personnalisé dans content(), utilisation du template par défaut');
        }

        // Sinon, utiliser le template par défaut
        return new Content(
            markdown: 'emails.devis.client',
            with: [
                'devis' => $this->devis,
                'client' => $this->client,
                'messagePersonnalise' => $this->messagePersonnalise,
                'urlPdfSupabase' => $this->pdfService->getUrlSupabasePdf($this->devis),
                'urlPdfLocal' => $this->pdfService->getUrlPdf($this->devis),
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        $attachments = [];

        // Ajouter le PDF en pièce jointe si disponible
        $cheminPdf = $this->pdfService->getCheminPdf($this->devis);

        if ($cheminPdf && file_exists($cheminPdf)) {
            $attachments[] = Attachment::fromPath($cheminPdf)
                ->as("Devis_{$this->devis->numero_devis}.pdf")
                ->withMime('application/pdf');
        }

        return $attachments;
    }

    /**
     * Préparer les données pour le remplacement des variables du template
     */
    private function prepareTemplateData(): array
    {
        $madinia = \App\Models\Madinia::getInstance();

        return [
            // Format simple accolade (nouveau format)
            'nom_client' => $this->client->prenom . ' ' . $this->client->nom,
            'prenom_client' => $this->client->prenom,
            'numero_devis' => $this->devis->numero_devis,
            'numero_commande' => 'CMD-' . $this->devis->numero_devis,
            'objet_devis' => $this->devis->objet,
            'montant_ttc' => number_format($this->devis->montant_ttc, 2, ',', ' ') . ' €',

            // Format double accolade (ancien format) - pour compatibilité
            'client_nom' => $this->client->prenom . ' ' . $this->client->nom,
            'client_prenom' => $this->client->prenom,
            'client_email' => $this->client->email,
            'entreprise_nom' => $madinia ? $madinia->name : 'Votre Entreprise',
            'devis_numero' => $this->devis->numero_devis,
            'devis_objet' => $this->devis->objet,
            'devis_montant' => number_format($this->devis->montant_ttc, 2, ',', ' ') . ' €',
            'devis_montant_ht' => number_format($this->devis->montant_ht, 2, ',', ' ') . '€',
            'devis_montant_ttc' => number_format($this->devis->montant_ttc, 2, ',', ' ') . '€',
            'devis_taux_tva' => $this->devis->taux_tva,
            'devis_date' => \Carbon\Carbon::parse($this->devis->date_devis)->format('d/m/Y'),
            'devis_validite' => \Carbon\Carbon::parse($this->devis->date_validite)->format('d/m/Y'),
            'contact_nom' => $madinia ? $madinia->name : '',
            'contact_email' => $madinia ? $madinia->email : '',
            'contact_telephone' => $madinia ? $madinia->telephone : '',
            'message_personnalise' => $this->messagePersonnalise ?? '',
        ];
    }
}
