<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Devis;
use App\Models\Facture;
use App\Services\DevisPdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Exception;

class DevisController extends Controller
{
    protected $devisPdfService;

    public function __construct(DevisPdfService $devisPdfService)
    {
        $this->devisPdfService = $devisPdfService;
    }
    /**
     * Affiche la liste des devis
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
                    'montant_ttc' => $devis->montant_ttc,
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
     * Affiche le formulaire de création d'un devis
     */
    public function create()
    {
        $clients = Client::with('entreprise')->actifs()->orderBy('nom')->get();
        $services = \App\Models\Service::actif()->orderBy('nom')->get();
        $madinia = \App\Models\Madinia::getInstance();

        return Inertia::render('devis/create', [
            'clients' => $clients,
            'services' => $services,
            'numero_devis' => Devis::genererNumeroDevis(),
            'madinia' => $madinia ? [
                'name' => $madinia->name,
                'telephone' => $madinia->telephone,
                'email' => $madinia->email,
                'adresse' => $madinia->adresse,
                'pays' => $madinia->pays,
                'siret' => $madinia->siret,
            ] : null,
        ]);
    }

    /**
     * Enregistre un nouveau devis
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'client_id' => 'required|exists:clients,id',
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

            // Créer le devis
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

            // Générer et sauvegarder le PDF
            try {
                $nomFichierPdf = $this->devisPdfService->genererEtSauvegarder($devis);
                $devis->pdf_file = $nomFichierPdf;
                // L'URL Supabase est déjà mise à jour dans le service
                $devis->save();

                Log::info('PDF généré lors de la création du devis', [
                    'devis_id' => $devis->id,
                    'fichier_pdf' => $nomFichierPdf,
                    'url_supabase' => $devis->pdf_url
                ]);
            } catch (Exception $e) {
                Log::error('Erreur génération PDF lors création devis', [
                    'devis_id' => $devis->id,
                    'error' => $e->getMessage()
                ]);
            }

            return redirect()->route('devis.show', $devis)
                ->with('success', '✅ Devis ' . $devis->numero_devis . ' créé avec succès !');

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
     */
    public function show(Devis $devis)
    {
        $devis->load(['client.entreprise', 'facture', 'lignes.service']);

        // Récupérer les informations Madinia
        $madinia = \App\Models\Madinia::getInstance();

        // Construire manuellement les données pour éviter les problèmes de sérialisation
        $devisFormatted = [
            'id' => $devis->id,
            'numero_devis' => $devis->numero_devis,
            'client_id' => $devis->client_id,
            'objet' => $devis->objet,
            'statut' => $devis->statut,
            'statut_envoi' => $devis->statut_envoi,
            'date_devis' => $devis->date_devis?->format('Y-m-d') ?? '',
            'date_validite' => $devis->date_validite?->format('Y-m-d') ?? '',
            'date_envoi_client' => $devis->date_envoi_client?->toISOString(),
            'date_envoi_admin' => $devis->date_envoi_admin?->toISOString(),
            'montant_ht' => $devis->montant_ht,
            'taux_tva' => $devis->taux_tva,
            'montant_ttc' => $devis->montant_ttc,
            'notes' => $devis->notes,
            'description' => $devis->description,
            'conditions' => $devis->conditions,
            'created_at' => $devis->created_at->toISOString(),
            'updated_at' => $devis->updated_at->toISOString(),
            'peut_etre_transforme_en_facture' => $devis->peutEtreTransformeEnFacture(),
            'peut_etre_envoye' => $devis->peutEtreEnvoye(),
            'lignes' => $devis->lignes->map(function ($ligne) {
                return [
                    'id' => $ligne->id,
                    'service_id' => $ligne->service_id,
                    'quantite' => $ligne->quantite,
                    'prix_unitaire_ht' => $ligne->prix_unitaire_ht,
                    'taux_tva' => $ligne->taux_tva,
                    'montant_ht' => $ligne->montant_ht,
                    'montant_tva' => $ligne->montant_tva,
                    'montant_ttc' => $ligne->montant_ttc,
                    'ordre' => $ligne->ordre,
                    'description_personnalisee' => $ligne->description_personnalisee,
                    'service' => $ligne->service ? [
                        'id' => $ligne->service->id,
                        'nom' => $ligne->service->nom,
                        'description' => $ligne->service->description,
                        'code' => $ligne->service->code,
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

        return Inertia::render('devis/show', [
            'devis' => $devisFormatted,
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
            ]
        ]);
    }

    /**
     * Affiche le formulaire d'édition d'un devis
     */
    public function edit(Devis $devis)
    {
        $devis->load(['client.entreprise', 'lignes.service']);
        $clients = Client::with('entreprise')->actifs()->orderBy('nom')->get();
        $services = \App\Models\Service::actif()->orderBy('nom')->get();
        $madinia = \App\Models\Madinia::getInstance();

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
            'lignes' => $devis->lignes->map(function ($ligne) {
                return [
                    'id' => $ligne->id,
                    'service_id' => $ligne->service_id,
                    'quantite' => $ligne->quantite,
                    'prix_unitaire_ht' => $ligne->prix_unitaire_ht,
                    'taux_tva' => $ligne->taux_tva,
                    'montant_ht' => $ligne->montant_ht,
                    'montant_tva' => $ligne->montant_tva,
                    'montant_ttc' => $ligne->montant_ttc,
                    'ordre' => $ligne->ordre,
                    'description_personnalisee' => $ligne->description_personnalisee,
                    'service' => $ligne->service ? [
                        'id' => $ligne->service->id,
                        'nom' => $ligne->service->nom,
                        'code' => $ligne->service->code,
                        'description' => $ligne->service->description,
                        'prix_ht' => $ligne->service->prix_ht,
                        'qte_defaut' => $ligne->service->qte_defaut,
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
            'madinia' => $madinia ? [
                'name' => $madinia->name,
                'telephone' => $madinia->telephone,
                'email' => $madinia->email,
                'adresse' => $madinia->adresse,
                'pays' => $madinia->pays,
                'siret' => $madinia->siret,
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
                'client_id' => 'required|exists:clients,id',
                'date_devis' => 'required|date',
                'date_validite' => 'required|date|after:date_devis',
                'statut' => 'required|in:brouillon,envoye,accepte,refuse,expire',
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

            // Mettre à jour le PDF après modification
            try {
                $nomFichierPdf = $this->devisPdfService->mettreAJour($devis);
                $devis->pdf_file = $nomFichierPdf;
                // L'URL Supabase est déjà mise à jour dans le service
                $devis->save();

                Log::info('PDF mis à jour lors de la modification du devis', [
                    'devis_id' => $devis->id,
                    'fichier_pdf' => $nomFichierPdf,
                    'url_supabase' => $devis->pdf_url
                ]);
            } catch (Exception $e) {
                Log::error('Erreur mise à jour PDF lors modification devis', [
                    'devis_id' => $devis->id,
                    'error' => $e->getMessage()
                ]);
            }

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
            $devis->accepter();

            return redirect()->back()
                ->with('success', '✅ Devis ' . $devis->numero_devis . ' accepté avec succès !');

        } catch (Exception $e) {
            return back()
                ->with('error', '❌ Une erreur est survenue lors de l\'acceptation du devis.');
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
            'statut' => 'required|in:brouillon,envoye,accepte,refuse,expire'
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
            'montant_ht' => $devis->montant_ht,
            'montant_ttc' => $devis->montant_ttc,
            'taux_tva' => $devis->taux_tva,
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
     * Envoyer un devis au client par email
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
            'devis_id' => $devis->id,
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
     * Transformer un devis en facture - Afficher le modal de validation
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

    /**
     * Envoyer un email de notification au client lors de la création d'un devis
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
            // S'assurer que le PDF existe avant l'envoi de l'email
            $cheminPdf = $this->devisPdfService->getCheminPdf($devis);

            if (!$cheminPdf || !file_exists($cheminPdf)) {
                Log::info('PDF non trouvé, génération en cours...', [
                    'devis_numero' => $devis->numero_devis,
                    'chemin_attendu' => $cheminPdf,
                ]);

                $nomFichierPdf = $this->devisPdfService->genererEtSauvegarder($devis);
                $devis->pdf_file = $nomFichierPdf;
                $devis->save();

                Log::info('PDF généré pour l\'envoi email', [
                    'devis_numero' => $devis->numero_devis,
                    'fichier_pdf' => $nomFichierPdf,
                ]);
            } else {
                Log::info('PDF existant trouvé', [
                    'devis_numero' => $devis->numero_devis,
                    'chemin_pdf' => $cheminPdf,
                    'taille_fichier' => filesize($cheminPdf) . ' bytes',
                ]);
            }

            Log::info('Tentative de création de DevisClientMail', [
                'devis_numero' => $devis->numero_devis,
                'client_email' => $devis->client->email,
            ]);

            $mailInstance = new \App\Mail\DevisClientMail(
                $devis,
                $devis->client,
                $messagePersonnalise,
                $templateId
            );

            Log::info('DevisClientMail créé avec succès', [
                'mail_class' => get_class($mailInstance),
                'implements_should_queue' => $mailInstance instanceof \Illuminate\Contracts\Queue\ShouldQueue,
            ]);

            Log::info('Tentative d\'envoi via Mail::to()', [
                'destination_email' => $devis->client->email,
            ]);

            Mail::to($devis->client->email)->send($mailInstance);

            Log::info('Mail::send() exécuté sans exception', [
                'devis_numero' => $devis->numero_devis,
                'client_email' => $devis->client->email,
            ]);

            // Vérifier l'état des queues si on utilise les queues
            if ($mailInstance instanceof \Illuminate\Contracts\Queue\ShouldQueue) {
                Log::info('Email mis en queue (ShouldQueue)', [
                    'queue_connection' => config('queue.default'),
                    'devis_numero' => $devis->numero_devis,
                ]);
            } else {
                Log::info('Email envoyé directement (pas de queue)', [
                    'devis_numero' => $devis->numero_devis,
                ]);
            }

            Log::info('=== EMAIL CLIENT DEVIS ENVOYÉ AVEC SUCCÈS ===', [
                'devis_numero' => $devis->numero_devis,
                'client_email' => $devis->client->email
            ]);

        } catch (\Exception $e) {
            Log::error('=== ERREUR ENVOI EMAIL CLIENT DEVIS ===', [
                'devis_numero' => $devis->numero_devis,
                'client_email' => $devis->client->email,
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'error_trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Envoyer un email de notification à l'admin lors de la création d'un devis
     */
    private function envoyerEmailAdminDevis(Devis $devis)
    {
        try {
            $adminEmail = config('mail.admin_email');

            if (!$adminEmail) {
                Log::warning('Email admin non configuré, envoi ignoré');
                return;
            }

            Mail::to($adminEmail)->send(
                new \App\Mail\DevisAdminMail(
                    $devis,
                    $devis->client
                )
            );

            Log::info('Email de notification admin devis envoyé', [
                'devis_numero' => $devis->numero_devis
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
                // Générer le PDF s'il n'existe pas
                $nomFichier = $this->devisPdfService->genererEtSauvegarder($devis);
                $devis->pdf_file = $nomFichier;
                $devis->save();

                $cheminPdf = $this->devisPdfService->getCheminPdf($devis);
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
                // Générer le PDF s'il n'existe pas
                $nomFichier = $this->devisPdfService->genererEtSauvegarder($devis);
                $devis->pdf_file = $nomFichier;
                $devis->save();

                $cheminPdf = $this->devisPdfService->getCheminPdf($devis);
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
     * Régénère le PDF du devis
     */
    public function regenererPdf(Devis $devis)
    {
        try {
            $nomFichier = $this->devisPdfService->mettreAJour($devis);
            $devis->pdf_file = $nomFichier;
            $devis->save();

            Log::info('PDF régénéré manuellement', [
                'devis_numero' => $devis->numero_devis,
                'fichier' => $nomFichier
            ]);

            return redirect()->back()
                ->with('success', '✅ PDF du devis ' . $devis->numero_devis . ' régénéré avec succès !');

        } catch (Exception $e) {
            Log::error('Erreur régénération PDF devis', [
                'devis_numero' => $devis->numero_devis,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()
                ->with('error', '❌ Erreur lors de la régénération du PDF.');
        }
    }
}
