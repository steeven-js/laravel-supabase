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

class DevisAdminMail extends Mailable
{
    use Queueable, SerializesModels;

    public Devis $devis;
    public Client $client;
    public string $urlDevis;
    protected DevisPdfService $pdfService;

    /**
     * Create a new message instance.
     */
    public function __construct(
        Devis $devis,
        Client $client,
        string $urlDevis
    ) {
        $this->devis = $devis;
        $this->client = $client;
        $this->urlDevis = $urlDevis;
        $this->pdfService = app(DevisPdfService::class);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $adminEmail = config('mail.admin_email', 'admin@example.com');

        return new Envelope(
            subject: "Nouveau devis créé : {$this->devis->numero_devis}",
            to: [
                $adminEmail
            ],
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.devis.admin',
            with: [
                'devis' => $this->devis,
                'client' => $this->client,
                'urlDevis' => $this->urlDevis,
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
}
