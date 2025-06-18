<?php

namespace App\Notifications;

use App\Models\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClientNotification extends Notification
{
    use Queueable;

    protected $client;
    protected $action;
    protected $message;

    /**
     * Create a new notification instance.
     */
    public function __construct(Client $client, string $action, ?string $message = null)
    {
        $this->client = $client;
        $this->action = $action;
        $this->message = $message;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        $actionMessages = [
            'created' => 'Un nouveau client a été créé',
            'updated' => 'Un client a été modifié',
            'deleted' => 'Un client a été supprimé',
        ];

        $title = $actionMessages[$this->action] ?? 'Événement client';
        $message = $this->message ?? "Client: {$this->client->prenom} {$this->client->nom}";

        return [
            'title' => $title,
            'message' => $message,
            'model_type' => 'client',
            'model_id' => $this->client->id,
            'action_url' => route('clients.show', $this->client->id),
            'icon_type' => 'client',
        ];
    }
}
