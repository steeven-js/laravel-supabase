<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Entreprise;
use App\Models\Devis;
use App\Models\Facture;
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
            ->select('id', 'statut', 'created_at')
            ->get();

        $factures_data = Facture::where('archive', false)
            ->select('id', 'statut', 'montant_ttc', 'created_at')
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'devis_data' => $devis_data,
            'factures_data' => $factures_data,
            'isLocal' => App::environment('local')
        ]);
    }
}
