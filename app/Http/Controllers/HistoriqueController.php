<?php

namespace App\Http\Controllers;

use App\Models\Historique;
use App\Models\Client;
use App\Models\Entreprise;
use App\Models\Devis;
use App\Models\Facture;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HistoriqueController extends Controller
{
    /**
     * Afficher l'historique global de toutes les entités
     */
    public function index(Request $request)
    {
        $query = Historique::with(['user', 'entite'])
            ->chronologique();

        // Filtres
        if ($request->has('entite_type') && $request->entite_type) {
            $query->where('entite_type', $request->entite_type);
        }

        if ($request->has('action') && $request->action) {
            $query->where('action', $request->action);
        }

        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('date_debut') && $request->date_debut) {
            $query->where('created_at', '>=', $request->date_debut);
        }

        if ($request->has('date_fin') && $request->date_fin) {
            $query->where('created_at', '<=', $request->date_fin . ' 23:59:59');
        }

        $historique = $query->paginate(50);

        return Inertia::render('historique/index', [
            'historique' => $historique,
            'filtres' => $request->only(['entite_type', 'action', 'user_id', 'date_debut', 'date_fin']),
            'stats' => [
                'total_actions' => Historique::count(),
                'actions_aujourd_hui' => Historique::whereDate('created_at', today())->count(),
                'actions_cette_semaine' => Historique::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            ]
        ]);
    }

    /**
     * Afficher l'historique spécifique d'un client
     */
    public function client(Client $client)
    {
        $historique = $client->historique()
            ->with('user')
            ->chronologique()
            ->paginate(20);

        return Inertia::render('historique/entite', [
            'entite' => $client,
            'entite_type' => 'Client',
            'historique' => $historique,
        ]);
    }

    /**
     * Afficher l'historique spécifique d'une entreprise
     */
    public function entreprise(Entreprise $entreprise)
    {
        $historique = $entreprise->historique()
            ->with('user')
            ->chronologique()
            ->paginate(20);

        return Inertia::render('historique/entite', [
            'entite' => $entreprise,
            'entite_type' => 'Entreprise',
            'historique' => $historique,
        ]);
    }

    /**
     * Afficher l'historique spécifique d'un devis
     */
    public function devis(Devis $devis)
    {
        $historique = $devis->historique()
            ->with('user')
            ->chronologique()
            ->paginate(20);

        return Inertia::render('historique/entite', [
            'entite' => $devis->load('client'),
            'entite_type' => 'Devis',
            'historique' => $historique,
        ]);
    }

    /**
     * Afficher l'historique spécifique d'une facture
     */
    public function facture(Facture $facture)
    {
        $historique = $facture->historique()
            ->with('user')
            ->chronologique()
            ->paginate(20);

        return Inertia::render('historique/entite', [
            'entite' => $facture->load('client'),
            'entite_type' => 'Facture',
            'historique' => $historique,
        ]);
    }

    /**
     * API pour obtenir l'historique d'une entité (pour les widgets)
     */
    public function apiHistoriqueEntite(Request $request, $type, $id)
    {
        $modelClass = match ($type) {
            'client' => Client::class,
            'entreprise' => Entreprise::class,
            'devis' => Devis::class,
            'facture' => Facture::class,
            default => abort(404)
        };

        $entity = $modelClass::findOrFail($id);

        $historique = $entity->historique()
            ->with('user')
            ->chronologique()
            ->limit(10)
            ->get();

        return response()->json($historique);
    }

    /**
     * Obtenir les statistiques d'activité
     */
    public function statistiques(Request $request)
    {
        $periode = $request->get('periode', '30'); // 30 jours par défaut

        $debut = now()->subDays($periode);

        $stats = [
            'total_actions' => Historique::where('created_at', '>=', $debut)->count(),
            'actions_par_type' => Historique::where('created_at', '>=', $debut)
                ->selectRaw('action, COUNT(*) as count')
                ->groupBy('action')
                ->pluck('count', 'action'),
            'actions_par_entite' => Historique::where('created_at', '>=', $debut)
                ->selectRaw('entite_type, COUNT(*) as count')
                ->groupBy('entite_type')
                ->pluck('count', 'entite_type'),
            'utilisateurs_actifs' => Historique::where('created_at', '>=', $debut)
                ->distinct('user_id')
                ->count(),
            'actions_par_jour' => Historique::where('created_at', '>=', $debut)
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->groupBy('date')
                ->orderBy('date')
                ->pluck('count', 'date'),
        ];

        return Inertia::render('historique/statistiques', [
            'stats' => $stats,
            'periode' => $periode,
        ]);
    }
}
