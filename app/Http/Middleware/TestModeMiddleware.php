<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class TestModeMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Vérifier si nous sommes en mode local
        if (!app()->environment('local')) {
            return $next($request);
        }

        // Récupérer le mode depuis la session (par défaut: production)
        $testMode = session('test_mode', false);

        // Définir les noms de tables selon le mode
        $tablePrefix = $testMode ? 'test_' : '';

        // Partager les informations avec toutes les vues
        View::share('testMode', $testMode);
        View::share('tablePrefix', $tablePrefix);

        // Ajouter les informations à la requête
        $request->attributes->set('test_mode', $testMode);
        $request->attributes->set('table_prefix', $tablePrefix);

        return $next($request);
    }
}
