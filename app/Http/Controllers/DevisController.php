<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Devis;
use App\Models\Facture;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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
        $devis->load(['client.entreprise', 'facture']);

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
            'created_at' => $devis->created_at->toISOString(),
            'updated_at' => $devis->updated_at->toISOString(),
            'peut_etre_transforme_en_facture' => $devis->peutEtreTransformeEnFacture(),
            'facture' => $devis->facture ? [
                'id' => $devis->facture->id,
                'numero_facture' => $devis->facture->numero_facture,
                'statut' => $devis->facture->statut,
            ] : null,
            'client' => $devis->client ? [
                'id' => $devis->client->id,
                'nom' => $devis->client->nom,
                'prenom' => $devis->client->prenom,
                'email' => $devis->client->email,
                'telephone' => $devis->client->telephone,
                'entreprise' => $devis->client->entreprise ? [
                    'id' => $devis->client->entreprise->id,
                    'nom' => $devis->client->entreprise->nom,
                    'nom_commercial' => $devis->client->entreprise->nom_commercial,
                ] : null
            ] : null
        ];

        return Inertia::render('devis/show', [
            'devis' => $devisFormatted
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

    /**
     * Transformer un devis en facture - Afficher le modal de validation
     */
    public function transformerEnFacture(Devis $devis)
    {
        // Vérifier que le devis peut être transformé
        if (!$devis->peutEtreTransformeEnFacture()) {
            return redirect()->back()
                ->with('error', 'Ce devis ne peut pas être transformé en facture.');
        }

        $devis->load(['client.entreprise']);

        // Préparer les données pour le modal
        $devisData = [
            'id' => $devis->id,
            'numero_devis' => $devis->numero_devis,
            'client' => [
                'id' => $devis->client->id,
                'nom' => $devis->client->nom,
                'prenom' => $devis->client->prenom,
                'email' => $devis->client->email,
                'entreprise' => $devis->client->entreprise ? [
                    'nom' => $devis->client->entreprise->nom,
                    'nom_commercial' => $devis->client->entreprise->nom_commercial,
                ] : null
            ],
            'objet' => $devis->objet,
            'montant_ht' => $devis->montant_ht,
            'montant_ttc' => $devis->montant_ttc,
            'taux_tva' => $devis->taux_tva,
        ];

        return Inertia::render('devis/transformer-facture', [
            'devis' => $devisData,
            'numero_facture_propose' => Facture::genererNumeroFacture(),
            'date_facture_defaut' => now()->toDateString(),
            'date_echeance_defaut' => now()->addDays(30)->toDateString(),
        ]);
    }

    /**
     * Traiter la transformation du devis en facture
     */
    public function confirmerTransformationFacture(Request $request, Devis $devis)
    {
        // Vérifier que le devis peut être transformé
        if (!$devis->peutEtreTransformeEnFacture()) {
            return redirect()->back()
                ->with('error', 'Ce devis ne peut pas être transformé en facture.');
        }

        $validated = $request->validate([
            'date_facture' => 'required|date',
            'date_echeance' => 'required|date|after:date_facture',
            'conditions_paiement' => 'nullable|string',
            'notes_facture' => 'nullable|string',
            'envoyer_email_client' => 'boolean',
            'envoyer_email_admin' => 'boolean',
            'message_client' => 'nullable|string',
        ]);

        try {
            // Transformer le devis en facture
            $parametresFacture = [
                'date_facture' => $validated['date_facture'],
                'date_echeance' => $validated['date_echeance'],
                'conditions_paiement' => $validated['conditions_paiement'] ?? null,
                'notes' => $validated['notes_facture'] ?? null,
            ];

            $facture = $devis->transformerEnFacture($parametresFacture);

            // Marquer la date d'envoi admin
            $facture->date_envoi_admin = now();
            $facture->save();

            // Préparer les données pour les emails
            $donneesEmail = [
                'devis' => $devis,
                'facture' => $facture,
                'client' => $devis->client,
                'message_personnalise' => $validated['message_client'] ?? null,
            ];

            // Envoyer les emails si demandé
            $erreursMails = [];

            if ($validated['envoyer_email_client'] ?? false) {
                try {
                    $this->envoyerEmailClient($donneesEmail);
                    $facture->date_envoi_client = now();
                    $facture->marquerEnvoyee();
                } catch (\Exception $e) {
                    $erreursMails[] = 'Erreur lors de l\'envoi de l\'email au client : ' . $e->getMessage();
                }
            }

            if ($validated['envoyer_email_admin'] ?? false) {
                try {
                    $this->envoyerEmailAdmin($donneesEmail);
                } catch (\Exception $e) {
                    $erreursMails[] = 'Erreur lors de l\'envoi de l\'email à l\'admin : ' . $e->getMessage();
                }
            }

            $message = 'Devis transformé en facture avec succès. Facture n°' . $facture->numero_facture . ' créée.';

            if (!empty($erreursMails)) {
                $message .= ' Cependant, des erreurs sont survenues lors de l\'envoi des emails : ' . implode(', ', $erreursMails);
                return redirect()->route('factures.show', $facture)
                    ->with('warning', $message);
            }

            return redirect()->route('factures.show', $facture)
                ->with('success', $message);

        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Erreur lors de la transformation : ' . $e->getMessage());
        }
    }

    /**
     * Envoyer un email au client pour la nouvelle facture
     */
    private function envoyerEmailClient(array $donnees)
    {
        try {
            Mail::to($donnees['client']->email)->send(
                new \App\Mail\FactureClientMail(
                    $donnees['devis'],
                    $donnees['facture'],
                    $donnees['client'],
                    $donnees['message_personnalise']
                )
            );

            Log::info('Email envoyé au client', [
                'client_email' => $donnees['client']->email,
                'facture_numero' => $donnees['facture']->numero_facture
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi de l\'email client', [
                'client_email' => $donnees['client']->email,
                'facture_numero' => $donnees['facture']->numero_facture,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Envoyer un email de confirmation à l'admin
     */
    private function envoyerEmailAdmin(array $donnees)
    {
        try {
            $adminEmail = config('mail.admin_email');

            if (!$adminEmail) {
                Log::warning('Email admin non configuré, envoi ignoré');
                return;
            }

            Mail::to($adminEmail)->send(
                new \App\Mail\FactureAdminMail(
                    $donnees['devis'],
                    $donnees['facture'],
                    $donnees['client']
                )
            );

            Log::info('Email de confirmation envoyé à l\'admin', [
                'admin_email' => $adminEmail,
                'facture_numero' => $donnees['facture']->numero_facture,
                'client' => $donnees['client']->nom . ' ' . $donnees['client']->prenom
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi de l\'email admin', [
                'facture_numero' => $donnees['facture']->numero_facture,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}
