<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * Afficher toutes les notifications de l'utilisateur
     */
    public function index(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate(20);

        return Inertia::render('notifications/Index', [
            'notifications' => $notifications
        ]);
    }

    /**
     * Marquer une notification comme lue
     */
    public function markAsRead(Request $request, $notificationId)
    {
        $notification = $request->user()
            ->notifications()
            ->find($notificationId);

        if ($notification) {
            $notification->markAsRead();
        }

        return back();
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllAsRead(Request $request)
    {
        $request->user()
            ->unreadNotifications
            ->markAsRead();

        return back();
    }

    /**
     * Obtenir les notifications pour le header (API)
     */
    public function getForHeader(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->limit(10)
            ->get();

        $unreadCount = $request->user()
            ->unreadNotifications()
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unreadCount' => $unreadCount
        ]);
    }
}
