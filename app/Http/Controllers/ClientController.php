<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientEmail;
use App\Models\Entreprise;
use App\Mail\ClientEmailMailable;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Exception;
use App\Services\EmailLogService;

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
            },
            'opportunities' => function($query) {
                $query->with('user')->orderBy('created_at', 'desc');
            },
            'tickets' => function($query) {
                $query->with(['user', 'creator'])->orderBy('created_at', 'desc');
            },
            'todos' => function($query) {
                $query->with('user')->orderBy('ordre');
            }
        ]);

        // Récupérer l'historique des actions avec les utilisateurs
        $historique = $client->historique()
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

        return Inertia::render('clients/show', [
            'client' => $client,
            'historique' => $historique,
        ]);
    }

    /**
     * Envoie un email au client
     */
    public function sendEmail(Request $request, Client $client)
    {
        // Démarrer une session de logs d'email
        $sessionId = EmailLogService::startEmailSession('client_email', [
            'recipient' => $client->email,
            'client_id' => $client->id,
            'user_id' => Auth::id(),
            'ip' => $request->ip(),
        ]);

        Log::info('=== DÉBUT SENDMAIL DEBUG ===', [
            'client_id' => $client->id,
            'request_all' => $request->except(['attachments']), // Exclure les fichiers du log pour éviter les erreurs
            'request_files' => $request->allFiles(),
            'request_method' => $request->method(),
            'has_attachments' => $request->hasFile('attachments'),
            'attachments_count' => $request->hasFile('attachments') ? count($request->file('attachments')) : 0
        ]);

        try {
            $validated = $request->validate([
                'objet' => 'required|string|max:255',
                'contenu' => 'required|string',
                'cc' => 'nullable|string',
                'attachments' => 'nullable|array',
                'attachments.*' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png,txt|max:25600', // 25MB max par fichier
            ], [
                'attachments.*.file' => 'Chaque pièce jointe doit être un fichier valide.',
                'attachments.*.mimes' => 'Les types de fichiers autorisés sont : PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, TXT.',
                'attachments.*.max' => 'Chaque fichier ne peut pas dépasser 25MB.',
            ]);

            EmailLogService::logEvent('PREPARATION', 'INFO', [
                'type' => 'Email client personnalisé',
                'template' => 'ClientEmailMailable',
                'recipient' => $client->email,
                'client' => $client->prenom . ' ' . $client->nom,
                'subject' => $validated['objet'],
            ]);

                            // Traiter les adresses CC
            $ccEmails = [];
            if (!empty($validated['cc'])) {
                $ccEmails = array_map('trim', explode(',', $validated['cc']));
                // Valider chaque adresse email
                foreach ($ccEmails as $email) {
                    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        EmailLogService::logError($client->email, "Adresse CC invalide: {$email}", [
                            'invalid_cc' => $email,
                            'all_cc' => $validated['cc'],
                        ]);

                        EmailLogService::endEmailSession(false, [
                            'error' => 'Adresse CC invalide',
                            'invalid_email' => $email,
                        ]);

                        return back()
                            ->withErrors(['cc' => "L'adresse email '{$email}' n'est pas valide."])
                            ->with('error', '❌ Erreur de validation. Veuillez vérifier les adresses CC.');
                    }
                }

                EmailLogService::logEvent('CC_PROCESSED', 'INFO', [
                    'original_cc' => $validated['cc'],
                    'valid_emails' => $ccEmails,
                    'count' => count($ccEmails),
                ]);
            }

            // Traiter les pièces jointes
            $attachmentsInfo = [];
            $attachmentPaths = [];

            Log::info('=== DÉBUT TRAITEMENT PIÈCES JOINTES ===', [
                'has_files' => $request->hasFile('attachments'),
                'files_data' => $request->allFiles(),
                'request_attachments' => $request->file('attachments')
            ]);

            if ($request->hasFile('attachments')) {
                EmailLogService::logEvent('ATTACHMENTS_START', 'INFO', [
                    'files_count' => count($request->file('attachments')),
                ]);

                // S'assurer que le dossier exists
                $attachmentDir = storage_path('app/private/client_emails/attachments');
                if (!file_exists($attachmentDir)) {
                    mkdir($attachmentDir, 0755, true);
                    Log::info('Dossier pièces jointes créé', ['path' => $attachmentDir]);
                }

                foreach ($request->file('attachments') as $index => $file) {
                    Log::info('Traitement du fichier', [
                        'index' => $index,
                        'original_name' => $file->getClientOriginalName(),
                        'size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                        'is_valid' => $file->isValid(),
                        'error' => $file->getError()
                    ]);

                    if (!$file->isValid()) {
                        Log::error('Fichier invalide', [
                            'index' => $index,
                            'error' => $file->getError(),
                            'error_message' => $file->getErrorMessage()
                        ]);
                        continue;
                    }

                    $originalName = $file->getClientOriginalName();
                    $extension = $file->getClientOriginalExtension();
                    $fileName = 'email_attachment_' . time() . '_' . $index . '.' . $extension;

                    try {
                        // Stocker le fichier dans storage/app/private/client_emails/attachments
                        $path = $file->storeAs('client_emails/attachments', $fileName, 'local');

                        Log::info('Fichier stocké avec succès', [
                            'original_name' => $originalName,
                            'stored_path' => $path,
                            'full_path' => storage_path('app/private/' . $path)
                        ]);

                        $attachmentsInfo[] = [
                            'original_name' => $originalName,
                            'stored_name' => $fileName,
                            'path' => $path,
                            'size' => $file->getSize(),
                            'mime_type' => $file->getMimeType(),
                        ];

                        $attachmentPaths[] = storage_path('app/private/' . $path);

                        EmailLogService::logAttachment($originalName, $file->getSize(), $file->getMimeType(), [
                            'stored_name' => $fileName,
                            'path' => $path,
                        ]);
                    } catch (Exception $e) {
                        Log::error('Erreur lors du stockage du fichier', [
                            'original_name' => $originalName,
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);

                        EmailLogService::logError($client->email, "Erreur stockage fichier: {$originalName}", [
                            'file_name' => $originalName,
                            'error' => $e->getMessage(),
                        ]);

                        throw new Exception("Erreur lors du stockage du fichier {$originalName}: " . $e->getMessage());
                    }
                }

                Log::info('=== FIN TRAITEMENT PIÈCES JOINTES ===', [
                    'total_files' => count($attachmentsInfo),
                    'attachment_paths' => $attachmentPaths
                ]);

                EmailLogService::logEvent('ATTACHMENTS_END', 'INFO', [
                    'total_files' => count($attachmentsInfo),
                    'total_size' => array_sum(array_column($attachmentsInfo, 'size')),
                ]);
            }

            // Enregistrer l'email dans la base de données
            $clientEmail = ClientEmail::create([
                'client_id' => $client->id,
                'user_id' => Auth::id(),
                'objet' => $validated['objet'],
                'contenu' => $validated['contenu'],
                'cc' => $validated['cc'] ?? null,
                'attachments' => $attachmentsInfo,
                'statut' => 'envoye',
                'date_envoi' => now(),
            ]);

            try {
                // Envoi réel de l'email avec Mailable
                Log::info('=== DÉBUT ENVOI EMAIL CLIENT ===', [
                    'client_id' => $client->id,
                    'client_email' => $client->email,
                    'user_id' => Auth::id(),
                    'objet' => $validated['objet'],
                    'cc_emails' => $ccEmails,
                    'attachments_count' => count($attachmentsInfo),
                    'attachment_paths' => $attachmentPaths
                ]);

                                $mailInstance = new ClientEmailMailable(
                    $client,
                    Auth::user(),
                    $validated['objet'],
                    $validated['contenu'],
                    $attachmentPaths
                );

                // Créer l'instance de mail avec ou sans CC
                $mail = Mail::to($client->email);

                if (!empty($ccEmails)) {
                    $mail->cc($ccEmails);
                }

                EmailLogService::logEvent('SENDING', 'INFO', [
                    'recipient' => $client->email,
                    'subject' => $validated['objet'],
                    'cc_count' => count($ccEmails),
                    'attachments_count' => count($attachmentsInfo),
                ]);

                $mail->send($mailInstance);

                Log::info('Email client envoyé avec succès', [
                    'client_email' => $client->email,
                    'objet' => $validated['objet'],
                    'cc_count' => count($ccEmails),
                    'attachments_count' => count($attachmentsInfo)
                ]);

                EmailLogService::logSuccess($client->email, $validated['objet'], [
                    'template' => 'ClientEmailMailable',
                    'cc_count' => count($ccEmails),
                    'attachments_count' => count($attachmentsInfo),
                ]);

            } catch (Exception $e) {
                // Marquer l'email comme échoué si l'envoi réel échoue
                Log::error('=== ERREUR ENVOI EMAIL CLIENT ===', [
                    'client_email' => $client->email,
                    'error_message' => $e->getMessage(),
                    'error_code' => $e->getCode(),
                    'error_file' => $e->getFile(),
                    'error_line' => $e->getLine(),
                ]);

                EmailLogService::logError($client->email, $e->getMessage(), [
                    'error_code' => $e->getCode(),
                    'error_file' => basename($e->getFile()),
                    'error_line' => $e->getLine(),
                ]);

                $clientEmail->update(['statut' => 'echec']);
                throw $e;
            }

            // Préparer le message de notification
            $notificationMessage = "Un email a été envoyé à {$client->prenom} {$client->nom} avec l'objet : \"{$validated['objet']}\"";
            if (!empty($ccEmails)) {
                $notificationMessage .= " (CC: " . implode(', ', $ccEmails) . ")";
            }
            if (!empty($attachmentsInfo)) {
                $notificationMessage .= " (" . count($attachmentsInfo) . " pièce(s) jointe(s))";
            }

            // Envoyer notification pour l'envoi d'email au client
            $client->sendCustomNotification('email_sent', $notificationMessage);

            $successMessage = '📧 Email envoyé avec succès à ' . $client->nom_complet;
            if (!empty($ccEmails)) {
                $successMessage .= ' (avec ' . count($ccEmails) . ' destinataire(s) en copie)';
            }
            if (!empty($attachmentsInfo)) {
                $successMessage .= ' (avec ' . count($attachmentsInfo) . ' pièce(s) jointe(s))';
            }

            // Terminer la session avec succès
            EmailLogService::endEmailSession(true, [
                'emails_sent' => 1,
                'cc_count' => count($ccEmails),
                'attachments_count' => count($attachmentsInfo),
                'template' => 'ClientEmailMailable',
            ]);

            return back()->with('success', $successMessage);

        } catch (ValidationException $e) {
            Log::error('Erreur de validation lors de l\'envoi d\'email', [
                'client_id' => $client->id,
                'errors' => $e->errors(),
                'input' => $request->except(['attachments']) // Exclure les fichiers pour éviter les erreurs de sérialisation
            ]);

            EmailLogService::endEmailSession(false, [
                'error' => 'Erreur de validation',
                'validation_errors' => $e->errors(),
            ]);

            return back()
                ->withErrors($e->errors())
                ->with('error', '❌ Erreur de validation. Veuillez vérifier les informations saisies.');

        } catch (Exception $e) {
            Log::error('Erreur générale lors de l\'envoi d\'email', [
                'client_id' => $client->id,
                'error_message' => $e->getMessage(),
                'error_trace' => $e->getTraceAsString(),
                'input' => $request->except(['attachments']) // Exclure les fichiers pour éviter les erreurs de sérialisation
            ]);

            EmailLogService::endEmailSession(false, [
                'error' => $e->getMessage(),
                'emails_sent' => 0,
            ]);

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
