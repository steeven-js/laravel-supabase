<?php

namespace App\Http\Controllers;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\App;

class DevDataController extends Controller
{
    /**
     * Constructor pour vérifier l'environnement
     */
    public function __construct()
    {
        // Seulement accessible en environnement local
        if (!App::environment('local')) {
            abort(404);
        }
    }

    /**
     * Reset toutes les données sauf l'utilisateur principal
     */
    public function resetKeepUser()
    {
        try {
            DatabaseSeeder::resetDataKeepUser();

            return redirect()->back()->with('success',
                '✅ Données reset avec succès ! L\'utilisateur principal a été conservé.'
            );
        } catch (\Exception $e) {
            return redirect()->back()->with('error',
                '❌ Erreur lors du reset : ' . $e->getMessage()
            );
        }
    }

    /**
     * Reset toutes les données y compris l'utilisateur
     */
    public function resetAll()
    {
        try {
            DatabaseSeeder::resetAllData();

            return redirect()->back()->with('success',
                '✅ Toutes les données ont été reset ! Utilisateur : jacques.steeven@gmail.com / password'
            );
        } catch (\Exception $e) {
            return redirect()->back()->with('error',
                '❌ Erreur lors du reset complet : ' . $e->getMessage()
            );
        }
    }

    /**
     * Générer des données de test supplémentaires
     */
    public function generateMore()
    {
        try {
            Artisan::call('db:seed', [
                '--class' => 'ClientSeeder'
            ]);

            Artisan::call('db:seed', [
                '--class' => 'DevisSeeder'
            ]);

            return redirect()->back()->with('success',
                '✅ Données supplémentaires générées avec succès !'
            );
        } catch (\Exception $e) {
            return redirect()->back()->with('error',
                '❌ Erreur lors de la génération : ' . $e->getMessage()
            );
        }
    }

    /**
     * Afficher les statistiques actuelles des données
     */
    public function stats()
    {
        $stats = [
            'users' => \App\Models\User::count(),
            'entreprises' => \App\Models\Entreprise::count(),
            'clients' => \App\Models\Client::count(),
            'devis' => \App\Models\Devis::count(),
            'factures' => \App\Models\Facture::count(),
        ];

        $devisStats = [
            'brouillon' => \App\Models\Devis::where('statut', 'brouillon')->count(),
            'envoye' => \App\Models\Devis::where('statut', 'envoye')->count(),
            'accepte' => \App\Models\Devis::where('statut', 'accepte')->count(),
            'refuse' => \App\Models\Devis::where('statut', 'refuse')->count(),
            'expire' => \App\Models\Devis::where('statut', 'expire')->count(),
        ];

        $factureStats = [
            'brouillon' => \App\Models\Facture::where('statut', 'brouillon')->count(),
            'envoyee' => \App\Models\Facture::where('statut', 'envoyee')->count(),
            'payee' => \App\Models\Facture::where('statut', 'payee')->count(),
            'en_retard' => \App\Models\Facture::where('statut', 'en_retard')->count(),
            'annulee' => \App\Models\Facture::where('statut', 'annulee')->count(),
        ];

        $montantTotal = \App\Models\Facture::sum('montant_ttc');

        return response()->json([
            'global' => $stats,
            'devis' => $devisStats,
            'factures' => $factureStats,
            'montant_total' => $montantTotal,
            'montant_total_formatted' => number_format($montantTotal, 2, ',', ' ') . '€'
        ]);
    }
}
