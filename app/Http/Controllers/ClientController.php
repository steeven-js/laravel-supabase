<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientEmail;
use App\Models\Entreprise;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
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
                ->with('success', '✅ Client ' . $client->prenom . ' ' . $client->nom . ' créé avec succès !');

        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', '❌ Erreur de validation. Veuillez vérifier les informations saisies.');
        } catch (Exception $e) {
            return back()
                ->withInput()
                ->with('error', '❌ Une erreur est survenue lors de la création du client.');
        }
    }

    /**
     * Affiche les détails d'un client
     */
    public function show(Client $client)
    {
        $client->load([
            'entreprise',
            'devis',
            'emails' => function($query) {
                $query->with('user')->orderBy('date_envoi', 'desc');
            }
        ]);

        return Inertia::render('clients/show', [
            'client' => $client
        ]);
    }

    /**
     * Envoie un email au client
     */
    public function sendEmail(Request $request, Client $client)
    {
        try {
            $validated = $request->validate([
                'objet' => 'required|string|max:255',
                'contenu' => 'required|string',
            ]);

            // Enregistrer l'email dans la base de données
            $clientEmail = ClientEmail::create([
                'client_id' => $client->id,
                'user_id' => Auth::id(),
                'objet' => $validated['objet'],
                'contenu' => $validated['contenu'],
                'statut' => 'envoye',
                'date_envoi' => now(),
            ]);

            try {
                // Ici vous pouvez ajouter l'envoi réel de l'email avec Mail::send
                // Pour l'instant, nous simulons un envoi réussi

                // Mail::send([], [], function ($message) use ($client, $validated) {
                //     $message->to($client->email, $client->nom_complet)
                //             ->subject($validated['objet'])
                //             ->html($validated['contenu']);
                // });

            } catch (Exception $e) {
                // Marquer l'email comme échoué si l'envoi réel échoue
                $clientEmail->update(['statut' => 'echec']);
                throw $e;
            }

            return back()->with('success', '📧 Email envoyé avec succès à ' . $client->nom_complet);

        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->with('error', '❌ Erreur de validation. Veuillez vérifier les informations saisies.');

        } catch (Exception $e) {
            return back()
                ->with('error', '❌ Erreur lors de l\'envoi de l\'email. Veuillez réessayer.');
        }
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

            // Vérifier s'il y a eu des changements
            $originalData = $client->only(array_keys($validated));
            $hasChanges = false;
            foreach ($validated as $key => $value) {
                if ($originalData[$key] != $value) {
                    $hasChanges = true;
                    break;
                }
            }

            $client->update($validated);

            if ($hasChanges) {
                return redirect()->route('clients.index')
                    ->with('success', '🎉 Client ' . $client->prenom . ' ' . $client->nom . ' mis à jour avec succès !');
            } else {
                return redirect()->route('clients.index')
                    ->with('info', 'ℹ️ Aucune modification détectée pour ' . $client->prenom . ' ' . $client->nom);
            }

        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', '❌ Erreur de validation. Veuillez vérifier les informations saisies.');

        } catch (Exception $e) {
            return back()
                ->withInput()
                ->with('error', '❌ Une erreur est survenue lors de la mise à jour du client.');
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
                ->with('warning', '⚠️ Client ' . $nom_complet . ' supprimé avec succès.');

        } catch (Exception $e) {
            return back()
                ->with('error', '❌ Impossible de supprimer le client. Il pourrait être lié à d\'autres données.');
        }
    }
}
