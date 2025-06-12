<?php

namespace App\Mail;

use App\Models\Client;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ClientEmailMailable extends Mailable
{
    use Queueable, SerializesModels;

    public Client $client;
    public User $user;
    public string $objet;
    public string $contenu;

    /**
     * Create a new message instance.
     */
    public function __construct(
        Client $client,
        User $user,
        string $objet,
        string $contenu
    ) {
        $this->client = $client;
        $this->user = $user;
        $this->objet = $objet;
        $this->contenu = $contenu;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        Log::info('Envoi email client', [
            'client_email' => $this->client->email,
            'client_nom' => $this->client->nom_complet,
            'user_name' => $this->user->name,
            'objet' => $this->objet
        ]);

        return new Envelope(
            subject: $this->objet,
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
            markdown: 'emails.client.custom',
            with: [
                'client' => $this->client,
                'user' => $this->user,
                'objet' => $this->objet,
                'contenu' => $this->contenu,
                'madinia' => \App\Models\Madinia::getInstance(),
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
