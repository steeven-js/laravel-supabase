<?php

namespace App\Http\Controllers;

use App\Models\Entreprise;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Exception;

class EntrepriseController extends Controller
{
    /**
     * Affiche la liste des entreprises
     */
    public function index()
    {
        $entreprises = Entreprise::withCount('clients')
            ->actives()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('entreprises/index', [
            'entreprises' => $entreprises
        ]);
    }

    /**
     * Affiche le formulaire de création d'une entreprise
     */
    public function create()
    {
        return Inertia::render('entreprises/create');
    }

    /**
     * Enregistre une nouvelle entreprise
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nom' => 'required|string|max:255',
                'nom_commercial' => 'nullable|string|max:255',
                'siret' => 'nullable|string|max:14|unique:entreprises,siret',
                'siren' => 'nullable|string|max:9',
                'secteur_activite' => 'nullable|string|max:255',
                'adresse' => 'nullable|string',
                'ville' => 'nullable|string|max:255',
                'code_postal' => 'nullable|string|max:10',
                'pays' => 'nullable|string|max:255',
                'telephone' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'site_web' => 'nullable|url|max:255',
                'nombre_employes' => 'nullable|integer|min:0',
                'chiffre_affaires' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string',
            ]);

            $entreprise = Entreprise::create($validated);

            return redirect()->route('entreprises.index')
                ->with('success', 'Entreprise créée avec succès.');

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
     * Affiche les détails d'une entreprise
     */
    public function show(Entreprise $entreprise)
    {
        $entreprise->load('clients.devis');

        return Inertia::render('entreprises/show', [
            'entreprise' => $entreprise
        ]);
    }

    /**
     * Affiche le formulaire d'édition d'une entreprise
     */
    public function edit(Entreprise $entreprise)
    {
        return Inertia::render('entreprises/edit', [
            'entreprise' => $entreprise
        ]);
    }

    /**
     * Met à jour une entreprise
     */
    public function update(Request $request, Entreprise $entreprise)
    {
        try {
            $validated = $request->validate([
                'nom' => 'required|string|max:255',
                'nom_commercial' => 'nullable|string|max:255',
                'siret' => 'nullable|string|max:14|unique:entreprises,siret,' . $entreprise->id,
                'siren' => 'nullable|string|max:9',
                'secteur_activite' => 'nullable|string|max:255',
                'adresse' => 'nullable|string',
                'ville' => 'nullable|string|max:255',
                'code_postal' => 'nullable|string|max:10',
                'pays' => 'nullable|string|max:255',
                'telephone' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'site_web' => 'nullable|url|max:255',
                'nombre_employes' => 'nullable|integer|min:0',
                'chiffre_affaires' => 'nullable|numeric|min:0',
                'active' => 'boolean',
                'notes' => 'nullable|string',
            ]);

            $entreprise->update($validated);

            return redirect()->route('entreprises.index')
                ->with('success', 'Entreprise mise à jour avec succès.');

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
     * Supprime une entreprise
     */
    public function destroy(Entreprise $entreprise)
    {
        try {
            $nom_entreprise = $entreprise->nom;
            $entreprise->delete();

            return redirect()->route('entreprises.index')
                ->with('success', 'Entreprise supprimée avec succès.');

        } catch (Exception $e) {
            return back();
        }
    }
}
