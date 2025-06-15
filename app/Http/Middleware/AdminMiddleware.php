<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     * Maintenant tous les utilisateurs connectés sont admin par défaut.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return redirect()->route('login')->with('error', 'Vous devez être connecté pour accéder à cette page.');
        }

        // Tous les utilisateurs connectés ont maintenant accès aux fonctions admin
        // car le rôle par défaut est 'admin'
        if (!Auth::user()->isAdmin()) {
            abort(403, 'Accès non autorisé. Permissions d\'administrateur requises.');
        }

        return $next($request);
    }
}
