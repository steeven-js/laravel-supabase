<?php

namespace App\Notifications;

use App\Models\Facture;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class FactureNotification extends Notification
{
    use Queueable;

    protected $facture;
    protected $action;
    protected $message;

    public function __construct(Facture $facture, string $action, ?string $message = null)
    {
        $this->facture = $facture;
        $this->action = $action;
        $this->message = $message;
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        $actionMessages = [
            'created' => 'Une nouvelle facture a été créée',
            'updated' => 'Une facture a été modifiée',
            'paid' => 'Une facture a été payée',
            'sent' => 'Une facture a été envoyée au client',
            'status_changed' => 'Le statut d\'une facture a changé',
        ];

        $title = $actionMessages[$this->action] ?? 'Événement facture';
        $message = $this->message ?? "Facture #{$this->facture->numero_facture} - {$this->facture->client->prenom} {$this->facture->client->nom}";

        return [
            'title' => $title,
            'message' => $message,
            'model_type' => 'facture',
            'model_id' => $this->facture->id,
            'action_url' => route('factures.show', $this->facture->id),
            'icon_type' => 'facture',
        ];
    }
}
