<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user()?->load('userRole'),
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'app_env' => config('app.env'),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
            ],
                        // Notifications pour les admins - TEMPORAIREMENT DÉSACTIVÉES
            'notifications' => [],
            'unreadNotificationsCount' => 0,
        ];
    }

    /**
     * Obtenir les notifications pour l'utilisateur si c'est un admin
     */
    private function getNotificationsForUser($user)
    {
        if (!$user) {
            return [];
        }

        try {
            // Charger la relation userRole avec le rôle
            $user->load('userRole');

            if ($user->userRole && in_array($user->userRole->name, ['admin', 'super_admin'])) {
                return $user->notifications()->latest()->limit(10)->get()->toArray();
            }
        } catch (\Exception $e) {
            Log::error('Erreur lors du chargement des notifications: ' . $e->getMessage());
        }

        return [];
    }

    /**
     * Obtenir le nombre de notifications non lues pour l'utilisateur si c'est un admin
     */
    private function getUnreadCountForUser($user)
    {
        if (!$user) {
            return 0;
        }

        try {
            // Charger la relation userRole avec le rôle
            $user->load('userRole');

            if ($user->userRole && in_array($user->userRole->name, ['admin', 'super_admin'])) {
                return $user->unreadNotifications()->count();
            }
        } catch (\Exception $e) {
            Log::error('Erreur lors du chargement du count notifications: ' . $e->getMessage());
        }

        return 0;
    }
}
