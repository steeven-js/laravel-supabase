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
        return new Envelope(
            subject: "Votre facture {$this->facture->numero_facture} - {$this->devis->objet}",
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
        // TODO: Ajouter la facture PDF en pièce jointe
        return [
            // Attachment::fromPath('/path/to/facture.pdf')
            //     ->as("Facture_{$this->facture->numero_facture}.pdf")
            //     ->withMime('application/pdf'),
        ];
    }
}
