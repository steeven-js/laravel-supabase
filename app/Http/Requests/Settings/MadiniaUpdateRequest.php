<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class MadiniaUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            // Identité
            'name' => ['required', 'string', 'max:255'],
            'contact_principal_id' => ['nullable', 'exists:users,id'],

            // Coordonnées
            'telephone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'site_web' => ['nullable', 'url', 'max:255'],

            // Adresse et informations légales
            'siret' => ['nullable', 'string'],
            'numero_nda' => ['nullable', 'string', 'max:50'],
            'pays' => ['required', 'string', 'max:100'],
            'adresse' => ['nullable', 'string', 'max:500'],

            // Description
            'description' => ['nullable', 'string', 'max:1000'],

            // Réseaux sociaux
            'reseaux_sociaux.facebook' => ['nullable', 'url', 'max:255'],
            'reseaux_sociaux.twitter' => ['nullable', 'url', 'max:255'],
            'reseaux_sociaux.instagram' => ['nullable', 'url', 'max:255'],
            'reseaux_sociaux.linkedin' => ['nullable', 'url', 'max:255'],

            // Informations bancaires
            'nom_compte_bancaire' => ['nullable', 'string', 'max:255'],
            'nom_banque' => ['nullable', 'string', 'max:255'],
            'numero_compte' => ['nullable', 'string', 'max:50'],
            'iban_bic_swift' => ['nullable', 'string', 'max:50'],
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom de l\'entreprise est obligatoire.',
            'name.max' => 'Le nom de l\'entreprise ne peut pas dépasser 255 caractères.',

            'contact_principal_id.exists' => 'Le contact principal sélectionné n\'existe pas.',

            'telephone.max' => 'Le numéro de téléphone ne peut pas dépasser 20 caractères.',
            'email.email' => 'L\'adresse email doit être valide.',
            'email.max' => 'L\'adresse email ne peut pas dépasser 255 caractères.',
            'site_web.url' => 'L\'URL du site web doit être valide.',
            'site_web.max' => 'L\'URL du site web ne peut pas dépasser 255 caractères.',

            'numero_nda.max' => 'Le numéro NDA ne peut pas dépasser 50 caractères.',
            'pays.required' => 'Le pays est obligatoire.',
            'pays.max' => 'Le nom du pays ne peut pas dépasser 100 caractères.',
            'adresse.max' => 'L\'adresse ne peut pas dépasser 500 caractères.',

            'description.max' => 'La description ne peut pas dépasser 1000 caractères.',

            'reseaux_sociaux.facebook.url' => 'L\'URL Facebook doit être valide.',
            'reseaux_sociaux.twitter.url' => 'L\'URL Twitter doit être valide.',
            'reseaux_sociaux.instagram.url' => 'L\'URL Instagram doit être valide.',
            'reseaux_sociaux.linkedin.url' => 'L\'URL LinkedIn doit être valide.',

            'nom_compte_bancaire.max' => 'Le nom du compte bancaire ne peut pas dépasser 255 caractères.',
            'nom_banque.max' => 'Le nom de la banque ne peut pas dépasser 255 caractères.',
            'numero_compte.max' => 'Le numéro de compte ne peut pas dépasser 50 caractères.',
            'iban_bic_swift.max' => 'L\'IBAN/BIC/SWIFT ne peut pas dépasser 50 caractères.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Nettoyer les URLs des réseaux sociaux
        if ($this->has('reseaux_sociaux')) {
            $reseaux = $this->input('reseaux_sociaux', []);

            foreach ($reseaux as $key => $url) {
                if (empty($url)) {
                    $reseaux[$key] = null;
                } else {
                    // Ajouter https:// si pas de protocole
                    if (!str_starts_with($url, 'http://') && !str_starts_with($url, 'https://')) {
                        $reseaux[$key] = 'https://' . $url;
                    }
                }
            }

            $this->merge([
                'reseaux_sociaux' => $reseaux
            ]);
        }

        // Nettoyer l'URL du site web
        if ($this->has('site_web') && !empty($this->input('site_web'))) {
            $siteWeb = $this->input('site_web');
            if (!str_starts_with($siteWeb, 'http://') && !str_starts_with($siteWeb, 'https://')) {
                $this->merge([
                    'site_web' => 'https://' . $siteWeb
                ]);
            }
        }
    }
}
