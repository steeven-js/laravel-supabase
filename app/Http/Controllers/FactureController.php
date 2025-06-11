<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Facture;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Exception;

class FactureController extends Controller
{
    /**
     * Affiche la liste des factures
     */
    public function index()
    {
        $factures = Facture::with(['client.entreprise', 'devis'])
            ->actives()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('factures/index', [
            'factures' => $factures
        ]);
    }

    /**
     * Affiche le formulaire de création d'une facture
     */
    public function create()
    {
        $clients = Client::with('entreprise')->actifs()->orderBy('nom')->get();

        return Inertia::render('factures/create', [
            'clients' => $clients,
            'numero_facture' => Facture::genererNumeroFacture()
        ]);
    }

    /**
     * Enregistre une nouvelle facture
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'numero_facture' => 'required|string|unique:factures,numero_facture',
                'client_id' => 'required|exists:clients,id',
                'date_facture' => 'required|date',
                'date_echeance' => 'required|date|after:date_facture',
                'objet' => 'required|string|max:255',
                'description' => 'nullable|string',
                'montant_ht' => 'required|numeric|min:0',
                'taux_tva' => 'required|numeric|min:0|max:100',
                'conditions_paiement' => 'nullable|string',
                'notes' => 'nullable|string',
            ]);

            $facture = new Facture($validated);
            $facture->statut_envoi = 'non_envoyee'; // Statut par défaut
            $facture->calculerMontants();
            $facture->save();

            return redirect()->route('factures.index')
                ->with('success', 'Facture créée avec succès.');

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
     * Affiche les détails d'une facture
     */
    public function show(Facture $facture)
    {
        $facture->load(['client.entreprise', 'devis']);

        // Construire manuellement les données pour éviter les problèmes de sérialisation
        $factureFormatted = [
            'id' => $facture->id,
            'numero_facture' => $facture->numero_facture,
            'devis_id' => $facture->devis_id,
            'client_id' => $facture->client_id,
            'objet' => $facture->objet,
            'description' => $facture->description,
            'statut' => $facture->statut,
            'date_facture' => $facture->date_facture?->format('Y-m-d') ?? '',
            'date_echeance' => $facture->date_echeance?->format('Y-m-d') ?? '',
            'date_paiement' => $facture->date_paiement?->format('Y-m-d') ?? null,
            'montant_ht' => $facture->montant_ht,
            'taux_tva' => $facture->taux_tva,
            'montant_ttc' => $facture->montant_ttc,
            'conditions_paiement' => $facture->conditions_paiement,
            'notes' => $facture->notes,
            'mode_paiement' => $facture->mode_paiement,
            'reference_paiement' => $facture->reference_paiement,
            'archive' => $facture->archive,
            'created_at' => $facture->created_at->toISOString(),
            'updated_at' => $facture->updated_at->toISOString(),
            'client' => $facture->client ? [
                'id' => $facture->client->id,
                'nom' => $facture->client->nom,
                'prenom' => $facture->client->prenom,
                'email' => $facture->client->email,
                'telephone' => $facture->client->telephone,
                'entreprise' => $facture->client->entreprise ? [
                    'id' => $facture->client->entreprise->id,
                    'nom' => $facture->client->entreprise->nom,
                    'nom_commercial' => $facture->client->entreprise->nom_commercial,
                ] : null
            ] : null,
            'devis' => $facture->devis ? [
                'id' => $facture->devis->id,
                'numero_devis' => $facture->devis->numero_devis,
            ] : null
        ];

        return Inertia::render('factures/show', [
            'facture' => $factureFormatted
        ]);
    }

    /**
     * Affiche le formulaire d'édition d'une facture
     */
    public function edit(Facture $facture)
    {
        $facture->load(['client.entreprise', 'devis']);
        $clients = Client::with('entreprise')->actifs()->orderBy('nom')->get();

        // Construire manuellement les données pour éviter les problèmes de sérialisation
        $factureFormatted = [
            'id' => $facture->id,
            'numero_facture' => $facture->numero_facture,
            'devis_id' => $facture->devis_id,
            'client_id' => $facture->client_id,
            'objet' => $facture->objet,
            'statut' => $facture->statut,
            'date_facture' => $facture->date_facture?->format('Y-m-d') ?? '',
            'date_echeance' => $facture->date_echeance?->format('Y-m-d') ?? '',
            'montant_ht' => $facture->montant_ht,
            'taux_tva' => $facture->taux_tva,
            'montant_ttc' => $facture->montant_ttc,
            'notes' => $facture->notes,
            'description' => $facture->description,
            'conditions_paiement' => $facture->conditions_paiement,
            'archive' => $facture->archive,
            'client' => $facture->client ? [
                'id' => $facture->client->id,
                'nom' => $facture->client->nom,
                'prenom' => $facture->client->prenom,
                'email' => $facture->client->email,
                'entreprise' => $facture->client->entreprise ? [
                    'id' => $facture->client->entreprise->id,
                    'nom' => $facture->client->entreprise->nom,
                    'nom_commercial' => $facture->client->entreprise->nom_commercial,
                ] : null
            ] : null
        ];

        return Inertia::render('factures/edit', [
            'facture' => $factureFormatted,
            'clients' => $clients
        ]);
    }

    /**
     * Met à jour une facture
     */
    public function update(Request $request, Facture $facture)
    {
        try {
            $validated = $request->validate([
                'numero_facture' => 'required|string|unique:factures,numero_facture,' . $facture->id,
                'client_id' => 'required|exists:clients,id',
                'date_facture' => 'required|date',
                'date_echeance' => 'required|date|after:date_facture',
                'statut' => 'required|in:brouillon,envoyee,payee,en_retard,annulee',
                'objet' => 'required|string|max:255',
                'description' => 'nullable|string',
                'montant_ht' => 'required|numeric|min:0',
                'taux_tva' => 'required|numeric|min:0|max:100',
                'conditions_paiement' => 'nullable|string',
                'notes' => 'nullable|string',
                'archive' => 'boolean',
            ]);

            // Convertir explicitement les montants en float
            if (isset($validated['montant_ht'])) {
                $validated['montant_ht'] = (float) $validated['montant_ht'];
            }
            if (isset($validated['taux_tva'])) {
                $validated['taux_tva'] = (float) $validated['taux_tva'];
            }

            $facture->fill($validated);
            $facture->calculerMontants();
            $facture->save();

            return redirect()->route('factures.index')
                ->with('success', 'Facture mise à jour avec succès.');

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
     * Supprime une facture
     */
    public function destroy(Facture $facture)
    {
        try {
            $numero_facture = $facture->numero_facture;
            $facture->delete();

            return redirect()->route('factures.index')
                ->with('success', 'Facture supprimée avec succès.');

        } catch (Exception $e) {
            return back();
        }
    }

    /**
     * Marquer une facture comme payée
     */
    public function marquerPayee(Request $request, Facture $facture)
    {
        try {
            $validated = $request->validate([
                'mode_paiement' => 'required|string|max:255',
                'reference_paiement' => 'nullable|string|max:255',
            ]);

            $facture->marquerPayee(
                $validated['mode_paiement'],
                $validated['reference_paiement'] ?? null
            );

            return redirect()->back()
                ->with('success', 'Facture marquée comme payée.');

        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->errors());
        } catch (Exception $e) {
            return back();
        }
    }

    /**
     * Envoyer une facture au client par email
     */
    public function envoyerEmail(Request $request, Facture $facture)
    {
        if (!$facture->peutEtreEnvoyee()) {
            return redirect()->back()
                ->with('error', 'Cette facture ne peut pas être envoyée.');
        }

        $validated = $request->validate([
            'message_client' => 'nullable|string',
            'envoyer_copie_admin' => 'boolean',
        ]);

        try {
            $facture->load('client.entreprise', 'devis');

            // Envoyer email au client
            $this->envoyerEmailClientFacture($facture, $validated['message_client'] ?? null);

            // Mettre à jour le statut
            $facture->marquerEnvoyee();

            // Envoyer copie à l'admin si demandé
            if ($validated['envoyer_copie_admin'] ?? false) {
                try {
                    $this->envoyerEmailAdminFacture($facture);
                    $facture->date_envoi_admin = now();
                    $facture->save();
                } catch (\Exception $e) {
                    Log::warning('Erreur lors de l\'envoi de la copie admin', [
                        'facture_numero' => $facture->numero_facture,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            Log::info('Facture envoyée par email', [
                'facture_numero' => $facture->numero_facture,
                'client_email' => $facture->client->email
            ]);

            return redirect()->back()
                ->with('success', 'Facture envoyée avec succès au client.');

        } catch (\Exception $e) {
            $facture->marquerEchecEnvoi();

            Log::error('Erreur lors de l\'envoi de la facture', [
                'facture_numero' => $facture->numero_facture,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()
                ->with('error', 'Erreur lors de l\'envoi de la facture : ' . $e->getMessage());
        }
    }

    /**
     * Envoyer une facture au client (méthode simplifiée pour compatibilité)
     */
    public function envoyer(Facture $facture)
    {
        return $this->envoyerEmail(request(), $facture);
    }

    /**
     * Envoyer un email au client pour une nouvelle facture
     */
    private function envoyerEmailClientFacture(Facture $facture, ?string $messagePersonnalise)
    {
        try {
            // Créer un devis fictif pour la compatibilité avec FactureClientMail
            $devis = $facture->devis ?? new \App\Models\Devis([
                'numero_devis' => 'N/A',
                'objet' => $facture->objet
            ]);

            Mail::to($facture->client->email)->send(
                new \App\Mail\FactureClientMail(
                    $devis,
                    $facture,
                    $facture->client,
                    $messagePersonnalise
                )
            );

            Log::info('Email de facture envoyé au client', [
                'facture_numero' => $facture->numero_facture,
                'client_email' => $facture->client->email
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur envoi email client facture', [
                'facture_numero' => $facture->numero_facture,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Envoyer un email de notification à l'admin pour une nouvelle facture
     */
    private function envoyerEmailAdminFacture(Facture $facture)
    {
        try {
            $adminEmail = config('mail.admin_email');

            if (!$adminEmail) {
                Log::warning('Email admin non configuré, envoi ignoré');
                return;
            }

            // Créer un devis fictif pour la compatibilité avec FactureAdminMail
            $devis = $facture->devis ?? new \App\Models\Devis([
                'numero_devis' => 'N/A',
                'objet' => $facture->objet
            ]);

            Mail::to($adminEmail)->send(
                new \App\Mail\FactureAdminMail(
                    $devis,
                    $facture,
                    $facture->client
                )
            );

            Log::info('Email de notification admin facture envoyé', [
                'facture_numero' => $facture->numero_facture
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur envoi email admin facture', [
                'facture_numero' => $facture->numero_facture,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}
