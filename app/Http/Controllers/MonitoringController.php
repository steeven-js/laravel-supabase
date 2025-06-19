<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Mail\Mailable;
use App\Models\User;
use App\Services\EmailLogService;

class MonitoringController extends Controller
{
    public function index()
    {
        $diagnostics = $this->getDiagnostics();

        return Inertia::render('monitoring/index', [
            'diagnostics' => $diagnostics,
        ]);
    }

    public function testEmail(Request $request)
    {
        $testEmail = $request->get('email', config('mail.from.address'));

        // Démarrer une session de logs d'email
        $sessionId = EmailLogService::startEmailSession('test_email', [
            'recipient' => $testEmail,
            'user_id' => Auth::id(),
            'ip' => $request->ip(),
        ]);

        try {
            // Logger la configuration de l'email
            EmailLogService::logConfig([
                'driver' => config('mail.default'),
                'host' => config('mail.mailers.' . config('mail.default') . '.host'),
                'port' => config('mail.mailers.' . config('mail.default') . '.port'),
            ]);

            // Obtenir les diagnostics pour l'email
            $diagnostics = $this->getDiagnostics();

            EmailLogService::logEvent('TEMPLATE', 'INFO', [
                'template' => 'emails.test-email',
                'type' => 'Markdown Laravel',
            ]);

            EmailLogService::logEvent('SENDING', 'INFO', [
                'recipient' => $testEmail,
                'subject' => '🧪 Test Email Markdown - ' . now()->format('d/m/Y H:i:s'),
            ]);

            // Utiliser la classe Mailable avec template Markdown Laravel
            Mail::to($testEmail)->send(new \App\Mail\TestEmailMark($diagnostics, $testEmail));

            EmailLogService::logSuccess($testEmail, '🧪 Test Email Markdown - ' . now()->format('d/m/Y H:i:s'), [
                'template' => 'emails.test-email (Markdown Laravel)',
                'components' => ['x-mail::message', 'x-mail::button', 'x-mail::table', 'x-mail::panel'],
            ]);

            // Terminer la session avec succès
            EmailLogService::endEmailSession(true, [
                'emails_sent' => 1,
                'template' => 'markdown',
                'duration' => 'success',
            ]);

            return response()->json([
                'success' => true,
                'message' => "Email Markdown Laravel envoyé avec succès à {$testEmail}",
                'timestamp' => now()->format('d/m/Y H:i:s'),
                'session_id' => $sessionId,
                'details' => [
                    'driver' => config('mail.default'),
                    'format' => 'Template Markdown Laravel natif',
                    'template' => 'emails.test-email',
                    'components' => ['x-mail::message', 'x-mail::button', 'x-mail::table', 'x-mail::panel'],
                ]
            ]);

        } catch (\Exception $e) {
            EmailLogService::logError($testEmail, $e->getMessage(), [
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Terminer la session avec erreur
            EmailLogService::endEmailSession(false, [
                'error' => $e->getMessage(),
                'emails_sent' => 0,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi : ' . $e->getMessage(),
                'timestamp' => now()->format('d/m/Y H:i:s'),
                'session_id' => $sessionId,
                'error_details' => [
                    'line' => $e->getLine(),
                    'file' => basename($e->getFile()),
                ]
            ], 500);
        }
    }



    public function testDatabase()
    {
        try {
            // Test de connexion à la base de données
            $connection = DB::connection()->getPdo();

            // Test d'une requête simple
            $result = DB::select('SELECT 1 as test');

            // Obtenir quelques statistiques
            $tables = Schema::getAllTables();
            $tableCount = count($tables);

            return response()->json([
                'success' => true,
                'message' => 'Connexion à la base de données réussie',
                'details' => [
                    'driver' => config('database.default'),
                    'tables_count' => $tableCount,
                    'connection_name' => config("database.connections." . config('database.default') . ".database")
                ],
                'timestamp' => now()->format('d/m/Y H:i:s')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de connexion à la base de données : ' . $e->getMessage(),
                'timestamp' => now()->format('d/m/Y H:i:s')
            ], 500);
        }
    }

    public function clearCache()
    {
        try {
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');

            return response()->json([
                'success' => true,
                'message' => 'Cache effacé avec succès',
                'timestamp' => now()->format('d/m/Y H:i:s')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'effacement du cache : ' . $e->getMessage(),
                'timestamp' => now()->format('d/m/Y H:i:s')
            ], 500);
        }
    }

    /**
     * Récupérer les logs d'emails
     */
    public function getEmailLogs(Request $request)
    {
        /** @var User|null $user */
        $user = Auth::user();
        if (!app()->environment('local') && (!$user || !$user->isSuperAdmin())) {
            abort(404);
        }

        try {
            $lines = $request->get('lines', 50);
            $logs = EmailLogService::getEmailLogs($lines);

            return response()->json([
                'success' => true,
                'logs' => $logs,
                'total_lines' => count($logs),
                'timestamp' => now()->format('d/m/Y H:i:s')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des logs : ' . $e->getMessage(),
                'timestamp' => now()->format('d/m/Y H:i:s')
            ], 500);
        }
    }

    /**
     * Nettoyer les anciens logs d'emails
     */
    public function cleanEmailLogs(Request $request)
    {
        /** @var User|null $user */
        $user = Auth::user();
        if (!app()->environment('local') && (!$user || !$user->isSuperAdmin())) {
            abort(404);
        }

        try {
            $days = $request->get('days', 7);
            $result = EmailLogService::clearOldLogs($days);

            return response()->json([
                'success' => $result,
                'message' => "Logs d'emails antérieurs à {$days} jours supprimés avec succès",
                'timestamp' => now()->format('d/m/Y H:i:s')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du nettoyage des logs : ' . $e->getMessage(),
                'timestamp' => now()->format('d/m/Y H:i:s')
            ], 500);
        }
    }

    public function getDiagnostics()
    {
        $diagnostics = [];

        // Version PHP
        $diagnostics['php'] = [
            'version' => PHP_VERSION,
            'extensions' => [
                'pdo' => extension_loaded('pdo'),
                'pdo_pgsql' => extension_loaded('pdo_pgsql'),
                'curl' => extension_loaded('curl'),
                'mbstring' => extension_loaded('mbstring'),
                'openssl' => extension_loaded('openssl'),
            ]
        ];

        // Laravel
        $diagnostics['laravel'] = [
            'version' => app()->version(),
            'environment' => app()->environment(),
            'debug_mode' => config('app.debug'),
            'timezone' => config('app.timezone'),
        ];

        // Base de données
        try {
            $connection = DB::connection()->getPdo();
            $diagnostics['database'] = [
                'status' => 'connected',
                'driver' => config('database.default'),
                'host' => config('database.connections.' . config('database.default') . '.host'),
                'database' => config('database.connections.' . config('database.default') . '.database'),
                'port' => config('database.connections.' . config('database.default') . '.port'),
            ];
        } catch (\Exception $e) {
            $diagnostics['database'] = [
                'status' => 'error',
                'message' => $e->getMessage(),
            ];
        }

        // Configuration mail
        $diagnostics['mail'] = [
            'driver' => config('mail.default'),
            'host' => config('mail.mailers.' . config('mail.default') . '.host'),
            'port' => config('mail.mailers.' . config('mail.default') . '.port'),
            'from_address' => config('mail.from.address'),
            'from_name' => config('mail.from.name'),
        ];

        // Stockage
        $diagnostics['storage'] = [
            'logs_writable' => is_writable(storage_path('logs')),
            'cache_writable' => is_writable(storage_path('framework/cache')),
            'disk_space' => [
                'total' => disk_total_space(base_path()),
                'free' => disk_free_space(base_path()),
            ]
        ];

        // Variables d'environnement importantes
        $diagnostics['environment'] = [
            'app_url' => config('app.url'),
            'app_env' => config('app.env'),
            'app_debug' => config('app.debug'),
            'supabase_url' => config('database.connections.pgsql.host'),
            'supabase_db' => config('database.connections.pgsql.database'),
        ];

        return $diagnostics;
    }
}
