<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Devis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DevisController extends Controller
{
    /**
     * Affiche la liste des devis
     */
    public function index()
    {
        $devis = Devis::with(['client.entreprise'])
            ->actifs()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('devis/index', [
            'devis' => $devis
        ]);
    }

    /**
     * Affiche le formulaire de création d'un devis
     */
    public function create()
    {
        $clients = Client::with('entreprise')->actifs()->orderBy('nom')->get();

        return Inertia::render('devis/create', [
            'clients' => $clients,
            'numero_devis' => Devis::genererNumeroDevis()
        ]);
    }

    /**
     * Enregistre un nouveau devis
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'numero_devis' => 'required|string|unique:devis,numero_devis',
            'client_id' => 'required|exists:clients,id',
            'date_devis' => 'required|date',
            'date_validite' => 'required|date|after:date_devis',
            'objet' => 'required|string|max:255',
            'description' => 'nullable|string',
            'montant_ht' => 'required|numeric|min:0',
            'taux_tva' => 'required|numeric|min:0|max:100',
            'conditions' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $devis = new Devis($validated);
        $devis->calculerMontants();
        $devis->save();

        return redirect()->route('devis.index')
            ->with('success', 'Devis créé avec succès.');
    }

    /**
     * Affiche les détails d'un devis
     */
    public function show(Devis $devis)
    {
        $devis->load(['client.entreprise']);

        return Inertia::render('devis/show', [
            'devis' => $devis
        ]);
    }

        /**
     * Affiche le formulaire d'édition d'un devis
     */
    public function edit(Devis $devis)
    {
                $devis->load(['client.entreprise']);
        $clients = Client::with('entreprise')->actifs()->orderBy('nom')->get();

        // Construire manuellement les données pour éviter les problèmes de sérialisation
        $devisFormatted = [
            'id' => $devis->id,
            'numero_devis' => $devis->numero_devis,
            'client_id' => $devis->client_id,
            'objet' => $devis->objet,
            'statut' => $devis->statut,
            'date_devis' => $devis->date_devis?->format('Y-m-d') ?? '',
            'date_validite' => $devis->date_validite?->format('Y-m-d') ?? '',
            'montant_ht' => $devis->montant_ht,
            'taux_tva' => $devis->taux_tva,
            'montant_ttc' => $devis->montant_ttc,
            'notes' => $devis->notes,
            'description' => $devis->description,
            'conditions' => $devis->conditions,
            'archive' => $devis->archive,
            'client' => $devis->client ? [
                'id' => $devis->client->id,
                'nom' => $devis->client->nom,
                'prenom' => $devis->client->prenom,
                'email' => $devis->client->email,
                'entreprise' => $devis->client->entreprise ? [
                    'id' => $devis->client->entreprise->id,
                    'nom' => $devis->client->entreprise->nom,
                    'nom_commercial' => $devis->client->entreprise->nom_commercial,
                ] : null
            ] : null
        ];



        return Inertia::render('devis/edit', [
            'devis' => $devisFormatted,
            'clients' => $clients
        ]);
    }

    /**
     * Met à jour un devis
     */
    public function update(Request $request, Devis $devis)
    {
        $validated = $request->validate([
            'numero_devis' => 'required|string|unique:devis,numero_devis,' . $devis->id,
            'client_id' => 'required|exists:clients,id',
            'date_devis' => 'required|date',
            'date_validite' => 'required|date|after:date_devis',
            'statut' => 'required|in:brouillon,envoye,accepte,refuse,expire',
            'objet' => 'required|string|max:255',
            'description' => 'nullable|string',
            'montant_ht' => 'required|numeric|min:0',
            'taux_tva' => 'required|numeric|min:0|max:100',
            'conditions' => 'nullable|string',
            'notes' => 'nullable|string',
            'archive' => 'boolean',
        ]);

        // Convertir explicitement les montants en float pour éviter les problèmes de type
        if (isset($validated['montant_ht'])) {
            $validated['montant_ht'] = (float) $validated['montant_ht'];
        }
        if (isset($validated['taux_tva'])) {
            $validated['taux_tva'] = (float) $validated['taux_tva'];
        }

        $devis->fill($validated);
        $devis->calculerMontants();
        $devis->save();

        return redirect()->route('devis.index')
            ->with('success', 'Devis mis à jour avec succès.');
    }

    /**
     * Supprime un devis
     */
    public function destroy(Devis $devis)
    {
        $devis->delete();

        return redirect()->route('devis.index')
            ->with('success', 'Devis supprimé avec succès.');
    }

    /**
     * Accepte un devis
     */
    public function accepter(Devis $devis)
    {
        $devis->accepter();

        return redirect()->back()
            ->with('success', 'Devis accepté avec succès.');
    }

    /**
     * Refuse un devis
     */
    public function refuser(Devis $devis)
    {
        $devis->refuser();

        return redirect()->back()
            ->with('success', 'Devis refusé.');
    }
}
