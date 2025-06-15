<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Mail\Mailable;

class MonitoringController extends Controller
{
    public function index()
    {
        // Vérifier que nous sommes en mode local
        if (!app()->environment('local')) {
            abort(404);
        }

        $diagnostics = $this->getDiagnostics();

        return Inertia::render('monitoring/index', [
            'diagnostics' => $diagnostics,
        ]);
    }

    public function testEmail(Request $request)
    {
        // Vérifier que nous sommes en mode local
        if (!app()->environment('local')) {
            abort(404);
        }

        try {
            $testEmail = $request->get('email', config('mail.from.address'));

            Log::info('🚀 Début du test d\'envoi d\'email avec template Markdown Laravel', [
                'recipient' => $testEmail,
                'timestamp' => now()->format('Y-m-d H:i:s'),
                'driver' => config('mail.default'),
                'host' => config('mail.mailers.' . config('mail.default') . '.host'),
            ]);

            // Obtenir les diagnostics pour l'email
            $diagnostics = $this->getDiagnostics();

            Log::info('📝 Diagnostics collectés pour l\'email', [
                'php_version' => $diagnostics['php']['version'],
                'laravel_version' => $diagnostics['laravel']['version'],
                'database_status' => $diagnostics['database']['status'],
            ]);

            // Utiliser la classe Mailable avec template Markdown Laravel
            Mail::to($testEmail)->send(new \App\Mail\TestEmailMark($diagnostics, $testEmail));

            Log::info('✅ Email Markdown envoyé avec succès', [
                'recipient' => $testEmail,
                'subject' => '🧪 Test Email Markdown - ' . now()->format('d/m/Y H:i:s'),
                'timestamp' => now()->format('Y-m-d H:i:s'),
                'template' => 'emails.test-email (Markdown Laravel)',
            ]);

            return response()->json([
                'success' => true,
                'message' => "Email Markdown Laravel envoyé avec succès à {$testEmail}",
                'timestamp' => now()->format('d/m/Y H:i:s'),
                'details' => [
                    'driver' => config('mail.default'),
                    'format' => 'Template Markdown Laravel natif',
                    'template' => 'emails.test-email',
                    'components' => ['x-mail::message', 'x-mail::button', 'x-mail::table', 'x-mail::panel'],
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Erreur lors de l\'envoi d\'email Markdown', [
                'recipient' => $testEmail ?? 'unknown',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'timestamp' => now()->format('Y-m-d H:i:s'),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi : ' . $e->getMessage(),
                'timestamp' => now()->format('d/m/Y H:i:s'),
                'error_details' => [
                    'line' => $e->getLine(),
                    'file' => basename($e->getFile()),
                ]
            ], 500);
        }
    }



    public function testDatabase()
    {
        // Vérifier que nous sommes en mode local
        if (!app()->environment('local')) {
            abort(404);
        }

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
        // Vérifier que nous sommes en mode local
        if (!app()->environment('local')) {
            abort(404);
        }

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

    /**
     * Basculer vers le mode test
     */
    public function switchToTestMode()
    {
        // Vérifier que nous sommes en mode local
        if (!app()->environment('local')) {
            abort(404);
        }

        session(['test_mode' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Basculé vers le mode TEST - Utilisation des tables test_*',
            'mode' => 'test',
            'timestamp' => now()->format('d/m/Y H:i:s')
        ]);
    }

    /**
     * Basculer vers le mode production
     */
    public function switchToProductionMode()
    {
        // Vérifier que nous sommes en mode local
        if (!app()->environment('local')) {
            abort(404);
        }

        session(['test_mode' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Basculé vers le mode PRODUCTION - Utilisation des tables normales',
            'mode' => 'production',
            'timestamp' => now()->format('d/m/Y H:i:s')
        ]);
    }

    /**
     * Obtenir le mode actuel
     */
    public function getCurrentMode()
    {
        // Vérifier que nous sommes en mode local
        if (!app()->environment('local')) {
            abort(404);
        }

        $testMode = session('test_mode', false);

        return response()->json([
            'success' => true,
            'mode' => $testMode ? 'test' : 'production',
            'test_mode' => $testMode,
            'tables' => [
                'devis' => $testMode ? 'test_devis' : 'devis',
                'factures' => $testMode ? 'test_factures' : 'factures',
                'lignes_devis' => $testMode ? 'test_lignes_devis' : 'lignes_devis',
                'lignes_factures' => $testMode ? 'test_lignes_factures' : 'lignes_factures',
            ],
            'timestamp' => now()->format('d/m/Y H:i:s')
        ]);
    }

    /**
     * Tester le fonctionnement des tables dynamiques
     */
    public function testTables()
    {
        // Vérifier que nous sommes en mode local
        if (!app()->environment('local')) {
            abort(404);
        }

        $testMode = session('test_mode', false);

        // Tester les modèles
        $devis = new \App\Models\Devis();
        $facture = new \App\Models\Facture();
        $ligneDevis = new \App\Models\LigneDevis();
        $ligneFacture = new \App\Models\LigneFacture();

        // Compter les enregistrements
        $countDevis = \App\Models\Devis::count();
        $countFactures = \App\Models\Facture::count();

        return response()->json([
            'success' => true,
            'mode' => $testMode ? 'test' : 'production',
            'session_test_mode' => $testMode,
            'tables' => [
                'devis' => $devis->getTable(),
                'factures' => $facture->getTable(),
                'lignes_devis' => $ligneDevis->getTable(),
                'lignes_factures' => $ligneFacture->getTable(),
            ],
            'counts' => [
                'devis' => $countDevis,
                'factures' => $countFactures,
            ],
            'timestamp' => now()->format('d/m/Y H:i:s')
        ]);
    }

    /**
     * Vider les tables de test et relancer les seeders
     */
    public function resetTestTables()
    {
        // Vérifier que nous sommes en mode local
        if (!app()->environment('local')) {
            abort(404);
        }

        try {
            Log::info('🧪 Début de la réinitialisation des tables de test');

            // Vider les tables de test
            DB::table('test_lignes_factures')->delete();
            DB::table('test_lignes_devis')->delete();
            DB::table('test_factures')->delete();
            DB::table('test_devis')->delete();

            Log::info('🗑️ Tables de test vidées');

            // Relancer les seeders
            Artisan::call('db:seed', ['--class' => 'TestDataSeeder']);

            Log::info('✅ Seeders de test exécutés avec succès');

            return response()->json([
                'success' => true,
                'message' => 'Tables de test réinitialisées et données régénérées avec succès',
                'timestamp' => now()->format('d/m/Y H:i:s'),
                'details' => [
                    'tables_cleaned' => ['test_devis', 'test_factures', 'test_lignes_devis', 'test_lignes_factures'],
                    'seeders_run' => ['TestDevisSeeder', 'TestFacturesSeeder']
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Erreur lors de la réinitialisation des tables de test', [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réinitialisation : ' . $e->getMessage(),
                'timestamp' => now()->format('d/m/Y H:i:s')
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques des tables de test vs production
     */
    public function getTablesStats()
    {
        // Vérifier que nous sommes en mode local
        if (!app()->environment('local')) {
            abort(404);
        }

        try {
            $stats = [
                'production' => [
                    'devis' => DB::table('devis')->count(),
                    'factures' => DB::table('factures')->count(),
                    'lignes_devis' => DB::table('lignes_devis')->count(),
                    'lignes_factures' => DB::table('lignes_factures')->count(),
                ],
                'test' => [
                    'devis' => DB::table('test_devis')->count(),
                    'factures' => DB::table('test_factures')->count(),
                    'lignes_devis' => DB::table('test_lignes_devis')->count(),
                    'lignes_factures' => DB::table('test_lignes_factures')->count(),
                ],
            ];

            // Ajouter des informations sur les statuts
            $stats['production']['devis_by_status'] = DB::table('devis')
                ->select('statut', DB::raw('count(*) as count'))
                ->groupBy('statut')
                ->pluck('count', 'statut')
                ->toArray();

            $stats['production']['factures_by_status'] = DB::table('factures')
                ->select('statut', DB::raw('count(*) as count'))
                ->groupBy('statut')
                ->pluck('count', 'statut')
                ->toArray();

            $stats['test']['devis_by_status'] = DB::table('test_devis')
                ->select('statut', DB::raw('count(*) as count'))
                ->groupBy('statut')
                ->pluck('count', 'statut')
                ->toArray();

            $stats['test']['factures_by_status'] = DB::table('test_factures')
                ->select('statut', DB::raw('count(*) as count'))
                ->groupBy('statut')
                ->pluck('count', 'statut')
                ->toArray();

            return response()->json([
                'success' => true,
                'stats' => $stats,
                'timestamp' => now()->format('d/m/Y H:i:s')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques : ' . $e->getMessage(),
                'timestamp' => now()->format('d/m/Y H:i:s')
            ], 500);
        }
    }
}
