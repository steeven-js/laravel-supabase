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
use Illuminate\Queue\SerializesModels;

class FactureAdminMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $tries = 3;  // ⭐ Limiter les tentatives
    public $timeout = 60;  // ⭐ Timeout après 60 secondes

    public Devis $devis;
    public Facture $facture;
    public Client $client;

    /**
     * Create a new message instance.
     */
    public function __construct(
        Devis $devis,
        Facture $facture,
        Client $client
    ) {
        $this->devis = $devis;
        $this->facture = $facture;
        $this->client = $client;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        // Charger l'administrateur assigné à la facture
        $this->facture->load('administrateur');

        // Utiliser l'email de l'administrateur assigné ou l'email admin par défaut
        $destinataireEmail = $this->facture->administrateur?->email ?? config('mail.admin_email', 'admin@example.com');

        return new Envelope(
            subject: "Nouvelle facture créée : {$this->facture->numero_facture}",
            to: [
                $destinataireEmail
            ],
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.facture.admin',
            with: [
                'devis' => $this->devis,
                'facture' => $this->facture,
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
