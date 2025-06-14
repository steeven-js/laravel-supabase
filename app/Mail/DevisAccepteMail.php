<?php

namespace App\Mail;

use App\Models\Devis;
use App\Models\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Support\Facades\Storage;

class DevisAccepteMail extends Mailable
{
    use Queueable, SerializesModels;

    public Devis $devis;
    public Client $client;

    /**
     * Create a new message instance.
     */
    public function __construct(
        Devis $devis,
        Client $client
    ) {
        $this->devis = $devis;
        $this->client = $client;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Confirmation d'acceptation de votre devis {$this->devis->numero_devis}",
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
            markdown: 'emails.devis.accepte',
            with: [
                'devis' => $this->devis,
                'client' => $this->client,
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

        // Ajouter le PDF du devis en pièce jointe si disponible
        if ($this->devis->pdf_file && Storage::disk('public')->exists($this->devis->pdf_file)) {
            $attachments[] = Attachment::fromStorageDisk('public', $this->devis->pdf_file)
                ->as($this->devis->numero_devis . '.pdf')
                ->withMime('application/pdf');
        }

        return $attachments;
    }
}