<?php

namespace App\Mail;

use App\Models\Devis;
use App\Models\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DevisClientMail extends Mailable
{
    use Queueable, SerializesModels;

    public Devis $devis;
    public Client $client;
    public ?string $messagePersonnalise;

    /**
     * Create a new message instance.
     */
    public function __construct(
        Devis $devis,
        Client $client,
        string $messagePersonnalise = null
    ) {
        $this->devis = $devis;
        $this->client = $client;
        $this->messagePersonnalise = $messagePersonnalise;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Votre devis {$this->devis->numero_devis} - {$this->devis->objet}",
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
            markdown: 'emails.devis.client',
            with: [
                'devis' => $this->devis,
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
        // TODO: Ajouter le devis PDF en pièce jointe
        return [
            // Attachment::fromPath('/path/to/devis.pdf')
            //     ->as("Devis_{$this->devis->numero_devis}.pdf")
            //     ->withMime('application/pdf'),
        ];
    }
}
