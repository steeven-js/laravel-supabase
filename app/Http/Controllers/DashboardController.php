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
        // Récupérer les statistiques
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

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'isLocal' => App::environment('local')
        ]);
    }
}
