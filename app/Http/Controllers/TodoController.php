<?php

namespace App\Http\Controllers;

use App\Models\Todo;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TodoController extends Controller
{
    /**
     * Créer une nouvelle tâche
     */
    public function store(Request $request, Client $client)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priorite' => ['required', Rule::in(array_keys(Todo::PRIORITES))],
            'date_echeance' => 'nullable|date|after:today',
        ]);

        // Obtenir le prochain ordre
        $nextOrder = Todo::forClient($client->id)->max('ordre') + 1;

        $todo = Todo::create([
            ...$validated,
            'client_id' => $client->id,
            'user_id' => Auth::id(),
            'ordre' => $nextOrder,
        ]);

        return redirect()->back()->with('success', 'Tâche créée avec succès !');
    }

    /**
     * Mettre à jour une tâche
     */
    public function update(Request $request, Client $client, Todo $todo)
    {
        // Vérifier que la tâche appartient au client et à l'utilisateur
        if ($todo->client_id !== $client->id || $todo->user_id !== Auth::id()) {
            abort(403, 'Non autorisé');
        }

        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priorite' => ['required', Rule::in(array_keys(Todo::PRIORITES))],
            'date_echeance' => 'nullable|date',
            'termine' => 'boolean',
        ]);

        $todo->update($validated);

        return redirect()->back()->with('success', 'Tâche mise à jour avec succès !');
    }

    /**
     * Supprimer une tâche
     */
    public function destroy(Client $client, Todo $todo)
    {
        // Vérifier que la tâche appartient au client et à l'utilisateur
        if ($todo->client_id !== $client->id || $todo->user_id !== Auth::id()) {
            abort(403, 'Non autorisé');
        }

        $todo->delete();

        return redirect()->back()->with('success', 'Tâche supprimée avec succès !');
    }

    /**
     * Basculer le statut terminé/non terminé
     */
    public function toggle(Client $client, Todo $todo)
    {
        // Vérifier que la tâche appartient au client et à l'utilisateur
        if ($todo->client_id !== $client->id || $todo->user_id !== Auth::id()) {
            abort(403, 'Non autorisé');
        }

        $todo->update(['termine' => !$todo->termine]);

        return redirect()->back()->with('success', 'Statut de la tâche mis à jour !');
    }

    /**
     * Réorganiser les tâches (drag & drop)
     */
    public function reorder(Request $request, Client $client)
    {
        $validated = $request->validate([
            'todos' => 'required|array',
            'todos.*.id' => 'required|exists:todos,id',
            'todos.*.ordre' => 'required|integer|min:0',
        ]);

        foreach ($validated['todos'] as $todoData) {
            $todo = Todo::find($todoData['id']);

            // Vérifier que la tâche appartient au client et à l'utilisateur
            if ($todo->client_id === $client->id && $todo->user_id === Auth::id()) {
                $todo->update(['ordre' => $todoData['ordre']]);
            }
        }

        return redirect()->back()->with('success', 'Ordre des tâches mis à jour !');
    }
}
