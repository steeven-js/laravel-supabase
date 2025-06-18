<?php

namespace App\Notifications;

use App\Models\Entreprise;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class EntrepriseNotification extends Notification
{
    use Queueable;

    protected $entreprise;
    protected $action;
    protected $message;

    public function __construct(Entreprise $entreprise, string $action, ?string $message = null)
    {
        $this->entreprise = $entreprise;
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
            'created' => 'Une nouvelle entreprise a été créée',
            'updated' => 'Une entreprise a été modifiée',
            'deleted' => 'Une entreprise a été supprimée',
        ];

        $title = $actionMessages[$this->action] ?? 'Événement entreprise';
        $message = $this->message ?? "Entreprise: {$this->entreprise->nom}";

        return [
            'title' => $title,
            'message' => $message,
            'model_type' => 'entreprise',
            'model_id' => $this->entreprise->id,
            'action_url' => route('entreprises.show', $this->entreprise->id),
            'icon_type' => 'entreprise',
        ];
    }
}
