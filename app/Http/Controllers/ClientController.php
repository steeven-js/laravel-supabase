<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Entreprise;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Exception;

class ClientController extends Controller
{
    /**
     * Affiche la liste des clients
     */
    public function index()
    {
        $clients = Client::with('entreprise')
            ->actifs()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('clients/index', [
            'clients' => $clients
        ]);
    }

    /**
     * Affiche le formulaire de création d'un client
     */
    public function create()
    {
        $entreprises = Entreprise::actives()->orderBy('nom')->get();

        return Inertia::render('clients/create', [
            'entreprises' => $entreprises
        ]);
    }

    /**
     * Enregistre un nouveau client
     */
    public function store(Request $request)
    {
        try {
            // Convertir "none" en null pour entreprise_id
            $requestData = $request->all();
            if (isset($requestData['entreprise_id']) && $requestData['entreprise_id'] === 'none') {
                $requestData['entreprise_id'] = null;
            }

            // Créer une nouvelle instance de Request avec les données corrigées
            $request->replace($requestData);

            $validated = $request->validate([
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'email' => 'required|email|unique:clients,email',
                'telephone' => 'nullable|string|max:255',
                'adresse' => 'nullable|string',
                'ville' => 'nullable|string|max:255',
                'code_postal' => 'nullable|string|max:10',
                'pays' => 'nullable|string|max:255',
                'entreprise_id' => 'nullable|exists:entreprises,id',
                'notes' => 'nullable|string',
            ]);

            $client = Client::create($validated);

            return redirect()->route('clients.index')
                ->with('success', 'Client créé avec succès.');

        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput();
        } catch (Exception $e) {
            return back()
                ->withInput();
        }
    }

    /**
     * Affiche les détails d'un client
     */
    public function show(Client $client)
    {
        $client->load(['entreprise', 'devis']);

        return Inertia::render('clients/show', [
            'client' => $client
        ]);
    }

    /**
     * Affiche le formulaire d'édition d'un client
     */
    public function edit(Client $client)
    {
        $entreprises = Entreprise::actives()->orderBy('nom')->get();

        return Inertia::render('clients/edit', [
            'client' => $client,
            'entreprises' => $entreprises
        ]);
    }

    /**
     * Met à jour un client
     */
    public function update(Request $request, Client $client)
    {
        try {
            // Convertir "none" en null pour entreprise_id
            $requestData = $request->all();
            if (isset($requestData['entreprise_id']) && $requestData['entreprise_id'] === 'none') {
                $requestData['entreprise_id'] = null;
            }

            // Créer une nouvelle instance de Request avec les données corrigées
            $request->replace($requestData);

            $validated = $request->validate([
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'email' => 'required|email|unique:clients,email,' . $client->id,
                'telephone' => 'nullable|string|max:255',
                'adresse' => 'nullable|string',
                'ville' => 'nullable|string|max:255',
                'code_postal' => 'nullable|string|max:10',
                'pays' => 'nullable|string|max:255',
                'entreprise_id' => 'nullable|exists:entreprises,id',
                'actif' => 'boolean',
                'notes' => 'nullable|string',
            ]);

            $client->update($validated);

            return redirect()->route('clients.index')
                ->with('success', 'Client mis à jour avec succès.');

        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput();

        } catch (Exception $e) {
            return back()
                ->withInput();
        }
    }

    /**
     * Supprime un client
     */
    public function destroy(Client $client)
    {
        try {
            $nom_complet = "{$client->prenom} {$client->nom}";
            $client->delete();

            return redirect()->route('clients.index')
                ->with('success', 'Client supprimé avec succès.');

        } catch (Exception $e) {
            return back();
        }
    }
}
