<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Entreprise;
use App\Models\Devis;
use App\Models\Facture;
use App\Models\User;
use Illuminate\Support\Facades\App;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Affiche le tableau de bord avec statistiques
     */
    public function index()
    {
        // Récupérer les statistiques générales (pour fallback et données globales)
        $stats = [
            'clients' => Client::where('actif', true)->count(),
            'entreprises' => Entreprise::where('active', true)->count(),
            'devis' => [
                'total' => Devis::where('archive', false)->count(),
                'brouillon' => Devis::where('statut', 'brouillon')->where('archive', false)->count(),
                'envoye' => Devis::where('statut', 'envoye')->where('archive', false)->count(),
                'accepte' => Devis::where('statut', 'accepte')->where('archive', false)->count(),
                'refuse' => Devis::where('statut', 'refuse')->where('archive', false)->count(),
                'expire' => Devis::where('statut', 'expire')->where('archive', false)->count(),
            ],
            'factures' => [
                'total' => Facture::where('archive', false)->count(),
                'brouillon' => Facture::where('statut', 'brouillon')->where('archive', false)->count(),
                'envoyee' => Facture::where('statut', 'envoyee')->where('archive', false)->count(),
                'payee' => Facture::where('statut', 'payee')->where('archive', false)->count(),
                'en_retard' => Facture::where('statut', 'en_retard')->where('archive', false)->count(),
                'annulee' => Facture::where('statut', 'annulee')->where('archive', false)->count(),
                'montant_total' => Facture::where('archive', false)->sum('montant_ttc'),
            ]
        ];

        // Récupérer les données détaillées pour le filtrage temporel
        $devis_data = Devis::where('archive', false)
            ->select('id', 'statut', 'created_at', 'administrateur_id')
            ->with('administrateur:id,name')
            ->get();

        $factures_data = Facture::where('archive', false)
            ->select('id', 'statut', 'montant_ttc', 'created_at')
            ->get();

        // Données pour le graphique des devis par administrateur
        $devis_par_admin = Devis::where('archive', false)
            ->whereNotNull('administrateur_id')
            ->with('administrateur.userRole:id,name')
            ->get()
            ->groupBy('administrateur_id')
            ->map(function ($devis, $adminId) {
                $admin = $devis->first()->administrateur;
                // Normaliser le nom (éviter les doublons de casse)
                $nomNormalise = trim($admin->name ?? 'Admin inconnu');

                return [
                    'admin_id' => $adminId,
                    'admin_nom' => $nomNormalise,
                    'admin_email' => $admin->email ?? '',
                    'admin_role' => $admin->userRole->name ?? 'admin',
                    'nombre_devis' => $devis->count(),
                    'devis_acceptes' => $devis->where('statut', 'accepte')->count(),
                    'devis_en_cours' => $devis->whereIn('statut', ['brouillon', 'en_attente', 'envoye'])->count(),
                ];
            })
            ->sortByDesc('nombre_devis')
            ->values()
            ->toArray();

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'devis_data' => $devis_data,
            'factures_data' => $factures_data,
            'devis_par_admin' => $devis_par_admin,
            'isLocal' => App::environment('local')
        ]);
    }
}
