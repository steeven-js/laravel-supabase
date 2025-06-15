<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Facture;
use App\Services\FacturePdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
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
            'montant_ht' => (float) $facture->montant_ht,
            'taux_tva' => (float) $facture->taux_tva,
            'montant_ttc' => (float) $facture->montant_ttc,
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
            'montant_ht' => (float) $facture->montant_ht,
            'taux_tva' => (float) $facture->taux_tva,
            'montant_ttc' => (float) $facture->montant_ttc,
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

            // Mettre à jour le PDF après modification - TOUJOURS régénérer
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
                // Ne pas bloquer la sauvegarde de la facture si le PDF échoue
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

            // S'assurer que le PDF existe avant l'envoi de l'email
            $cheminPdf = $this->facturePdfService->getCheminPdf($facture);

            if (!$cheminPdf || !file_exists($cheminPdf)) {
                Log::info('PDF non trouvé, génération en cours...', [
                    'facture_numero' => $facture->numero_facture,
                    'chemin_attendu' => $cheminPdf,
                ]);

                $nomFichierPdf = $this->facturePdfService->genererEtSauvegarder($facture);
                $facture->pdf_file = $nomFichierPdf;
                $facture->save();

                Log::info('PDF généré pour l\'envoi email', [
                    'facture_numero' => $facture->numero_facture,
                    'fichier_pdf' => $nomFichierPdf,
                ]);
            } else {
                Log::info('PDF existant trouvé', [
                    'facture_numero' => $facture->numero_facture,
                    'chemin_pdf' => $cheminPdf,
                    'taille_fichier' => filesize($cheminPdf) . ' bytes',
                ]);
            }

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
     * Régénère le PDF d'une facture
     */
    public function regenererPdf(Facture $facture)
    {
        try {
            // Redirection vers une page React pour générer le PDF
            return redirect()->route('factures.show', $facture->id)
                ->with('generate_pdf', true)
                ->with('info', '💡 Utilisez le bouton "Sauvegarder PDF" pour générer le PDF avec react-pdf/renderer');
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
            // Toujours rediriger vers la génération React
            return response()->json([
                'status' => 'redirect_to_react',
                'message' => 'Utilisez le bouton "Sauvegarder PDF" pour générer avec react-pdf/renderer'
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
     * Sauvegarde un PDF généré par React PDF Renderer
     */
    public function saveReactPdf(Request $request, Facture $facture)
    {
        try {
            $request->validate([
                'pdf_blob' => 'required|string', // Base64 du PDF
                'filename' => 'required|string',
            ]);

            Log::info('Début sauvegarde PDF React', [
                'facture_id' => $facture->id,
                'numero_facture' => $facture->numero_facture,
                'filename' => $request->filename,
            ]);

            // Décoder le blob PDF
            $pdfContent = base64_decode($request->pdf_blob);

            if ($pdfContent === false) {
                throw new \Exception('Impossible de décoder le contenu PDF');
            }

            // Générer le nom de fichier
            $nomFichier = "facture_{$facture->numero_facture}_{$facture->id}.pdf";

            // 1. Sauvegarder localement
            $this->sauvegarderPdfLocal($pdfContent, $nomFichier, 'factures');

            // 2. Sauvegarder sur Supabase
            $urlSupabase = $this->sauvegarderPdfSupabase($pdfContent, $nomFichier, 'factures');

            // 3. Mettre à jour la base de données
            $facture->update([
                'pdf_file' => $nomFichier,
                'pdf_url' => $urlSupabase,
            ]);

            Log::info('PDF React sauvegardé avec succès', [
                'facture_id' => $facture->id,
                'nom_fichier' => $nomFichier,
                'url_supabase' => $urlSupabase,
                'taille' => strlen($pdfContent) . ' bytes',
            ]);

            return redirect()->back()->with('success', '✅ PDF généré et sauvegardé avec succès !');

        } catch (\Exception $e) {
            Log::error('Erreur sauvegarde PDF React', [
                'facture_id' => $facture->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->with('error', '❌ Erreur lors de la sauvegarde du PDF: ' . $e->getMessage());
        }
    }

    /**
     * Sauvegarde un PDF localement
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
     * Sauvegarde un PDF sur Supabase Storage
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

            $response = \Illuminate\Support\Facades\Http::withHeaders([
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

    /**
     * Synchronise le PDF de la facture vers Supabase en utilisant React PDF
     */
    public function syncSupabase(Facture $facture)
    {
        try {
            $facture->load(['client.entreprise', 'devis', 'administrateur']);

            Log::info('Début synchronisation PDF React vers Supabase', [
                'facture_id' => $facture->id,
                'numero_facture' => $facture->numero_facture
            ]);

            // Récupérer les informations Madinia
            $madinia = \App\Models\Madinia::getInstance();

            // Construire les données formatées pour React PDF
            $factureData = [
                'numero_facture' => $facture->numero_facture,
                'objet' => $facture->objet,
                'statut' => $facture->statut,
                'date_facture' => $facture->date_facture?->format('Y-m-d') ?? '',
                'date_echeance' => $facture->date_echeance?->format('Y-m-d') ?? '',
                'date_paiement' => $facture->date_paiement?->format('Y-m-d'),
                'montant_ht' => (float) $facture->montant_ht,
                'taux_tva' => (float) $facture->taux_tva,
                'montant_ttc' => (float) $facture->montant_ttc,
                'description' => $facture->description,
                'conditions_paiement' => $facture->conditions_paiement,
                'notes' => $facture->notes,
                'lignes' => $facture->lignes ? $facture->lignes->map(function ($ligne) {
                    return [
                        'id' => $ligne->id,
                        'quantite' => (float) $ligne->quantite,
                        'prix_unitaire_ht' => (float) $ligne->prix_unitaire_ht,
                        'taux_tva' => (float) $ligne->taux_tva,
                        'montant_ht' => (float) $ligne->montant_ht,
                        'montant_tva' => (float) $ligne->montant_tva,
                        'montant_ttc' => (float) $ligne->montant_ttc,
                        'ordre' => $ligne->ordre,
                        'description_personnalisee' => $ligne->description_personnalisee,
                        'service' => $ligne->service ? [
                            'nom' => $ligne->service->nom,
                            'description' => $ligne->service->description,
                        ] : null
                    ];
                })->toArray() : [],
                'client' => $facture->client ? [
                    'nom' => $facture->client->nom,
                    'prenom' => $facture->client->prenom,
                    'email' => $facture->client->email,
                    'telephone' => $facture->client->telephone,
                    'adresse' => $facture->client->adresse,
                    'ville' => $facture->client->ville,
                    'code_postal' => $facture->client->code_postal,
                    'entreprise' => $facture->client->entreprise ? [
                        'nom' => $facture->client->entreprise->nom,
                        'nom_commercial' => $facture->client->entreprise->nom_commercial,
                        'adresse' => $facture->client->entreprise->adresse,
                        'ville' => $facture->client->entreprise->ville,
                        'code_postal' => $facture->client->entreprise->code_postal,
                    ] : null
                ] : null,
                'administrateur' => $facture->administrateur ? [
                    'id' => $facture->administrateur->id,
                    'name' => $facture->administrateur->name,
                    'email' => $facture->administrateur->email,
                ] : null,
                'devis' => $facture->devis ? [
                    'numero_devis' => $facture->devis->numero_devis,
                ] : null,
            ];

            $madiniaData = $madinia ? [
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
            ] : null;

            // Retourner les données pour que le frontend génère et sauvegarde le PDF
            return Inertia::render('factures/sync-pdf', [
                'facture' => $factureData,
                'madinia' => $madiniaData,
                'saveRoute' => route('factures.save-react-pdf', $facture->id),
                'backRoute' => route('factures.show', $facture->id),
                'autoGenerate' => true, // Flag pour génération automatique
            ]);

        } catch (Exception $e) {
            Log::error('Exception lors de la synchronisation PDF vers Supabase', [
                'facture_id' => $facture->id,
                'numero_facture' => $facture->numero_facture,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Erreur lors de la synchronisation vers Supabase');
        }
    }
}
