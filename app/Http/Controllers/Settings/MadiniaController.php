<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\MadiniaUpdateRequest;
use App\Models\Madinia;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MadiniaController extends Controller
{
    /**
     * Afficher les paramètres de l'entreprise
     */
    public function show(): Response
    {
        $madinia = Madinia::getInstance();
        $madinia->load('contactPrincipal');

        $users = User::select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        // Récupérer l'historique des actions avec les utilisateurs
        $historique = $madinia->historique()
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

        return Inertia::render('madinia/show', [
            'madinia' => [
                'id' => $madinia->id,
                'name' => $madinia->name,
                'contact_principal_id' => $madinia->contact_principal_id,
                'contact_principal' => $madinia->contactPrincipal ? [
                    'id' => $madinia->contactPrincipal->id,
                    'name' => $madinia->contactPrincipal->name,
                    'email' => $madinia->contactPrincipal->email,
                ] : null,
                'telephone' => $madinia->telephone,
                'email' => $madinia->email,
                'site_web' => $madinia->site_web,
                'siret' => $madinia->siret,
                'numero_nda' => $madinia->numero_nda,
                'pays' => $madinia->pays,
                'adresse' => $madinia->adresse,
                'description' => $madinia->description,
                'reseaux_sociaux' => $madinia->reseaux_sociaux ?? [
                    'facebook' => '',
                    'twitter' => '',
                    'instagram' => '',
                    'linkedin' => ''
                ],
                'nom_compte_bancaire' => $madinia->nom_compte_bancaire,
                'nom_banque' => $madinia->nom_banque,
                'numero_compte' => $madinia->numero_compte,
                'iban_bic_swift' => $madinia->iban_bic_swift,
                'adresse_complete' => $madinia->adresse_complete,
                'infos_bancaires_completes' => $madinia->infos_bancaires_completes,
                'infos_legales_completes' => $madinia->infos_legales_completes,
                'reseaux_sociaux_formates' => $madinia->reseaux_sociaux_formates,
                'created_at' => $madinia->created_at,
                'updated_at' => $madinia->updated_at,
            ],
            'users' => $users,
            'historique' => $historique,
        ]);
    }

    /**
     * Mettre à jour les informations de l'entreprise
     */
    public function update(MadiniaUpdateRequest $request): RedirectResponse
    {
        $madinia = Madinia::getInstance();

        $validatedData = $request->validated();

        // Gérer les réseaux sociaux
        if (isset($validatedData['reseaux_sociaux'])) {
            // Nettoyer les valeurs vides
            $reseaux = array_filter($validatedData['reseaux_sociaux'], function($value) {
                return !empty($value) && $value !== null;
            });
            $validatedData['reseaux_sociaux'] = $reseaux;
        }

        // Nettoyer les valeurs vides pour éviter de remplacer les valeurs existantes par des chaînes vides
        $validatedData = array_filter($validatedData, function($value) {
            if (is_string($value)) {
                return trim($value) !== '';
            }
            return $value !== null;
        });

        $madinia->update($validatedData);

        return redirect()->back()->with('success', 'Les informations de l\'entreprise ont été mises à jour avec succès.');
    }

    /**
     * API pour récupérer les informations de base de l'entreprise
     */
    public function api()
    {
        $madinia = Madinia::getInstance();

        return response()->json([
            'name' => $madinia->name,
            'email' => $madinia->email,
            'telephone' => $madinia->telephone,
            'site_web' => $madinia->site_web,
            'adresse_complete' => $madinia->adresse_complete,
            'siret' => $madinia->siret,
            'reseaux_sociaux' => $madinia->reseaux_sociaux_formates,
        ]);
    }
}
