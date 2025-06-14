<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class ServiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Service::query();

        // Recherche
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Filtre par statut
        if ($request->filled('statut') && $request->statut !== 'tous') {
            if ($request->statut === 'actif') {
                $query->where('actif', true);
            } else {
                $query->where('actif', false);
            }
        }

        // Tri
        $sortField = $request->get('sort', 'nom');
        $sortDirection = $request->get('direction', 'asc');

        $allowedSorts = ['nom', 'code', 'prix_ht', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $services = $query->paginate(15)->withQueryString();

        return Inertia::render('services/index', [
            'services' => $services,
            'filters' => $request->only(['search', 'statut']),
            'stats' => [
                'total' => Service::count(),
                'actifs' => Service::where('actif', true)->count(),
                'inactifs' => Service::where('actif', false)->count(),
                'chiffre_affaires_total' => \App\Models\LigneFacture::join('services', 'lignes_factures.service_id', '=', 'services.id')
                                                                    ->sum('lignes_factures.montant_ttc') ?? 0,
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('services/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:services,code',
            'description' => 'nullable|string|max:1000',
            'prix_ht' => 'required|numeric|min:0|max:999999.99',
            'qte_defaut' => 'required|integer|min:1|max:9999',
            'actif' => 'boolean',
        ]);

        $service = Service::create($validated);

        return redirect()->route('services.show', $service)
                        ->with('success', 'Service créé avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Service $service)
    {
        // Charger les statistiques d'utilisation
        $service->load(['lignesDevis.devis', 'lignesFactures.facture']);

        $stats = [
            'total_devis' => $service->lignesDevis->count(),
            'total_factures' => $service->lignesFactures->count(),
            'ca_total' => $service->lignesFactures->sum('montant_ttc'),
            'derniere_utilisation' => $service->lignesDevis->concat($service->lignesFactures)
                                             ->sortByDesc('created_at')
                                             ->first()?->created_at,
        ];

        return Inertia::render('services/show', [
            'service' => $service,
            'stats' => $stats,
            'recent_devis' => $service->lignesDevis()
                                    ->with(['devis.client'])
                                    ->latest()
                                    ->take(5)
                                    ->get(),
            'recent_factures' => $service->lignesFactures()
                                       ->with(['facture.client'])
                                       ->latest()
                                       ->take(5)
                                       ->get(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Service $service)
    {
        return Inertia::render('services/edit', [
            'service' => $service
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'code' => ['required', 'string', 'max:50', Rule::unique('services')->ignore($service->id)],
            'description' => 'nullable|string|max:1000',
            'prix_ht' => 'required|numeric|min:0|max:999999.99',
            'qte_defaut' => 'required|integer|min:1|max:9999',
            'actif' => 'boolean',
        ]);

        $service->update($validated);

        return redirect()->route('services.show', $service)
                        ->with('success', 'Service mis à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Service $service)
    {
        // Vérifier si le service est utilisé
        $utiliseDansDevis = $service->lignesDevis()->count() > 0;
        $utiliseDansFactures = $service->lignesFactures()->count() > 0;

        if ($utiliseDansDevis || $utiliseDansFactures) {
            return back()->with('error',
                'Ce service ne peut pas être supprimé car il est utilisé dans des devis ou factures.');
        }

        $service->delete();

        return redirect()->route('services.index')
                        ->with('success', 'Service supprimé avec succès.');
    }

    /**
     * Toggle service active status
     */
    public function toggle(Service $service)
    {
        $service->update(['actif' => !$service->actif]);

        $status = $service->actif ? 'activé' : 'désactivé';

        return back()->with('success', "Service {$status} avec succès.");
    }

    /**
     * Duplicate a service
     */
    public function duplicate(Service $service)
    {
        $nouveauCode = $service->code . '-COPIE';
        $counter = 1;

        // Trouver un code unique
        while (Service::where('code', $nouveauCode)->exists()) {
            $nouveauCode = $service->code . '-COPIE-' . $counter;
            $counter++;
        }

        $nouveauService = $service->replicate();
        $nouveauService->nom = $service->nom . ' (Copie)';
        $nouveauService->code = $nouveauCode;
        $nouveauService->actif = false; // Désactivé par défaut
        $nouveauService->save();

        return redirect()->route('services.edit', $nouveauService)
                        ->with('success', 'Service dupliqué avec succès. Modifiez les informations si nécessaire.');
    }

    /**
     * Afficher le catalogue des services (vue simplifiée)
     */
    public function catalogue(Request $request)
    {
        $services = Service::where('actif', true)
                          ->orderBy('nom')
                          ->get()
                          ->groupBy(function($service) {
                              // Grouper par première partie du code (ex: DEV, CONSEIL, etc.)
                              return explode('-', $service->code)[0] ?? 'AUTRE';
                          });

        return Inertia::render('services/catalogue', [
            'services_groupes' => $services,
            'stats' => [
                'total_actifs' => Service::where('actif', true)->count(),
                'categories' => $services->keys(),
            ]
        ]);
    }

    /**
     * Afficher uniquement les services actifs
     */
    public function actifs(Request $request)
    {
        $query = Service::where('actif', true);

        // Recherche
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Tri
        $sortField = $request->get('sort', 'nom');
        $sortDirection = $request->get('direction', 'asc');

        $allowedSorts = ['nom', 'code', 'prix_ht', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $services = $query->paginate(20)->withQueryString();

        return Inertia::render('services/actifs', [
            'services' => $services,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Afficher les statistiques des services
     */
    public function statistiques()
    {
        $stats = [
            'total' => Service::count(),
            'actifs' => Service::where('actif', true)->count(),
            'inactifs' => Service::where('actif', false)->count(),
            'par_categorie' => Service::selectRaw('
                SPLIT_PART(code, \'-\', 1) as categorie,
                COUNT(*) as total,
                SUM(CASE WHEN actif = true THEN 1 ELSE 0 END) as actifs
            ')
            ->groupBy('categorie')
            ->get(),
            'plus_utilises' => Service::withCount(['lignesDevis', 'lignesFactures'])
                                    ->orderByDesc('lignes_devis_count')
                                    ->take(10)
                                    ->get(),
            'ca_par_service' => Service::with(['lignesFactures'])
                                     ->get()
                                     ->map(function($service) {
                                         return [
                                             'service' => $service,
                                             'ca_total' => $service->lignesFactures->sum('montant_ttc')
                                         ];
                                     })
                                     ->sortByDesc('ca_total')
                                     ->take(10)
                                     ->values(),
        ];

        return Inertia::render('services/statistiques', [
            'stats' => $stats
        ]);
    }
}
