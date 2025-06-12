<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class SupabaseRealtimeService
{
    private string $supabaseUrl;
    private string $supabaseAnonKey;
    private string $supabaseServiceKey;

    public function __construct()
    {
        $this->supabaseUrl = config('database.connections.supabase.url', env('SUPABASE_URL'));
        $this->supabaseAnonKey = env('SUPABASE_ANON_KEY');
        $this->supabaseServiceKey = env('SUPABASE_SERVICE_ROLE_KEY');
    }

    /**
     * Publier un changement en temps réel
     */
    public function publishChange(string $table, string $event, array $data, ?int $userId = null): bool
    {
        try {
            // Publier via SSE (stockage temporaire)
            $this->publishSSEEvent($table . '_' . $event, $data, $userId);

            // Optionnel : aussi publier via Supabase si configuré
            if ($this->supabaseUrl && $this->supabaseServiceKey) {
                $payload = [
                    'table' => $table,
                    'event' => $event,
                    'data' => $data,
                    'user_id' => $userId,
                    'timestamp' => now()->toISOString()
                ];

                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->supabaseServiceKey,
                    'Content-Type' => 'application/json',
                    'apikey' => $this->supabaseAnonKey
                ])->post($this->supabaseUrl . '/rest/v1/rpc/broadcast_change', $payload);

                return $response->successful();
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Erreur lors de la publication real-time', [
                'error' => $e->getMessage(),
                'table' => $table,
                'event' => $event
            ]);
            return false;
        }
    }

    /**
     * Publier un événement SSE
     */
    private function publishSSEEvent(string $eventType, array $data, ?int $userId = null): void
    {
        $eventData = [
            'type' => $eventType,
            'data' => $data,
            'user_id' => $userId,
            'timestamp' => now()->toISOString()
        ];

        // Stocker l'événement dans le cache pour les connexions SSE actives
        $cacheKey = 'sse_events_' . now()->format('Y-m-d-H-i');
        $events = Cache::get($cacheKey, []);
        $events[] = $eventData;

        // Garder seulement les 100 derniers événements et expirer après 1 heure
        $events = array_slice($events, -100);
        Cache::put($cacheKey, $events, 3600);

        // Aussi stocker dans une clé globale pour les connexions actives
        Cache::put('latest_sse_event', $eventData, 60);
    }

    /**
     * Obtenir les événements SSE récents
     */
    public function getRecentSSEEvents(int $since = 0): array
    {
        $cacheKey = 'sse_events_' . now()->format('Y-m-d-H-i');
        $events = Cache::get($cacheKey, []);

        // Filtrer les événements depuis un timestamp donné
        if ($since > 0) {
            $events = array_filter($events, function($event) use ($since) {
                return strtotime($event['timestamp']) > $since;
            });
        }

        return array_values($events);
    }

    /**
     * Obtenir le dernier événement SSE
     */
    public function getLatestSSEEvent(): ?array
    {
        return Cache::get('latest_sse_event');
    }

    /**
     * Publier un changement d'ordre des todos
     */
    public function publishTodoReorder(int $clientId, array $todos, int $userId): bool
    {
        return $this->publishChange('todos', 'reorder', [
            'client_id' => $clientId,
            'todos' => $todos
        ], $userId);
    }

    /**
     * Publier une création de todo
     */
    public function publishTodoCreated(array $todo, int $userId): bool
    {
        return $this->publishChange('todos', 'created', $todo, $userId);
    }

    /**
     * Publier une mise à jour de todo
     */
    public function publishTodoUpdated(array $todo, int $userId): bool
    {
        return $this->publishChange('todos', 'updated', $todo, $userId);
    }

    /**
     * Publier une suppression de todo
     */
    public function publishTodoDeleted(int $todoId, int $clientId, int $userId): bool
    {
        return $this->publishChange('todos', 'deleted', [
            'id' => $todoId,
            'client_id' => $clientId
        ], $userId);
    }

    /**
     * Publier un toggle de statut
     */
    public function publishTodoToggled(int $todoId, bool $termine, int $clientId, int $userId): bool
    {
        return $this->publishChange('todos', 'toggled', [
            'id' => $todoId,
            'termine' => $termine,
            'client_id' => $clientId
        ], $userId);
    }

    /**
     * Obtenir l'URL WebSocket pour les connexions real-time
     */
    public function getWebSocketUrl(): string
    {
        $wsUrl = str_replace(['https://', 'http://'], ['wss://', 'ws://'], $this->supabaseUrl);
        return $wsUrl . '/realtime/v1/websocket?apikey=' . $this->supabaseAnonKey . '&vsn=1.0.0';
    }

    /**
     * Obtenir la configuration pour le client JavaScript
     */
    public function getClientConfig(): array
    {
        return [
            'url' => $this->supabaseUrl,
            'anon_key' => $this->supabaseAnonKey,
            'realtime_url' => $this->getWebSocketUrl()
        ];
    }
}
