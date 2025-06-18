<?php

namespace App\Notifications;

use App\Models\Service;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ServiceNotification extends Notification
{
    use Queueable;

    protected $service;
    protected $action;
    protected $message;

    public function __construct(Service $service, string $action, ?string $message = null)
    {
        $this->service = $service;
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
            'created' => 'Un nouveau service a été créé',
            'updated' => 'Un service a été modifié',
            'activated' => 'Un service a été activé',
            'deactivated' => 'Un service a été désactivé',
        ];

        $title = $actionMessages[$this->action] ?? 'Événement service';
        $message = $this->message ?? "Service: {$this->service->nom}";

        return [
            'title' => $title,
            'message' => $message,
            'model_type' => 'service',
            'model_id' => $this->service->id,
            'action_url' => route('services.show', $this->service->id),
            'icon_type' => 'service',
        ];
    }
}
