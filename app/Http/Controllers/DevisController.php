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
        try {
            $validated = $request->validate([
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

            // Générer automatiquement le numéro de devis
            $validated['numero_devis'] = Devis::genererNumeroDevis();

            $devis = new Devis($validated);
            $devis->statut_envoi = 'non_envoye'; // Statut par défaut
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
        $devis->load(['client.entreprise', 'facture']);

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
        try {
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
     * Afficher la page d'envoi d'email pour un devis
     */
    public function afficherEnvoiEmail(Devis $devis)
    {
        if (!$devis->peutEtreEnvoye()) {
            return redirect()->back()
                ->with('error', '❌ Ce devis ne peut pas être envoyé.');
        }

        $devis->load(['client.entreprise']);

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
            'devis' => $devisData
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
        ]);

        Log::info('Données validées pour envoi email', [
            'devis_id' => $devis->id,
            'message_client_length' => strlen($validated['message_client'] ?? ''),
            'envoyer_copie_admin' => $validated['envoyer_copie_admin'] ?? false,
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
            $this->envoyerEmailClientDevis($devis, $validated['message_client'] ?? null);

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
    private function envoyerEmailClientDevis(Devis $devis, ?string $messagePersonnalise)
    {
        Log::info('=== DÉBUT ENVOI EMAIL CLIENT DEVIS ===', [
            'devis_id' => $devis->id,
            'devis_numero' => $devis->numero_devis,
            'client_email' => $devis->client->email,
            'message_personnalise_length' => strlen($messagePersonnalise ?? ''),
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
                $messagePersonnalise
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
