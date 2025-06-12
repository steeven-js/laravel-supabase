<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SupabaseRealtimeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RealtimeController extends Controller
{
    protected SupabaseRealtimeService $realtimeService;

    public function __construct(SupabaseRealtimeService $realtimeService)
    {
        $this->realtimeService = $realtimeService;
    }

    /**
     * Obtenir la configuration Supabase pour le client
     */
    public function config(): JsonResponse
    {
        return response()->json([
            'config' => $this->realtimeService->getClientConfig(),
            'user_id' => Auth::id(),
            'user_name' => Auth::user()->name
        ]);
    }

    /**
     * Endpoint pour tester la connexion real-time
     */
    public function test(): JsonResponse
    {
        // Publier un événement de test
        $success = $this->realtimeService->publishChange('test', 'ping', [
            'message' => 'Test de connexion SSE',
            'user' => Auth::user()->name,
            'timestamp' => now()->toISOString()
        ], Auth::id());

        // Aussi tester un événement todo fictif pour vérifier le système
        $this->realtimeService->publishChange('todos', 'test_event', [
            'message' => 'Test événement todo',
            'client_id' => request('client_id', 1),
            'user' => Auth::user()->name
        ], Auth::id());

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Événements de test publiés avec succès' : 'Erreur lors du test',
            'events_published' => 2
        ]);
    }

        /**
     * Stream d'événements Server-Sent Events pour le real-time
     */
    public function stream(): StreamedResponse
    {
        $response = new StreamedResponse();
        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        $response->headers->set('Connection', 'keep-alive');
        $response->headers->set('X-Accel-Buffering', 'no'); // Nginx

        $response->setCallback(function () {
            // Envoyer un ping initial
            echo "data: " . json_encode([
                'type' => 'connected',
                'timestamp' => now()->toISOString()
            ]) . "\n\n";

            if (ob_get_level()) {
                ob_end_flush();
            }
            flush();

            // Variables pour le suivi des événements
            $lastEventTime = time();
            $lastCheck = time();

            while (true) {
                $currentTime = time();

                // Vérifier les nouveaux événements toutes les secondes
                if ($currentTime - $lastCheck >= 1) {
                    // Obtenir les événements récents depuis la dernière vérification
                    $recentEvents = $this->realtimeService->getRecentSSEEvents($lastEventTime);

                    foreach ($recentEvents as $event) {
                        // Ignorer ses propres événements
                        if ($event['user_id'] !== Auth::id()) {
                            echo "data: " . json_encode($event) . "\n\n";

                            if (ob_get_level()) {
                                ob_end_flush();
                            }
                            flush();
                        }
                    }

                    $lastCheck = $currentTime;
                    $lastEventTime = $currentTime;
                }

                // Envoyer un heartbeat toutes les 30 secondes
                if ($currentTime % 30 === 0 && $currentTime !== $lastCheck) {
                    echo "data: " . json_encode([
                        'type' => 'heartbeat',
                        'timestamp' => now()->toISOString()
                    ]) . "\n\n";

                    if (ob_get_level()) {
                        ob_end_flush();
                    }
                    flush();
                }

                // Vérifier si la connexion est toujours active
                if (connection_aborted()) {
                    break;
                }

                usleep(1000000); // 1 seconde
            }
        });

        return $response;
    }
}
