<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Facture;
use App\Services\FacturePdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Exception;

class FactureController extends Controller
{
    protected $facturePdfService;

    public function __construct(FacturePdfService $facturePdfService)
    {
        $this->facturePdfService = $facturePdfService;
    }
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

            // Générer et sauvegarder le PDF
            try {
                $nomFichierPdf = $this->facturePdfService->genererEtSauvegarder($facture);
                $facture->pdf_file = $nomFichierPdf;
                $facture->save();

                Log::info('PDF généré lors de la création de la facture', [
                    'facture_id' => $facture->id,
                    'fichier_pdf' => $nomFichierPdf
                ]);
            } catch (Exception $e) {
                Log::error('Erreur génération PDF lors création facture', [
                    'facture_id' => $facture->id,
                    'error' => $e->getMessage()
                ]);
            }

            return redirect()->route('factures.index')
                ->with('success', '✅ Facture ' . $facture->numero_facture . ' créée avec succès !');

        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', '❌ Erreur de validation. Veuillez vérifier les informations saisies.');
        } catch (Exception $e) {
            return back()
                ->withInput()
                ->with('error', '❌ Une erreur est survenue lors de la création de la facture.');
        }
    }

    /**
     * Affiche les détails d'une facture
     */
    public function show(Facture $facture)
    {
        $facture->load(['client.entreprise', 'devis', 'administrateur']);

        // Récupérer les informations de Madinia
        $madinia = \App\Models\Madinia::getInstance();

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
            ] : null,
            'administrateur' => $facture->administrateur ? [
                'id' => $facture->administrateur->id,
                'name' => $facture->administrateur->name,
                'email' => $facture->administrateur->email,
            ] : null
        ];

        // Vérifier le statut du PDF
        $pdfStatus = $this->getPdfStatusData($facture);

        return Inertia::render('factures/show', [
            'facture' => $factureFormatted,
            'madinia' => $madinia,
            'pdfStatus' => $pdfStatus
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

            // Mettre à jour le PDF après modification
            try {
                $nomFichierPdf = $this->facturePdfService->mettreAJour($facture);
                $facture->pdf_file = $nomFichierPdf;
                $facture->save();

                Log::info('PDF mis à jour lors de la modification de la facture', [
                    'facture_id' => $facture->id,
                    'fichier_pdf' => $nomFichierPdf
                ]);
            } catch (Exception $e) {
                Log::error('Erreur mise à jour PDF lors modification facture', [
                    'facture_id' => $facture->id,
                    'error' => $e->getMessage()
                ]);
            }

            return redirect()->route('factures.index')
                ->with('success', '🎉 Facture ' . $facture->numero_facture . ' mise à jour avec succès !');

        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', '❌ Erreur de validation. Veuillez vérifier les informations saisies.');
        } catch (Exception $e) {
            return back()
                ->withInput()
                ->with('error', '❌ Une erreur est survenue lors de la mise à jour de la facture.');
        }
    }

    /**
     * Supprime une facture
     */
    public function destroy(Facture $facture)
    {
        try {
            $numero_facture = $facture->numero_facture;

            // Supprimer le PDF avant de supprimer la facture
            try {
                $this->facturePdfService->supprimer($facture);
                Log::info('PDF supprimé lors de la suppression de la facture', [
                    'facture_id' => $facture->id,
                    'numero_facture' => $numero_facture
                ]);
            } catch (Exception $e) {
                Log::error('Erreur suppression PDF lors suppression facture', [
                    'facture_id' => $facture->id,
                    'error' => $e->getMessage()
                ]);
            }

            $facture->delete();

            return redirect()->route('factures.index')
                ->with('warning', '⚠️ Facture ' . $numero_facture . ' supprimée avec succès.');

        } catch (Exception $e) {
            return back()
                ->with('error', '❌ Impossible de supprimer la facture. Elle pourrait être liée à d\'autres données.');
        }
    }

    /**
     * Changer le statut d'une facture
     */
    public function changerStatut(Request $request, Facture $facture)
    {
        try {
            $validated = $request->validate([
                'statut' => 'required|in:brouillon,envoyee,payee,en_retard,annulee',
            ]);

            $ancienStatut = $facture->statut;
            $nouveauStatut = $validated['statut'];

            // Vérifications spéciales selon le statut
            if ($nouveauStatut === 'payee' && !in_array($ancienStatut, ['envoyee', 'en_retard'])) {
                return redirect()->back()
                    ->with('error', '❌ Une facture ne peut être marquée comme payée que si elle est envoyée ou en retard.');
            }

            $facture->statut = $nouveauStatut;

            // Actions spéciales selon le nouveau statut
            if ($nouveauStatut === 'payee' && $ancienStatut !== 'payee') {
                $facture->date_paiement = now();
            } elseif ($nouveauStatut !== 'payee') {
                $facture->date_paiement = null;
            }

            $facture->save();

            return redirect()->back()
                ->with('success', '✅ Statut de la facture ' . $facture->numero_facture . ' modifié avec succès !');

        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->errors())
                ->with('error', '❌ Erreur de validation. Veuillez vérifier le statut sélectionné.');
        } catch (Exception $e) {
            return redirect()->back()
                ->with('error', '❌ Une erreur est survenue lors du changement de statut.');
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
                ->with('success', '💰 Facture ' . $facture->numero_facture . ' marquée comme payée !');

        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->with('error', '❌ Erreur de validation. Veuillez vérifier les informations saisies.');
        } catch (Exception $e) {
            return back()
                ->with('error', '❌ Une erreur est survenue lors de la mise à jour du statut de paiement.');
        }
    }

    /**
     * Afficher le formulaire d'envoi d'email
     */
    public function envoyerEmailForm(Facture $facture)
    {
        $facture->load('client.entreprise');

        return inertia('factures/envoyer-email', [
            'facture' => $facture,
        ]);
    }

    /**
     * Envoyer une facture au client par email
     */
    public function envoyerEmail(Request $request, Facture $facture)
    {
        if (!$facture->peutEtreEnvoyee()) {
            return redirect()->back()
                ->with('error', '❌ Cette facture ne peut pas être envoyée.');
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
                ->with('success', '📧 Facture ' . $facture->numero_facture . ' envoyée avec succès au client !');

        } catch (\Exception $e) {
            $facture->marquerEchecEnvoi();

            Log::error('Erreur lors de l\'envoi de la facture', [
                'facture_numero' => $facture->numero_facture,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()
                ->with('error', '❌ Erreur lors de l\'envoi de la facture : ' . $e->getMessage());
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
            // Charger les relations nécessaires
            $facture->load('client.entreprise', 'devis', 'administrateur');

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
            // Charger les relations nécessaires
            $facture->load('client.entreprise', 'devis', 'administrateur');

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

    /**
     * Affiche le PDF de la facture dans le navigateur
     */
    public function voirPdf(Facture $facture)
    {
        try {
            $cheminPdf = $this->facturePdfService->getCheminPdf($facture);

            if (!$cheminPdf || !file_exists($cheminPdf)) {
                // Générer le PDF s'il n'existe pas
                $nomFichier = $this->facturePdfService->genererEtSauvegarder($facture);
                $facture->pdf_file = $nomFichier;
                $facture->save();

                $cheminPdf = $this->facturePdfService->getCheminPdf($facture);
            }

            if ($cheminPdf && file_exists($cheminPdf)) {
                return response()->file($cheminPdf, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="Facture_' . $facture->numero_facture . '.pdf"'
                ]);
            }

            return redirect()->back()
                ->with('error', '❌ PDF non trouvé pour cette facture.');

        } catch (Exception $e) {
            Log::error('Erreur affichage PDF facture', [
                'facture_numero' => $facture->numero_facture,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()
                ->with('error', '❌ Erreur lors de l\'affichage du PDF.');
        }
    }

    /**
     * Télécharge le PDF de la facture
     */
    public function telechargerPdf(Facture $facture)
    {
        try {
            $cheminPdf = $this->facturePdfService->getCheminPdf($facture);

            if (!$cheminPdf || !file_exists($cheminPdf)) {
                // Générer le PDF s'il n'existe pas
                $nomFichier = $this->facturePdfService->genererEtSauvegarder($facture);
                $facture->pdf_file = $nomFichier;
                $facture->save();

                $cheminPdf = $this->facturePdfService->getCheminPdf($facture);
            }

            if ($cheminPdf && file_exists($cheminPdf)) {
                return response()->download($cheminPdf, "Facture_{$facture->numero_facture}.pdf");
            }

            return redirect()->back()
                ->with('error', '❌ PDF non trouvé pour cette facture.');

        } catch (Exception $e) {
            Log::error('Erreur téléchargement PDF facture', [
                'facture_numero' => $facture->numero_facture,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()
                ->with('error', '❌ Erreur lors du téléchargement du PDF.');
        }
    }

    /**
     * Régénère le PDF de la facture
     */
    public function regenererPdf(Facture $facture)
    {
        try {
            $nomFichier = $this->facturePdfService->mettreAJour($facture);
            $facture->pdf_file = $nomFichier;
            $facture->save();

            Log::info('PDF régénéré manuellement', [
                'facture_numero' => $facture->numero_facture,
                'fichier' => $nomFichier
            ]);

            return redirect()->back()
                ->with('success', '✅ PDF de la facture ' . $facture->numero_facture . ' régénéré avec succès !');

        } catch (Exception $e) {
            Log::error('Erreur régénération PDF facture', [
                'facture_numero' => $facture->numero_facture,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()
                ->with('error', '❌ Erreur lors de la régénération du PDF.');
        }
    }

    /**
     * S'assure que le PDF existe et est à jour
     */
    public function ensurePdf(Facture $facture)
    {
        try {
            $needsRegeneration = false;
            $message = '';

            // Vérifier si le PDF existe
            if (!$this->facturePdfService->pdfExiste($facture)) {
                $needsRegeneration = true;
                $message = 'PDF manquant';
            } else {
                // Vérifier si le PDF est à jour
                $cheminPdf = $this->facturePdfService->getCheminPdf($facture);
                if ($cheminPdf && file_exists($cheminPdf)) {
                    $dateModifPdf = filemtime($cheminPdf);
                    $dateModifFacture = $facture->updated_at->timestamp;

                    if ($dateModifFacture > $dateModifPdf) {
                        $needsRegeneration = true;
                        $message = 'PDF obsolète';
                    }
                }
            }

            // Générer si nécessaire
            if ($needsRegeneration) {
                $nomFichier = $this->facturePdfService->genererEtSauvegarder($facture);
                $facture->pdf_file = $nomFichier;
                $facture->save();

                Log::info('PDF généré automatiquement pour aperçu', [
                    'facture_id' => $facture->id,
                    'raison' => $message,
                    'fichier' => $nomFichier
                ]);
            }

            return response()->json([
                'status' => 'ready',
                'regenerated' => $needsRegeneration,
                'message' => $needsRegeneration ? "PDF mis à jour ($message)" : 'PDF à jour'
            ]);

        } catch (Exception $e) {
            Log::error('Erreur lors de la vérification/génération PDF pour aperçu', [
                'facture_id' => $facture->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la vérification du PDF'
            ], 500);
        }
    }

    /**
     * Retourne le statut du PDF (existe, à jour, taille, etc.)
     */
    public function getPdfStatus(Facture $facture)
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
            $cheminPdf = $this->facturePdfService->getCheminPdf($facture);
            if ($cheminPdf && file_exists($cheminPdf)) {
                $status['exists'] = true;
                $status['local_size'] = filesize($cheminPdf);
                $status['last_modified'] = date('Y-m-d H:i:s', filemtime($cheminPdf));

                // Vérifier si à jour
                $dateModifPdf = filemtime($cheminPdf);
                $dateModifFacture = $facture->updated_at->timestamp;
                $status['up_to_date'] = $dateModifFacture <= $dateModifPdf;
            }

            // URL Supabase
            $status['supabase_url'] = $this->facturePdfService->getUrlSupabasePdf($facture);

            return response()->json($status);

        } catch (Exception $e) {
            Log::error('Erreur lors de la récupération du statut PDF', [
                'facture_id' => $facture->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Erreur lors de la récupération du statut'
            ], 500);
        }
    }

    /**
     * Récupère les données de statut PDF pour les pages show
     */
    private function getPdfStatusData(Facture $facture): array
    {
        try {
            $status = [
                'exists' => false,
                'up_to_date' => false,
                'local_size' => 0,
                'last_modified' => null,
            ];

            // Vérifier existence locale
            $cheminPdf = $this->facturePdfService->getCheminPdf($facture);
            if ($cheminPdf && file_exists($cheminPdf)) {
                $status['exists'] = true;
                $status['local_size'] = filesize($cheminPdf);
                $status['last_modified'] = date('Y-m-d H:i:s', filemtime($cheminPdf));

                // Vérifier si à jour
                $dateModifPdf = filemtime($cheminPdf);
                $dateModifFacture = $facture->updated_at->timestamp;
                $status['up_to_date'] = $dateModifFacture <= $dateModifPdf;
            }

            return $status;

        } catch (Exception $e) {
            Log::error('Erreur lors de la récupération du statut PDF pour show', [
                'facture_id' => $facture->id,
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
