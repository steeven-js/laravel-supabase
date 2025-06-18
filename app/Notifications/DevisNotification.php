<?php

namespace App\Notifications;

use App\Models\Devis;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class DevisNotification extends Notification
{
    use Queueable;

    protected $devis;
    protected $action;
    protected $message;

    public function __construct(Devis $devis, string $action, ?string $message = null)
    {
        $this->devis = $devis;
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
            'created' => 'Un nouveau devis a été créé',
            'updated' => 'Un devis a été modifié',
            'accepted' => 'Un devis a été accepté',
            'refused' => 'Un devis a été refusé',
            'sent' => 'Un devis a été envoyé au client',
            'status_changed' => 'Le statut d\'un devis a changé',
        ];

        $title = $actionMessages[$this->action] ?? 'Événement devis';
        $message = $this->message ?? "Devis #{$this->devis->numero_devis} - {$this->devis->client->prenom} {$this->devis->client->nom}";

        return [
            'title' => $title,
            'message' => $message,
            'model_type' => 'devis',
            'model_id' => $this->devis->id,
            'action_url' => route('devis.show', $this->devis->id),
            'icon_type' => 'devis',
        ];
    }
}
