<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TestEmailMark extends Mailable
{
    use Queueable, SerializesModels;

    public $diagnostics;
    public $testEmail;

    /**
     * Create a new message instance.
     */
    public function __construct($diagnostics, $testEmail)
    {
        $this->diagnostics = $diagnostics;
        $this->testEmail = $testEmail;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🧪 Test Email Markdown - ' . now()->format('d/m/Y H:i:s'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.test-email',
            with: [
                'diagnostics' => $this->diagnostics,
                'testEmail' => $this->testEmail,
                'timestamp' => now()->format('d/m/Y à H:i:s'),
                'appUrl' => config('app.url'),
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
