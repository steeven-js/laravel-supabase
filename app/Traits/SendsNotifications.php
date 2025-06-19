<?php

namespace App\Traits;

use App\Models\User;
use App\Notifications\AdminNotification;
use App\Notifications\ClientNotification;
use App\Notifications\EntrepriseNotification;
use App\Notifications\DevisNotification;
use App\Notifications\FactureNotification;
use App\Notifications\ServiceNotification;

trait SendsNotifications
{
    protected static $notificationsDisabled = false;

    /**
     * Désactiver temporairement les notifications automatiques
     */
    public static function disableNotifications()
    {
        static::$notificationsDisabled = true;
    }

    /**
     * Réactiver les notifications automatiques
     */
    public static function enableNotifications()
    {
        static::$notificationsDisabled = false;
    }

    protected static function bootSendsNotifications()
    {
        // Événement lors de la création
        static::created(function ($model) {
            if (!static::$notificationsDisabled) {
                static::sendNotificationToAdmins($model, 'created');
            }
        });

        // Événement lors de la mise à jour
        static::updated(function ($model) {
            if (!static::$notificationsDisabled) {
                static::sendNotificationToAdmins($model, 'updated');
            }
        });

        // Événement lors de la suppression
        static::deleted(function ($model) {
            if (!static::$notificationsDisabled) {
                static::sendNotificationToAdmins($model, 'deleted');
            }
        });
    }

    /**
     * Envoie une notification à tous les administrateurs
     */
    protected static function sendNotificationToAdmins($model, string $action, ?string $customMessage = null)
    {
        $admins = User::whereHas('userRole', function ($query) {
            $query->whereIn('name', ['admin', 'super_admin']);
        })->get();

        if ($admins->isEmpty()) {
            return;
        }

        $notificationClass = static::getNotificationClass($model);

        if ($notificationClass) {
            foreach ($admins as $admin) {
                $admin->notify(new $notificationClass($model, $action, $customMessage));
            }
        }
    }

    /**
     * Détermine la classe de notification à utiliser selon le modèle
     */
    protected static function getNotificationClass($model): ?string
    {
        $modelClass = get_class($model);

        return match($modelClass) {
            \App\Models\Client::class => ClientNotification::class,
            \App\Models\Entreprise::class => EntrepriseNotification::class,
            \App\Models\Devis::class => DevisNotification::class,
            \App\Models\Facture::class => FactureNotification::class,
            \App\Models\Service::class => ServiceNotification::class,
            default => null,
        };
    }

    /**
     * Méthode pour envoyer des notifications personnalisées
     */
    public function sendCustomNotification(string $action, ?string $message = null)
    {
        static::sendNotificationToAdmins($this, $action, $message);
    }
}
