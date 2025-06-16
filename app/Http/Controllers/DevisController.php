<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Devis;
use App\Models\Facture;
use App\Services\DevisPdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Exception;

/**
 * Contrôleur de gestion des devis
 *
 * Ce contrôleur gère toutes les opérations liées aux devis :
 * - Création, modification et suppression de devis
 * - Gestion des statuts (brouillon, envoyé, accepté, refusé, expiré)
 * - Envoi des devis par email aux clients
 * - Génération et gestion des PDF
 * - Transformation des devis en factures
 */
class DevisController extends Controller
{
    protected $devisPdfService;

    /**
     * Constructeur du contrôleur
     * Injection du service de génération de PDF pour les devis
     */
    public function __construct(DevisPdfService $devisPdfService)
    {
        $this->devisPdfService = $devisPdfService;
    }

    /**
     * Affiche la liste des devis
     *
     * @return \Inertia\Response
     * Retourne la vue avec la liste des devis actifs, triés par date de création
     * Chaque devis inclut les informations du client et de son entreprise
     */
    public function index()
    {
        $devis = Devis::with(['client.entreprise'])
            ->actifs()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($devis) {
                return [
                    'id' => $devis->id,
                    'numero_devis' => $devis->numero_devis,
                    'objet' => $devis->objet,
                    'statut' => $devis->statut,
                    'statut_envoi' => $devis->statut_envoi,
                    'date_devis' => $devis->date_devis->format('Y-m-d'),
                    'date_validite' => $devis->date_validite->format('Y-m-d'),
                    'date_envoi_client' => $devis->date_envoi_client?->toISOString(),
                    'date_envoi_admin' => $devis->date_envoi_admin?->toISOString(),
                    'montant_ttc' => (float) $devis->montant_ttc,
                    'peut_etre_envoye' => $devis->peutEtreEnvoye(),
                    'client' => [
                        'nom' => $devis->client->nom,
                        'prenom' => $devis->client->prenom,
                        'email' => $devis->client->email,
                        'entreprise' => $devis->client->entreprise ? [
                            'nom' => $devis->client->entreprise->nom,
                            'nom_commercial' => $devis->client->entreprise->nom_commercial,
                        ] : null
                    ],
                    'created_at' => $devis->created_at->toISOString(),
                ];
            });

        return Inertia::render('devis/index', [
            'devis' => $devis
        ]);
    }

    /**
     * Affiche le formulaire de création d'un nouveau devis
     *
     * @return \Inertia\Response
     * Retourne la vue avec :
     * - La liste des clients actifs
     * - La liste des services disponibles
     * - Les informations de l'entreprise Madinia
     * - Un numéro de devis généré automatiquement
     */
    public function create()
    {
        $clients = Client::with('entreprise')->actifs()->orderBy('nom')->get();
        $services = \App\Models\Service::actif()->orderBy('nom')->get();
        $madinia = \App\Models\Madinia::getInstance();
        $administrateurs = \App\Models\User::select('id', 'name', 'email')->orderBy('name')->get();

        return Inertia::render('devis/create', [
            'clients' => $clients,
            'services' => $services,
            'administrateurs' => $administrateurs,
            'numero_devis' => Devis::genererNumeroDevis(),
            'madinia' => $madinia ? [
                'name' => $madinia->name,
                'telephone' => $madinia->telephone,
                'email' => $madinia->email,
                'adresse' => $madinia->adresse,
                'pays' => $madinia->pays,
                'siret' => $madinia->siret,
                'numero_nda' => $madinia->numero_nda,
                'nom_compte_bancaire' => $madinia->nom_compte_bancaire,
                'nom_banque' => $madinia->nom_banque,
                'numero_compte' => $madinia->numero_compte,
                'iban_bic_swift' => $madinia->iban_bic_swift,
            ] : null,
        ]);
    }

    /**
     * Enregistre un nouveau devis
     *
     * @param Request $request Les données du formulaire
     * @return \Illuminate\Http\RedirectResponse
     *
     * Processus :
     * 1. Validation des données
     * 2. Génération du numéro de devis
     * 3. Création du devis
     * 4. Création des lignes de devis
     * 5. Calcul des montants
     * 6. Génération du PDF
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'client_id' => 'required|exists:clients,id',
                'administrateur_id' => 'required|exists:users,id',
                'date_devis' => 'required|date',
                'date_validite' => 'required|date|after:date_devis',
                'objet' => 'required|string|max:255',
                'description' => 'nullable|string',
                'conditions' => 'nullable|string',
                'notes' => 'nullable|string',
                'lignes' => 'required|array|min:1',
                'lignes.*.service_id' => 'nullable|exists:services,id',
                'lignes.*.quantite' => 'required|numeric|min:0',
                'lignes.*.prix_unitaire_ht' => 'required|numeric|min:0',
                'lignes.*.taux_tva' => 'required|numeric|min:0|max:100',
                'lignes.*.description_personnalisee' => 'nullable|string',
                'lignes.*.ordre' => 'required|integer|min:1',
            ]);

            // Générer automatiquement le numéro de devis
            $validated['numero_devis'] = Devis::genererNumeroDevis();

            // Créer le devis avec le statut par défaut "en_attente"
            $devis = new Devis();
            $devis->fill($validated);
            $devis->statut = 'en_attente';
            $devis->statut_envoi = 'non_envoye';
            $devis->save();

            // Créer les lignes de devis
            foreach ($validated['lignes'] as $ligneData) {
                $ligne = new \App\Models\LigneDevis();
                $ligne->devis_id = $devis->id;
                $ligne->fill($ligneData);
                $ligne->save(); // Les montants seront calculés automatiquement via le boot()
            }

            // Recalculer les montants du devis
            $devis->calculerMontants();
            $devis->save();

            // PDF sera généré par React uniquement (via generateAndSavePdf dans edit.tsx)
            Log::info('Devis créé - PDF sera généré côté client', [
                'devis_id' => $devis->id,
                'numero_devis' => $devis->numero_devis
            ]);

            return redirect()->route('devis.show', $devis)
                ->with('success', '✅ Devis ' . $devis->numero_devis . ' créé avec succès et placé en attente !');
        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', '❌ Erreur de validation. Veuillez vérifier les informations saisies.');
        } catch (Exception $e) {
            return back()
                ->withInput()
                ->with('error', '❌ Une erreur est survenue lors de la création du devis.');
        }
    }

    /**
     * Enregistre un nouveau devis en statut brouillon
     *
     * @param Request $request Les données du formulaire
     * @return \Illuminate\Http\RedirectResponse
     *
     * Processus identique au store() mais avec statut "brouillon"
     */
    public function storeBrouillon(Request $request)
    {
        try {
            $validated = $request->validate([
                'client_id' => 'required|exists:clients,id',
                'administrateur_id' => 'required|exists:users,id',
                'date_devis' => 'required|date',
                'date_validite' => 'required|date|after:date_devis',
                'objet' => 'required|string|max:255',
                'description' => 'nullable|string',
                'conditions' => 'nullable|string',
                'notes' => 'nullable|string',
                'lignes' => 'required|array|min:1',
                'lignes.*.service_id' => 'nullable|exists:services,id',
                'lignes.*.quantite' => 'required|numeric|min:0',
                'lignes.*.prix_unitaire_ht' => 'required|numeric|min:0',
                'lignes.*.taux_tva' => 'required|numeric|min:0|max:100',
                'lignes.*.description_personnalisee' => 'nullable|string',
                'lignes.*.ordre' => 'required|integer|min:1',
            ]);

            // Générer automatiquement le numéro de devis
            $validated['numero_devis'] = Devis::genererNumeroDevis();

            // Créer le devis avec le statut "brouillon"
            $devis = new Devis();
            $devis->fill($validated);
            $devis->statut = 'brouillon';
            $devis->statut_envoi = 'non_envoye';
            $devis->save();

            // Créer les lignes de devis
            foreach ($validated['lignes'] as $ligneData) {
                $ligne = new \App\Models\LigneDevis();
                $ligne->devis_id = $devis->id;
                $ligne->fill($ligneData);
                $ligne->save(); // Les montants seront calculés automatiquement via le boot()
            }

            // Recalculer les montants du devis
            $devis->calculerMontants();
            $devis->save();

            // PDF sera généré par React uniquement (via generateAndSavePdf dans edit.tsx)
            Log::info('Devis brouillon créé - PDF sera généré côté client', [
                'devis_id' => $devis->id,
                'numero_devis' => $devis->numero_devis
            ]);

            return redirect()->route('devis.show', $devis)
                ->with('success', '📝 Devis ' . $devis->numero_devis . ' enregistré comme brouillon !');
        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', '❌ Erreur de validation. Veuillez vérifier les informations saisies.');
        } catch (Exception $e) {
            return back()
                ->withInput()
                ->with('error', '❌ Une erreur est survenue lors de la création du devis.');
        }
    }

    /**
     * Affiche les détails d'un devis
     *
     * @param Devis $devis Le devis à afficher
     * @return \Inertia\Response
     *
     * Inclut :
     * - Les informations détaillées du devis
     * - L'historique des modifications
     * - Le statut du PDF
     * - Les informations de l'entreprise Madinia
     */
    public function show(Devis $devis)
    {
        $devis->load(['client.entreprise', 'facture', 'lignes.service', 'administrateur']);

        // Récupérer l'historique des actions avec les utilisateurs
        $historique = $devis->historique()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($action) {
                return [
                    'id' => $action->id,
                    'action' => $action->action,
                    'titre' => $action->titre,
                    'description' => $action->description,
                    'donnees_avant' => $action->donnees_avant,
                    'donnees_apres' => $action->donnees_apres,
                    'donnees_supplementaires' => $action->donnees_supplementaires,
                    'created_at' => $action->created_at->toISOString(),
                    'user' => $action->user ? [
                        'id' => $action->user->id,
                        'name' => $action->user->name,
                        'email' => $action->user->email,
                    ] : null,
                    'user_nom' => $action->user_nom,
                    'user_email' => $action->user_email,
                ];
            });

        // Récupérer les informations Madinia
        $madinia = \App\Models\Madinia::getInstance();

        // Construire manuellement les données pour éviter les problèmes de sérialisation
        $devisFormatted = [
            'id' => $devis->id,
            'numero_devis' => $devis->numero_devis,
            'administrateur_id' => $devis->administrateur_id,
            'client_id' => $devis->client_id,
            'objet' => $devis->objet,
            'statut' => $devis->statut,
            'statut_envoi' => $devis->statut_envoi,
            'date_devis' => $devis->date_devis?->format('Y-m-d') ?? '',
            'date_validite' => $devis->date_validite?->format('Y-m-d') ?? '',
            'date_envoi_client' => $devis->date_envoi_client?->toISOString(),
            'date_envoi_admin' => $devis->date_envoi_admin?->toISOString(),
            'montant_ht' => (float) $devis->montant_ht,
            'taux_tva' => (float) $devis->taux_tva,
            'montant_ttc' => (float) $devis->montant_ttc,
            'notes' => $devis->notes,
            'description' => $devis->description,
            'conditions' => $devis->conditions,
            'created_at' => $devis->created_at->toISOString(),
            'updated_at' => $devis->updated_at->toISOString(),
            'peut_etre_transforme_en_facture' => $devis->peutEtreTransformeEnFacture(),
            'peut_etre_envoye' => $devis->peutEtreEnvoye(),
            'pdf_url_supabase' => $this->devisPdfService->getUrlSupabasePdf($devis),
            'administrateur' => $devis->administrateur ? [
                'id' => $devis->administrateur->id,
                'name' => $devis->administrateur->name,
                'email' => $devis->administrateur->email,
            ] : null,
            'lignes' => $devis->lignes->map(function ($ligne) {
                return [
                    'id' => $ligne->id,
                    'service_id' => $ligne->service_id,
                    'quantite' => (float) $ligne->quantite,
                    'prix_unitaire_ht' => (float) $ligne->prix_unitaire_ht,
                    'taux_tva' => (float) $ligne->taux_tva,
                    'montant_ht' => (float) $ligne->montant_ht,
                    'montant_tva' => (float) $ligne->montant_tva,
                    'montant_ttc' => (float) $ligne->montant_ttc,
                    'ordre' => $ligne->ordre,
                    'description_personnalisee' => $ligne->description_personnalisee,
                    'service' => $ligne->service ? [
                        'id' => $ligne->service->id,
                        'nom' => $ligne->service->nom,
                        'description' => $ligne->service->description,
                        'code' => $ligne->service->code,
                        'unite' => $ligne->service->unite ? $ligne->service->unite->value : null,
                    ] : null
                ];
            }),
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
                'adresse' => $devis->client->adresse,
                'ville' => $devis->client->ville,
                'code_postal' => $devis->client->code_postal,
                'entreprise' => $devis->client->entreprise ? [
                    'id' => $devis->client->entreprise->id,
                    'nom' => $devis->client->entreprise->nom,
                    'nom_commercial' => $devis->client->entreprise->nom_commercial,
                    'adresse' => $devis->client->entreprise->adresse,
                    'ville' => $devis->client->entreprise->ville,
                    'code_postal' => $devis->client->entreprise->code_postal,
                ] : null
            ] : null
        ];

        // Vérifier le statut du PDF
        $pdfStatus = $this->getPdfStatusData($devis);

        return Inertia::render('devis/show', [
            'devis' => $devisFormatted,
            'historique' => $historique,
            'pdfStatus' => $pdfStatus,
            'madinia' => [
                'id' => $madinia->id,
                'name' => $madinia->name,
                'telephone' => $madinia->telephone,
                'email' => $madinia->email,
                'site_web' => $madinia->site_web,
                'siret' => $madinia->siret,
                'numero_nda' => $madinia->numero_nda,
                'pays' => $madinia->pays,
                'adresse' => $madinia->adresse,
                'description' => $madinia->description,
                'nom_compte_bancaire' => $madinia->nom_compte_bancaire,
                'nom_banque' => $madinia->nom_banque,
                'numero_compte' => $madinia->numero_compte,
                'iban_bic_swift' => $madinia->iban_bic_swift,
            ]
        ]);
    }

    /**
     * Affiche le formulaire d'édition d'un devis
     */
    public function edit(Devis $devis)
    {
        $devis->load(['client.entreprise', 'lignes.service', 'administrateur']);
        $clients = Client::with('entreprise')->actifs()->orderBy('nom')->get();
        $services = \App\Models\Service::actif()->orderBy('nom')->get();
        $administrateurs = \App\Models\User::select('id', 'name', 'email')->orderBy('name')->get();
        $madinia = \App\Models\Madinia::getInstance();

        // Construire manuellement les données pour éviter les problèmes de sérialisation
        $devisFormatted = [
            'id' => $devis->id,
            'numero_devis' => $devis->numero_devis,
            'administrateur_id' => $devis->administrateur_id,
            'client_id' => $devis->client_id,
            'objet' => $devis->objet,
            'statut' => $devis->statut,
            'date_devis' => $devis->date_devis?->format('Y-m-d') ?? '',
            'date_validite' => $devis->date_validite?->format('Y-m-d') ?? '',
            'montant_ht' => (float) $devis->montant_ht,
            'taux_tva' => (float) $devis->taux_tva,
            'montant_ttc' => (float) $devis->montant_ttc,
            'notes' => $devis->notes,
            'description' => $devis->description,
            'conditions' => $devis->conditions,
            'archive' => $devis->archive,
            'administrateur' => $devis->administrateur ? [
                'id' => $devis->administrateur->id,
                'name' => $devis->administrateur->name,
                'email' => $devis->administrateur->email,
            ] : null,
            'lignes' => $devis->lignes->map(function ($ligne) {
                return [
                    'id' => $ligne->id,
                    'service_id' => $ligne->service_id,
                    'quantite' => (float) $ligne->quantite,
                    'prix_unitaire_ht' => (float) $ligne->prix_unitaire_ht,
                    'taux_tva' => (float) $ligne->taux_tva,
                    'montant_ht' => (float) $ligne->montant_ht,
                    'montant_tva' => (float) $ligne->montant_tva,
                    'montant_ttc' => (float) $ligne->montant_ttc,
                    'ordre' => $ligne->ordre,
                    'description_personnalisee' => $ligne->description_personnalisee,
                    'service' => $ligne->service ? [
                        'id' => $ligne->service->id,
                        'nom' => $ligne->service->nom,
                        'code' => $ligne->service->code,
                        'description' => $ligne->service->description,
                        'prix_ht' => $ligne->service->prix_ht,
                        'qte_defaut' => $ligne->service->qte_defaut,
                        'unite' => $ligne->service->unite ? $ligne->service->unite->value : null,
                    ] : null
                ];
            }),
            'client' => $devis->client ? [
                'id' => $devis->client->id,
                'nom' => $devis->client->nom,
                'prenom' => $devis->client->prenom,
                'email' => $devis->client->email,
                'telephone' => $devis->client->telephone,
                'adresse' => $devis->client->adresse,
                'ville' => $devis->client->ville,
                'code_postal' => $devis->client->code_postal,
                'entreprise' => $devis->client->entreprise ? [
                    'id' => $devis->client->entreprise->id,
                    'nom' => $devis->client->entreprise->nom,
                    'nom_commercial' => $devis->client->entreprise->nom_commercial,
                    'adresse' => $devis->client->entreprise->adresse,
                    'ville' => $devis->client->entreprise->ville,
                    'code_postal' => $devis->client->entreprise->code_postal,
                ] : null
            ] : null
        ];

        return Inertia::render('devis/edit', [
            'devis' => $devisFormatted,
            'clients' => $clients,
            'services' => $services,
            'administrateurs' => $administrateurs,
            'madinia' => $madinia ? [
                'name' => $madinia->name,
                'telephone' => $madinia->telephone,
                'email' => $madinia->email,
                'adresse' => $madinia->adresse,
                'pays' => $madinia->pays,
                'siret' => $madinia->siret,
                'numero_nda' => $madinia->numero_nda,
                'nom_compte_bancaire' => $madinia->nom_compte_bancaire,
                'nom_banque' => $madinia->nom_banque,
                'numero_compte' => $madinia->numero_compte,
                'iban_bic_swift' => $madinia->iban_bic_swift,
            ] : null,
        ]);
    }

    /**
     * Met à jour un devis
     */
    public function update(Request $request, Devis $devis)
    {
        try {
            $validated = $request->validate([
                'numero_devis' => 'required|string|unique:devis,numero_devis,' . $devis->id,
                'administrateur_id' => 'required|exists:users,id',
                'client_id' => 'required|exists:clients,id',
                'date_devis' => 'required|date',
                'date_validite' => 'required|date|after:date_devis',
                'statut' => 'required|in:brouillon,en_attente,envoye,accepte,refuse,expire',
                'objet' => 'required|string|max:255',
                'description' => 'nullable|string',
                'conditions' => 'nullable|string',
                'notes' => 'nullable|string',
                'archive' => 'boolean',
                'lignes' => 'required|array|min:1',
                'lignes.*.id' => 'nullable|exists:lignes_devis,id',
                'lignes.*.service_id' => 'nullable|exists:services,id',
                'lignes.*.quantite' => 'required|numeric|min:0',
                'lignes.*.prix_unitaire_ht' => 'required|numeric|min:0',
                'lignes.*.taux_tva' => 'required|numeric|min:0|max:100',
                'lignes.*.description_personnalisee' => 'nullable|string',
                'lignes.*.ordre' => 'required|integer|min:1',
            ]);

            // Mettre à jour le devis
            $devis->fill($validated);
            $devis->save();

            // Gérer les lignes de devis
            $lignesExistantes = $devis->lignes->keyBy('id');
            $lignesTraitees = collect();

            foreach ($validated['lignes'] as $ligneData) {
                if (isset($ligneData['id']) && $lignesExistantes->has($ligneData['id'])) {
                    // Mettre à jour ligne existante
                    $ligne = $lignesExistantes->get($ligneData['id']);
                    $ligne->fill($ligneData);
                    $ligne->save();
                    $lignesTraitees->push($ligneData['id']);
                } else {
                    // Créer nouvelle ligne
                    $ligne = new \App\Models\LigneDevis();
                    $ligne->devis_id = $devis->id;
                    $ligne->fill($ligneData);
                    $ligne->save();
                }
            }

            // Supprimer les lignes qui ne sont plus présentes
            $lignesASupprimer = $lignesExistantes->keys()->diff($lignesTraitees);
            if ($lignesASupprimer->isNotEmpty()) {
                \App\Models\LigneDevis::whereIn('id', $lignesASupprimer)->delete();
            }

            // Recalculer les montants du devis
            $devis->calculerMontants();
            $devis->save();

            return redirect()->route('devis.index')
                ->with('success', '🎉 Devis ' . $devis->numero_devis . ' mis à jour avec succès !');
        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', '❌ Erreur de validation. Veuillez vérifier les informations saisies.');
        } catch (Exception $e) {
            return back()
                ->withInput()
                ->with('error', '❌ Une erreur est survenue lors de la mise à jour du devis.');
        }
    }

    /**
     * Supprime un devis
     */
    public function destroy(Devis $devis)
    {
        try {
            $numero_devis = $devis->numero_devis;

            // Supprimer le PDF avant de supprimer le devis
            try {
                $this->devisPdfService->supprimer($devis);
                Log::info('PDF supprimé lors de la suppression du devis', [
                    'devis_id' => $devis->id,
                    'numero_devis' => $numero_devis
                ]);
            } catch (Exception $e) {
                Log::error('Erreur suppression PDF lors suppression devis', [
                    'devis_id' => $devis->id,
                    'error' => $e->getMessage()
                ]);
            }

            $devis->delete();

            return redirect()->route('devis.index')
                ->with('warning', '⚠️ Devis ' . $numero_devis . ' supprimé avec succès.');
        } catch (Exception $e) {
            return back()
                ->with('error', '❌ Impossible de supprimer le devis. Il pourrait être lié à d\'autres données.');
        }
    }

    /**
     * Accepte un devis
     */
    public function accepter(Devis $devis)
    {
        try {
            Log::info('Début acceptation devis via interface', [
                'devis_id' => $devis->getKey(),
                'devis_numero' => $devis->numero_devis,
                'user_id' => \Illuminate\Support\Facades\Auth::id()
            ]);

            $result = $devis->accepter();

            if ($result) {
                Log::info('Devis accepté avec succès via interface', [
                    'devis_id' => $devis->getKey(),
                    'devis_numero' => $devis->numero_devis
                ]);

                return redirect()->back()
                    ->with('success', '✅ Devis ' . $devis->numero_devis . ' accepté avec succès !');
            } else {
                Log::error('Échec de l\'acceptation de devis via interface', [
                    'devis_id' => $devis->getKey(),
                    'devis_numero' => $devis->numero_devis
                ]);

                return back()
                    ->with('error', '❌ Échec de l\'acceptation du devis.');
            }

        } catch (Exception $e) {
            Log::error('Erreur lors de l\'acceptation de devis via interface', [
                'devis_id' => $devis->getKey(),
                'devis_numero' => $devis->numero_devis,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Si l'erreur est liée aux emails, proposer une solution alternative
            if (str_contains($e->getMessage(), 'timeout') || str_contains($e->getMessage(), 'Connection') || str_contains($e->getMessage(), 'SMTP')) {
                return back()
                    ->with('error', '❌ Problème de connexion email. Le devis peut être accepté manuellement via les commandes administrateur.');
            }

            return back()
                ->with('error', '❌ Une erreur est survenue lors de l\'acceptation du devis : ' . $e->getMessage());
        }
    }

    /**
     * Refuse un devis
     */
    public function refuser(Devis $devis)
    {
        try {
            $devis->refuser();

            return redirect()->back()
                ->with('success', '⛔ Devis ' . $devis->numero_devis . ' refusé.');
        } catch (Exception $e) {
            return back()
                ->with('error', '❌ Une erreur est survenue lors du refus du devis.');
        }
    }

    /**
     * Modifier le statut d'un devis
     */
    public function changerStatut(Request $request, Devis $devis)
    {
        $request->validate([
            'statut' => 'required|in:brouillon,en_attente,envoye,accepte,refuse,expire'
        ]);

        try {
            $ancienStatut = $devis->statut;
            $nouveauStatut = $request->statut;

            // Actions spécifiques selon le statut
            switch ($nouveauStatut) {
                case 'accepte':
                    $devis->accepter();
                    break;
                case 'refuse':
                    $devis->refuser();
                    break;
                default:
                    $devis->statut = $nouveauStatut;
                    $devis->save();
                    break;
            }

            $messages = [
                'brouillon' => '📝 Devis ' . $devis->numero_devis . ' remis en brouillon.',
                'en_attente' => '⏳ Devis ' . $devis->numero_devis . ' mis en attente.',
                'envoye' => '📧 Devis ' . $devis->numero_devis . ' marqué comme envoyé.',
                'accepte' => '✅ Devis ' . $devis->numero_devis . ' accepté avec succès !',
                'refuse' => '⛔ Devis ' . $devis->numero_devis . ' refusé.',
                'expire' => '⏰ Devis ' . $devis->numero_devis . ' marqué comme expiré.'
            ];

            return redirect()->back()
                ->with('success', $messages[$nouveauStatut] ?? 'Statut mis à jour.');
        } catch (Exception $e) {
            return back()
                ->with('error', '❌ Une erreur est survenue lors de la modification du statut.');
        }
    }

    /**
     * Afficher la page d'envoi d'email pour un devis
     */
    public function afficherEnvoiEmail(Devis $devis)
    {
        if (!$devis->peutEtreEnvoye()) {
            return redirect()->back()
                ->with('error', '❌ Ce devis ne peut pas être envoyé.');
        }

        $devis->load(['client.entreprise']);

        // Récupérer les informations Madinia pour les variables de contact
        $madinia = \App\Models\Madinia::getInstance();

        // Récupérer les modèles d'email pour les devis (toutes catégories)
        $modelesEmail = \App\Models\EmailTemplate::whereIn('category', ['envoi_initial', 'rappel', 'relance'])
            ->where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->map(function ($template) {
                return [
                    'id' => $template->id,
                    'name' => $template->name,
                    'subject' => $template->subject,
                    'body' => $template->body,
                    'category' => $template->category,
                    'sub_category' => $template->sub_category,
                ];
            });

        // Préparer les données pour la page d'envoi
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
            'montant_ht' => (float) $devis->montant_ht,
            'montant_ttc' => (float) $devis->montant_ttc,
            'taux_tva' => (float) $devis->taux_tva,
            'statut' => $devis->statut,
            'statut_envoi' => $devis->statut_envoi,
        ];

        return Inertia::render('devis/envoyer-email', [
            'devis' => $devisData,
            'modeles_email' => $modelesEmail,
            'madinia' => $madinia ? [
                'name' => $madinia->name,
                'telephone' => $madinia->telephone,
                'email' => $madinia->email,
            ] : null
        ]);
    }

    /**
     * Envoie un devis au client par email
     *
     * @param Request $request Les données de l'email
     * @param Devis $devis Le devis à envoyer
     * @return \Illuminate\Http\RedirectResponse
     *
     * Processus :
     * 1. Vérification que le devis peut être envoyé
     * 2. Validation des données
     * 3. Régénération du PDF pour s'assurer qu'il est à jour
     * 4. Envoi de l'email au client
     * 5. Envoi d'une copie à l'administrateur si demandé
     * 6. Mise à jour des dates d'envoi
     */
    public function envoyerEmail(Request $request, Devis $devis)
    {
        Log::info('=== DÉBUT ENVOI EMAIL DEVIS ===', [
            'devis_id' => $devis->id,
            'devis_numero' => $devis->numero_devis,
        ]);

        if (!$devis->peutEtreEnvoye()) {
            Log::warning('Devis ne peut pas être envoyé', [
                'devis_id' => $devis->id,
                'statut' => $devis->statut,
                'statut_envoi' => $devis->statut_envoi,
            ]);
            return redirect()->back()
                ->with('error', '❌ Ce devis ne peut pas être envoyé.');
        }

        $validated = $request->validate([
            'message_client' => 'nullable|string',
            'envoyer_copie_admin' => 'boolean',
            'template_id' => 'nullable|exists:email_templates,id',
        ]);

        Log::info('Données validées pour envoi email', [
            'devis_id' => $devis->getKey(),
            'message_client_length' => strlen($validated['message_client'] ?? ''),
            'envoyer_copie_admin' => $validated['envoyer_copie_admin'] ?? false,
            'template_id' => $validated['template_id'] ?? null,
        ]);

        try {
            $devis->load('client.entreprise');

            Log::info('Devis chargé avec relations', [
                'devis_id' => $devis->id,
                'client_email' => $devis->client->email,
                'client_nom' => $devis->client->nom,
                'client_prenom' => $devis->client->prenom,
            ]);

            // Envoyer email au client avec PDF en pièce jointe
            $this->envoyerEmailClientDevis($devis, $validated['message_client'] ?? null, $validated['template_id'] ?? null);

            // Mettre à jour le statut
            $devis->marquerEnvoye();
            Log::info('Statut devis mis à jour vers envoyé', [
                'devis_id' => $devis->id,
                'nouveau_statut_envoi' => $devis->statut_envoi,
            ]);

            // Envoyer copie à l'admin si demandé
            if ($validated['envoyer_copie_admin'] ?? false) {
                try {
                    Log::info('Tentative envoi copie admin', ['devis_id' => $devis->id]);
                    $this->envoyerEmailAdminDevis($devis);
                    $devis->date_envoi_admin = now();
                    $devis->save();
                    Log::info('Copie admin envoyée avec succès', ['devis_id' => $devis->id]);
                } catch (\Exception $e) {
                    Log::warning('Erreur lors de l\'envoi de la copie admin', [
                        'devis_numero' => $devis->numero_devis,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            }

            Log::info('Devis envoyé par email avec succès', [
                'devis_numero' => $devis->numero_devis,
                'client_email' => $devis->client->email
            ]);

            Log::info('=== FIN ENVOI EMAIL DEVIS (SUCCÈS) ===', [
                'devis_id' => $devis->id,
            ]);

            return redirect()->route('devis.index')
                ->with('success', '📧 Devis ' . $devis->numero_devis . ' envoyé avec succès au client !');
        } catch (\Exception $e) {
            $devis->marquerEchecEnvoi();

            Log::error('=== ERREUR ENVOI EMAIL DEVIS ===', [
                'devis_numero' => $devis->numero_devis,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return redirect()->back()
                ->with('error', '❌ Erreur lors de l\'envoi du devis : ' . $e->getMessage());
        }
    }

    /**
     * Transforme un devis en facture
     *
     * @param Devis $devis Le devis à transformer
     * @return \Inertia\Response
     *
     * Vérifie que le devis peut être transformé (statut accepté)
     * et affiche le formulaire de transformation avec :
     * - Les informations du devis
     * - Un numéro de facture généré automatiquement
     * - Les dates par défaut
     */
    public function transformerEnFacture(Devis $devis)
    {
        // Vérifier que le devis peut être transformé
        if (!$devis->peutEtreTransformeEnFacture()) {
            return redirect()->back()
                ->with('error', '❌ Ce devis ne peut pas être transformé en facture.');
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
            'montant_ht' => (float) $devis->montant_ht,
            'montant_ttc' => (float) $devis->montant_ttc,
            'taux_tva' => (float) $devis->taux_tva,
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
                ->with('error', '❌ Ce devis ne peut pas être transformé en facture.');
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

            $message = '🧾 Devis ' . $devis->numero_devis . ' transformé en facture avec succès ! Facture n°' . $facture->numero_facture . ' créée.';

            if (!empty($erreursMails)) {
                $message .= ' Cependant, des erreurs sont survenues lors de l\'envoi des emails : ' . implode(', ', $erreursMails);
                return redirect()->route('factures.show', $facture)
                    ->with('warning', $message);
            }

            return redirect()->route('factures.show', $facture)
                ->with('success', $message);
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', '❌ Erreur lors de la transformation : ' . $e->getMessage());
        }
    }

    /**
     * Envoie un email au client pour un devis
     *
     * @param array $donnees Les données nécessaires pour l'email
     * @return void
     *
     * Processus :
     * 1. Création de l'instance de mail
     * 2. Envoi de l'email
     * 3. Logging des informations
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
     * Envoie un email à l'administrateur pour un devis
     *
     * @param array $donnees Les données nécessaires pour l'email
     * @return void
     *
     * Processus :
     * 1. Création de l'instance de mail
     * 2. Envoi de l'email
     * 3. Logging des informations
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

    /**
     * Envoie un email au client pour un devis spécifique
     *
     * @param Devis $devis Le devis concerné
     * @param string|null $messagePersonnalise Message personnalisé optionnel
     * @param int|null $templateId ID du template d'email optionnel
     * @return void
     *
     * Processus :
     * 1. Vérification de la configuration mail
     * 2. Régénération du PDF
     * 3. Création et envoi de l'email
     * 4. Mise à jour des dates d'envoi
     */
    private function envoyerEmailClientDevis(Devis $devis, ?string $messagePersonnalise, ?int $templateId = null)
    {
        Log::info('=== DÉBUT ENVOI EMAIL CLIENT DEVIS ===', [
            'devis_id' => $devis->id,
            'devis_numero' => $devis->numero_devis,
            'client_email' => $devis->client->email,
            'message_personnalise_length' => strlen($messagePersonnalise ?? ''),
            'template_id' => $templateId,
        ]);

        // Vérifier la configuration mail
        Log::info('Configuration mail actuelle', [
            'mail_mailer' => config('mail.default'),
            'mail_host' => config('mail.mailers.smtp.host'),
            'mail_port' => config('mail.mailers.smtp.port'),
            'mail_from_address' => config('mail.from.address'),
            'mail_from_name' => config('mail.from.name'),
        ]);

        try {
            // PDF sera utilisé depuis la version React existante
            Log::info('Utilisation du PDF React existant pour l\'envoi email', [
                'devis_numero' => $devis->numero_devis,
                'fichier_pdf' => $devis->pdf_file,
            ]);

            // Créer l'instance de mail
            Log::info('Tentative de création de DevisClientMail', [
                'devis_numero' => $devis->numero_devis,
                'client_email' => $devis->client->email,
            ]);

            // Créer l'instance de mail
            $mailInstance = new \App\Mail\DevisClientMail(
                $devis,
                $devis->client,
                $messagePersonnalise,
                $templateId
            );

            // Préparer les destinataires
            $to = [$devis->client->email];
            $cc = ['d.brault@madin-ia.com'];

            // Envoyer l'email avec les destinataires appropriés
            Mail::to($to)
                ->cc($cc)
                ->send($mailInstance);

            Log::info('Email de devis envoyé au client', [
                'devis_numero' => $devis->numero_devis,
                'client_email' => $devis->client->email,
                'ceo_cc' => true
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur envoi email client devis', [
                'devis_numero' => $devis->numero_devis,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Envoie un email à l'administrateur pour un devis spécifique
     *
     * @param Devis $devis Le devis concerné
     * @return void
     *
     * Processus :
     * 1. Création de l'instance de mail
     * 2. Envoi de l'email
     * 3. Mise à jour des dates d'envoi
     */
    private function envoyerEmailAdminDevis(Devis $devis)
    {
        try {
            $adminEmail = config('mail.admin_email');
            $ceoEmail = 'd.brault@madin-ia.com';

            if (!$adminEmail) {
                Log::warning('Email admin non configuré, envoi ignoré');
                return;
            }

            // Créer l'instance de mail
            $mailInstance = new \App\Mail\DevisAdminMail(
                $devis,
                $devis->client
            );

            // Préparer les destinataires
            $to = [$adminEmail];
            $cc = [];

            // Ajouter le CEO en CC seulement si ce n'est pas l'admin
            if ($adminEmail !== $ceoEmail) {
                $cc[] = $ceoEmail;
            }

            // Envoyer l'email avec les destinataires appropriés
            Mail::to($to)
                ->when(!empty($cc), function ($message) use ($cc) {
                    return $message->cc($cc);
                })
                ->send($mailInstance);

            Log::info('Email de notification admin devis envoyé', [
                'devis_numero' => $devis->numero_devis,
                'admin_email' => $adminEmail,
                'ceo_cc' => !empty($cc)
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur envoi email admin devis', [
                'devis_numero' => $devis->numero_devis,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Affiche le PDF du devis dans le navigateur
     */
    public function voirPdf(Devis $devis)
    {
        try {
            $cheminPdf = $this->devisPdfService->getCheminPdf($devis);

            if (!$cheminPdf || !file_exists($cheminPdf)) {
                // PDF manquant - rediriger vers la page show pour utiliser React
                return redirect()->route('devis.show', $devis)
                    ->with('error', '❌ PDF non trouvé. Veuillez d\'abord générer le PDF via le bouton "Sauvegarder PDF".');
            }

            if ($cheminPdf && file_exists($cheminPdf)) {
                return response()->file($cheminPdf, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="Devis_' . $devis->numero_devis . '.pdf"'
                ]);
            }

            return redirect()->back()
                ->with('error', '❌ PDF non trouvé pour ce devis.');
        } catch (Exception $e) {
            Log::error('Erreur affichage PDF devis', [
                'devis_numero' => $devis->numero_devis,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()
                ->with('error', '❌ Erreur lors de l\'affichage du PDF.');
        }
    }

    /**
     * Télécharge le PDF du devis
     */
    public function telechargerPdf(Devis $devis)
    {
        try {
            $cheminPdf = $this->devisPdfService->getCheminPdf($devis);

            if (!$cheminPdf || !file_exists($cheminPdf)) {
                // PDF manquant - rediriger vers la page show pour utiliser React
                return redirect()->route('devis.show', $devis)
                    ->with('error', '❌ PDF non trouvé. Veuillez d\'abord générer le PDF via le bouton "Sauvegarder PDF".');
            }

            if ($cheminPdf && file_exists($cheminPdf)) {
                return response()->download($cheminPdf, "Devis_{$devis->numero_devis}.pdf");
            }

            return redirect()->back()
                ->with('error', '❌ PDF non trouvé pour ce devis.');
        } catch (Exception $e) {
            Log::error('Erreur téléchargement PDF devis', [
                'devis_numero' => $devis->numero_devis,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()
                ->with('error', '❌ Erreur lors du téléchargement du PDF.');
        }
    }

    /**
     * Génère et sauvegarde le PDF d'un devis
     *
     * @param Devis $devis Le devis concerné
     * @return \Illuminate\Http\RedirectResponse
     *
     * Processus :
     * 1. Génération du PDF via le service dédié
     * 2. Sauvegarde locale et/ou sur Supabase
     * 3. Mise à jour des informations du devis
     */
    public function generateReactPdf(Devis $devis)
    {
        try {
            // Redirection vers une page React pour générer le PDF
            return redirect()->route('devis.show', $devis->id)
                ->with('generate_pdf', true)
                ->with('info', '💡 Utilisez le bouton "Sauvegarder PDF" pour générer le PDF avec react-pdf/renderer');
        } catch (Exception $e) {
            Log::error('Erreur régénération PDF devis', [
                'devis_numero' => $devis->numero_devis,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()
                ->with('error', '❌ Erreur lors de la régénération du PDF.');
        }
    }

    /**
     * Sauvegarde un PDF généré par React
     *
     * @param Request $request Les données du PDF
     * @param Devis $devis Le devis concerné
     * @return \Illuminate\Http\JsonResponse
     *
     * Processus :
     * 1. Validation des données
     * 2. Sauvegarde locale du PDF
     * 3. Upload sur Supabase si configuré
     * 4. Mise à jour des informations du devis
     */
    public function saveReactPdf(Request $request, Devis $devis)
    {
        try {
            $request->validate([
                'pdf_blob' => 'required|string', // Base64 du PDF
                'filename' => 'required|string',
            ]);

            Log::info('Début sauvegarde PDF React', [
                'devis_id' => $devis->id,
                'numero_devis' => $devis->numero_devis,
                'filename' => $request->filename,
            ]);

            // Décoder le blob PDF
            $pdfContent = base64_decode($request->pdf_blob);

            if ($pdfContent === false) {
                throw new \Exception('Impossible de décoder le contenu PDF');
            }

            // Générer le nom de fichier
            $nomFichier = "devis_{$devis->numero_devis}_{$devis->id}.pdf";

            // 1. Sauvegarder localement
            $this->sauvegarderPdfLocal($pdfContent, $nomFichier, 'devis');

            // 2. Sauvegarder sur Supabase
            $urlSupabase = $this->sauvegarderPdfSupabase($pdfContent, $nomFichier, 'devis');

            // 3. Mettre à jour la base de données
            $devis->update([
                'pdf_file' => $nomFichier,
                'pdf_url' => $urlSupabase,
            ]);

            Log::info('PDF React sauvegardé avec succès', [
                'devis_id' => $devis->id,
                'nom_fichier' => $nomFichier,
                'url_supabase' => $urlSupabase,
                'taille' => strlen($pdfContent) . ' bytes',
            ]);

            return redirect()->back()->with('success', '✅ PDF généré et sauvegardé avec succès !');

        } catch (\Exception $e) {
            Log::error('Erreur sauvegarde PDF React', [
                'devis_id' => $devis->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->with('error', '❌ Erreur lors de la sauvegarde du PDF: ' . $e->getMessage());
        }
    }

    /**
     * Sauvegarde un PDF localement
     *
     * @param string $pdfContent Contenu du PDF
     * @param string $nomFichier Nom du fichier
     * @param string $type Type de document (devis/facture)
     * @return void
     */
    private function sauvegarderPdfLocal(string $pdfContent, string $nomFichier, string $type): void
    {
        // Créer le dossier s'il n'existe pas
        $dossier = "pdfs/{$type}";
        if (!Storage::disk('public')->exists($dossier)) {
            Storage::disk('public')->makeDirectory($dossier);
        }

        // Sauvegarder le PDF
        Storage::disk('public')->put("{$dossier}/{$nomFichier}", $pdfContent);

        Log::info('PDF sauvegardé localement', [
            'fichier' => $nomFichier,
            'chemin' => $dossier,
            'taille' => strlen($pdfContent) . ' bytes'
        ]);
    }

    /**
     * Sauvegarde un PDF sur Supabase
     *
     * @param string $pdfContent Contenu du PDF
     * @param string $nomFichier Nom du fichier
     * @param string $type Type de document (devis/facture)
     * @return string|null URL du PDF sur Supabase ou null en cas d'erreur
     */
    private function sauvegarderPdfSupabase(string $pdfContent, string $nomFichier, string $type): ?string
    {
        try {
            $supabaseUrl = config('supabase.url');
            $serviceKey = config('supabase.service_role_key');
            $bucketName = config('supabase.storage_bucket', 'pdfs');

            if (!$supabaseUrl || !$serviceKey) {
                Log::warning('Configuration Supabase manquante pour upload PDF');
                return null;
            }

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$serviceKey}",
                'Content-Type' => 'application/pdf',
            ])->withBody($pdfContent, 'application/pdf')
            ->put("{$supabaseUrl}/storage/v1/object/{$bucketName}/{$type}/{$nomFichier}");

            if ($response->successful()) {
                $urlPublique = "{$supabaseUrl}/storage/v1/object/public/{$bucketName}/{$type}/{$nomFichier}";

                Log::info('PDF sauvegardé sur Supabase', [
                    'fichier' => $nomFichier,
                    'bucket' => $bucketName,
                    'taille' => strlen($pdfContent) . ' bytes',
                    'url' => $urlPublique
                ]);

                return $urlPublique;
            } else {
                Log::error('Erreur sauvegarde PDF Supabase', [
                    'fichier' => $nomFichier,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return null;
            }
        } catch (\Exception $e) {
            Log::error('Exception sauvegarde PDF Supabase', [
                'fichier' => $nomFichier,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Récupère les informations de statut du PDF
     *
     * @param Devis $devis Le devis concerné
     * @return array Informations sur le statut du PDF
     */
    private function getPdfStatusData(Devis $devis): array
    {
        try {
            $status = [
                'exists' => false,
                'up_to_date' => false,
                'local_size' => 0,
                'supabase_url' => null,
                'last_modified' => null,
            ];

            // Vérifier existence locale
            $cheminPdf = $this->devisPdfService->getCheminPdf($devis);
            if ($cheminPdf && file_exists($cheminPdf)) {
                $status['exists'] = true;
                $status['local_size'] = filesize($cheminPdf);
                $status['last_modified'] = date('Y-m-d H:i:s', filemtime($cheminPdf));

                // Vérifier si à jour
                $dateModifPdf = filemtime($cheminPdf);
                $dateModifDevis = $devis->updated_at->timestamp;
                $status['up_to_date'] = $dateModifDevis <= $dateModifPdf;
            }

            // URL Supabase
            $status['supabase_url'] = $this->devisPdfService->getUrlSupabasePdf($devis);

            return $status;

        } catch (Exception $e) {
            Log::error('Erreur lors de la récupération du statut PDF pour show', [
                'devis_id' => $devis->id,
                'error' => $e->getMessage()
            ]);

            return [
                'exists' => false,
                'up_to_date' => false,
                'local_size' => 0,
                'last_modified' => null,
            ];
        }
    }
}
