<?php

use App\Models\Client;
use App\Models\Entreprise;
use App\Models\Devis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Routes pour les clients
    Route::get('clients', function () {
        $clients = Client::with('entreprise')
            ->actifs()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('clients/index', [
            'clients' => $clients
        ]);
    })->name('clients.index');

    Route::get('clients/create', function () {
        $entreprises = Entreprise::actives()->orderBy('nom')->get();
        return Inertia::render('clients/create', [
            'entreprises' => $entreprises
        ]);
    })->name('clients.create');

    Route::post('clients', function (Request $request) {
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

        Client::create($validated);

        return redirect()->route('clients.index')
            ->with('success', 'Client créé avec succès.');
    })->name('clients.store');

    Route::get('clients/{client}', function (Client $client) {
        $client->load(['entreprise', 'devis']);
        return Inertia::render('clients/show', [
            'client' => $client
        ]);
    })->name('clients.show');

    Route::get('clients/{client}/edit', function (Client $client) {
        $entreprises = Entreprise::actives()->orderBy('nom')->get();
        return Inertia::render('clients/edit', [
            'client' => $client,
            'entreprises' => $entreprises
        ]);
    })->name('clients.edit');

    Route::patch('clients/{client}', function (Request $request, Client $client) {
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
    })->name('clients.update');

    Route::delete('clients/{client}', function (Client $client) {
        $client->delete();
        return redirect()->route('clients.index')
            ->with('success', 'Client supprimé avec succès.');
    })->name('clients.destroy');

    // Routes pour les entreprises
    Route::get('entreprises', function () {
        $entreprises = Entreprise::withCount('clients')
            ->actives()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('entreprises/index', [
            'entreprises' => $entreprises
        ]);
    })->name('entreprises.index');

    Route::get('entreprises/create', function () {
        return Inertia::render('entreprises/create');
    })->name('entreprises.create');

    Route::post('entreprises', function (Request $request) {
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

        Entreprise::create($validated);

        return redirect()->route('entreprises.index')
            ->with('success', 'Entreprise créée avec succès.');
    })->name('entreprises.store');

    Route::get('entreprises/{entreprise}', function (Entreprise $entreprise) {
        $entreprise->load('clients.devis');
        return Inertia::render('entreprises/show', [
            'entreprise' => $entreprise
        ]);
    })->name('entreprises.show');

    Route::get('entreprises/{entreprise}/edit', function (Entreprise $entreprise) {
        return Inertia::render('entreprises/edit', [
            'entreprise' => $entreprise
        ]);
    })->name('entreprises.edit');

    Route::patch('entreprises/{entreprise}', function (Request $request, Entreprise $entreprise) {
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
    })->name('entreprises.update');

    Route::delete('entreprises/{entreprise}', function (Entreprise $entreprise) {
        $entreprise->delete();
        return redirect()->route('entreprises.index')
            ->with('success', 'Entreprise supprimée avec succès.');
    })->name('entreprises.destroy');

    // Routes pour les devis
    Route::get('devis', function () {
        $devis = Devis::with(['client.entreprise'])
            ->actifs()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('devis/index', [
            'devis' => $devis
        ]);
    })->name('devis.index');

    Route::get('devis/create', function () {
        $clients = Client::with('entreprise')->actifs()->orderBy('nom')->get();
        return Inertia::render('devis/create', [
            'clients' => $clients,
            'numero_devis' => Devis::genererNumeroDevis()
        ]);
    })->name('devis.create');

    Route::post('devis', function (Request $request) {
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
    })->name('devis.store');

    Route::get('devis/{devis}', function (Devis $devis) {
        $devis->load(['client.entreprise']);
        return Inertia::render('devis/show', [
            'devis' => $devis
        ]);
    })->name('devis.show');

    Route::get('devis/{devis}/edit', function (Devis $devis) {
        $clients = Client::with('entreprise')->actifs()->orderBy('nom')->get();
        return Inertia::render('devis/edit', [
            'devis' => $devis,
            'clients' => $clients
        ]);
    })->name('devis.edit');

    Route::patch('devis/{devis}', function (Request $request, Devis $devis) {
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

        $devis->fill($validated);
        $devis->calculerMontants();
        $devis->save();

        return redirect()->route('devis.index')
            ->with('success', 'Devis mis à jour avec succès.');
    })->name('devis.update');

    Route::delete('devis/{devis}', function (Devis $devis) {
        $devis->delete();
        return redirect()->route('devis.index')
            ->with('success', 'Devis supprimé avec succès.');
    })->name('devis.destroy');

    // Actions spécifiques pour les devis
    Route::patch('devis/{devis}/accepter', function (Devis $devis) {
        $devis->accepter();
        return redirect()->back()
            ->with('success', 'Devis accepté avec succès.');
    })->name('devis.accepter');

    Route::patch('devis/{devis}/refuser', function (Devis $devis) {
        $devis->refuser();
        return redirect()->back()
            ->with('success', 'Devis refusé.');
    })->name('devis.refuser');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
