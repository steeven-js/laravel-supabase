<?php

namespace App\Http\Controllers;

use App\Models\Opportunity;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class OpportunityController extends Controller
{
    /**
     * Créer une nouvelle opportunité
     */
    public function store(Request $request, Client $client)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'etape' => ['required', Rule::in(array_keys(Opportunity::ETAPES))],
            'probabilite' => 'required|integer|min:0|max:100',
            'montant' => 'nullable|numeric|min:0',
            'date_cloture_prevue' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $opportunity = $client->opportunities()->create([
            ...$validated,
            'user_id' => Auth::id(),
        ]);

        return back()->with('success', 'Opportunité créée avec succès !');
    }

    /**
     * Mettre à jour une opportunité
     */
    public function update(Request $request, Opportunity $opportunity)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'etape' => ['required', Rule::in(array_keys(Opportunity::ETAPES))],
            'probabilite' => 'required|integer|min:0|max:100',
            'montant' => 'nullable|numeric|min:0',
            'date_cloture_prevue' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        // Si l'opportunité est fermée, enregistrer la date de clôture réelle
        if (in_array($validated['etape'], ['gagnee', 'perdue']) && !$opportunity->isFermee()) {
            $validated['date_cloture_reelle'] = now()->toDateString();
        } elseif (!in_array($validated['etape'], ['gagnee', 'perdue'])) {
            $validated['date_cloture_reelle'] = null;
        }

        $opportunity->update($validated);

        return back()->with('success', 'Opportunité mise à jour avec succès !');
    }

    /**
     * Supprimer une opportunité
     */
    public function destroy(Opportunity $opportunity)
    {
        $opportunity->delete();

        return back()->with('success', 'Opportunité supprimée avec succès !');
    }
}
