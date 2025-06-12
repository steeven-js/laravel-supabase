<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class EmailTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'sub_category',
        'subject',
        'body',
        'is_default',
        'is_active',
        'variables',
        'description'
    ];

    protected $casts = [
        'variables' => 'array',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    // Constantes pour les catégories
    const CATEGORIES = [
        'envoi_initial' => 'Envoi initial de devis',
        'rappel' => 'Rappel de devis',
        'relance' => 'Relance de devis',
        'confirmation' => 'Confirmation de devis accepté'
    ];

    // Constantes pour les sous-catégories
    const SUB_CATEGORIES = [
        // Envoi initial
        'promotionnel' => 'Promotionnel',
        'concis_direct' => 'Concis et direct',
        'standard_professionnel' => 'Standard professionnel',
        'detaille_etapes' => 'Détaillé avec étapes',
        'personnalise_chaleureux' => 'Personnalisé et chaleureux',

        // Rappel
        'rappel_offre_speciale' => 'Rappel avec offre spéciale',
        'rappel_date_expiration' => 'Rappel avec date d\'expiration',
        'rappel_standard' => 'Rappel standard',

        // Relance
        'suivi_standard' => 'Suivi standard',
        'suivi_ajustements' => 'Suivi avec ajustements possibles',
        'suivi_feedback' => 'Suivi avec demande de feedback',

        // Confirmation
        'confirmation_infos' => 'Confirmation avec demande d\'informations',
        'confirmation_etapes' => 'Confirmation avec étapes suivantes',
        'confirmation_standard' => 'Confirmation standard'
    ];

    // Scope pour récupérer les modèles actifs
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Scope pour récupérer les modèles par catégorie
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    // Scope pour récupérer le modèle par défaut d'une catégorie
    public function scopeDefaultForCategory($query, $category)
    {
        return $query->where('category', $category)->where('is_default', true);
    }

    // Accessor pour le nom de la catégorie
    protected function categoryName(): Attribute
    {
        return Attribute::make(
            get: fn () => self::CATEGORIES[$this->category] ?? $this->category,
        );
    }

    // Accessor pour le nom de la sous-catégorie
    protected function subCategoryName(): Attribute
    {
        return Attribute::make(
            get: fn () => self::SUB_CATEGORIES[$this->sub_category] ?? $this->sub_category,
        );
    }

    // Méthode pour remplacer les variables dans le template
    public function processTemplate(array $data = [])
    {
        $subject = $this->subject;
        $body = $this->body;

        foreach ($data as $key => $value) {
            // Gérer les deux formats : {variable} et {{variable}}
            $subject = str_replace("{{{$key}}}", $value, $subject); // Doubles accolades
            $subject = str_replace("{{$key}}", $value, $subject);   // Simples accolades
            $body = str_replace("{{{$key}}}", $value, $body);       // Doubles accolades
            $body = str_replace("{{$key}}", $value, $body);         // Simples accolades
        }

        return [
            'subject' => $subject,
            'body' => $body
        ];
    }

    // Méthode pour définir comme modèle par défaut
    public function setAsDefault()
    {
        // Retirer le statut par défaut des autres modèles de la même catégorie
        self::where('category', $this->category)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        // Définir ce modèle comme par défaut
        $this->update(['is_default' => true]);
    }

    // Méthode statique pour obtenir le modèle par défaut d'une catégorie
    public static function getDefaultForCategory($category)
    {
        return self::active()
            ->defaultForCategory($category)
            ->first();
    }

    // Méthode pour obtenir les sous-catégories d'une catégorie
    public static function getSubCategoriesForCategory($category)
    {
        $mapping = [
            'envoi_initial' => [
                'promotionnel', 'concis_direct', 'standard_professionnel',
                'detaille_etapes', 'personnalise_chaleureux'
            ],
            'rappel' => [
                'rappel_offre_speciale', 'rappel_date_expiration', 'rappel_standard'
            ],
            'relance' => [
                'suivi_standard', 'suivi_ajustements', 'suivi_feedback'
            ],
            'confirmation' => [
                'confirmation_infos', 'confirmation_etapes', 'confirmation_standard'
            ]
        ];

        return $mapping[$category] ?? [];
    }
}
