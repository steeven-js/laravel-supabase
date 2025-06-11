<?php

namespace App\Mail;

use App\Models\Devis;
use App\Models\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DevisAdminMail extends Mailable
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
        return [];
    }
}
