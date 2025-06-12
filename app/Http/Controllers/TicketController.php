<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    /**
     * Créer un nouveau ticket
     */
    public function store(Request $request, Client $client)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'required|string',
            'priorite' => ['required', Rule::in(array_keys(Ticket::PRIORITES))],
            'type' => ['required', Rule::in(array_keys(Ticket::TYPES))],
            'user_id' => 'required|exists:users,id',
            'date_echeance' => 'nullable|date|after:today',
            'temps_estime' => 'nullable|integer|min:1',
            'progression' => 'nullable|integer|min:0|max:100',
            'notes_internes' => 'nullable|string',
            'visible_client' => 'boolean',
        ]);

        $ticket = $client->tickets()->create([
            ...$validated,
            'created_by' => Auth::id(),
            'visible_client' => $validated['visible_client'] ?? true,
        ]);

        return back()->with('success', 'Ticket créé avec succès !');
    }

    /**
     * Mettre à jour un ticket
     */
    public function update(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'required|string',
            'priorite' => ['required', Rule::in(array_keys(Ticket::PRIORITES))],
            'statut' => ['required', Rule::in(array_keys(Ticket::STATUTS))],
            'type' => ['required', Rule::in(array_keys(Ticket::TYPES))],
            'user_id' => 'required|exists:users,id',
            'date_echeance' => 'nullable|date',
            'temps_estime' => 'nullable|integer|min:1',
            'temps_passe' => 'nullable|integer|min:0',
            'progression' => 'nullable|integer|min:0|max:100',
            'notes_internes' => 'nullable|string',
            'solution' => 'nullable|string',
            'visible_client' => 'boolean',
        ]);

        // Si le statut change vers résolu ou fermé, on met la date de résolution
        if (in_array($validated['statut'], ['resolu', 'ferme']) && !$ticket->date_resolution) {
            $validated['date_resolution'] = now();
        } elseif (!in_array($validated['statut'], ['resolu', 'ferme'])) {
            $validated['date_resolution'] = null;
        }

        $ticket->update($validated);

        return back()->with('success', 'Ticket mis à jour avec succès !');
    }

    /**
     * Supprimer un ticket
     */
    public function destroy(Ticket $ticket)
    {
        $ticket->delete();

        return back()->with('success', 'Ticket supprimé avec succès !');
    }

    /**
     * Marquer un ticket comme résolu
     */
    public function resoudre(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'solution' => 'required|string',
        ]);

        $ticket->resoudre($validated['solution']);

        return back()->with('success', 'Ticket marqué comme résolu !');
    }

    /**
     * Fermer un ticket
     */
    public function fermer(Ticket $ticket)
    {
        $ticket->fermer();

        return back()->with('success', 'Ticket fermé !');
    }

    /**
     * Réouvrir un ticket
     */
    public function reouvrir(Ticket $ticket)
    {
        $ticket->update([
            'statut' => 'ouvert',
            'date_resolution' => null,
        ]);

        return back()->with('success', 'Ticket réouvert !');
    }

    /**
     * Assigner un ticket à un utilisateur
     */
    public function assigner(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $ticket->update([
            'user_id' => $validated['user_id'],
            'statut' => $ticket->statut === 'ouvert' ? 'en_cours' : $ticket->statut,
        ]);

        return back()->with('success', 'Ticket assigné avec succès !');
    }

    /**
     * Obtenir les utilisateurs disponibles pour l'assignation
     */
    public function getUsers()
    {
        return response()->json(
            User::select('id', 'name')->orderBy('name')->get()
        );
    }
}
