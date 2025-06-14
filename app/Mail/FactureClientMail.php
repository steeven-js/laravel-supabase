<?php

namespace App\Mail;

use App\Models\Devis;
use App\Models\Facture;
use App\Models\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class FactureClientMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Devis $devis;
    public Facture $facture;
    public Client $client;
    public ?string $messagePersonnalise;

    /**
     * Create a new message instance.
     */
    public function __construct(
        Devis $devis,
        Facture $facture,
        Client $client,
        string $messagePersonnalise = null
    ) {
        $this->devis = $devis;
        $this->facture = $facture;
        $this->client = $client;
        $this->messagePersonnalise = $messagePersonnalise;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        // Charger l'administrateur assigné à la facture
        $this->facture->load('administrateur');

        $envelope = new Envelope(
            subject: "Votre facture {$this->facture->numero_facture} - {$this->devis->objet}",
            to: [
                $this->client->email
            ],
        );

        // Utiliser l'email de l'administrateur assigné comme expéditeur si disponible
        if ($this->facture->administrateur) {
            $envelope->from(
                $this->facture->administrateur->email,
                $this->facture->administrateur->name
            );
        }

        return $envelope;
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.facture.client',
            with: [
                'devis' => $this->devis,
                'facture' => $this->facture,
                'client' => $this->client,
                'messagePersonnalise' => $this->messagePersonnalise,
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

        // Ajouter la facture PDF en pièce jointe si elle existe
        if ($this->facture->pdf_file) {
            $cheminPdf = storage_path("app/pdfs/factures/{$this->facture->pdf_file}");

            if (file_exists($cheminPdf)) {
                $attachments[] = Attachment::fromPath($cheminPdf)
                    ->as("Facture_{$this->facture->numero_facture}.pdf")
                    ->withMime('application/pdf');
            }
        }

        return $attachments;
    }
}
