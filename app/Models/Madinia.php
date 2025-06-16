<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\HasHistorique;

class Madinia extends Model
{
    use HasFactory, HasHistorique;

    protected $table = 'madinia';

    protected $fillable = [
        'name',
        'contact_principal_id',
        'telephone',
        'email',
        'site_web',
        'siret',
        'numero_nda',
        'pays',
        'adresse',
        'description',
        'reseaux_sociaux',
        'nom_compte_bancaire',
        'nom_banque',
        'numero_compte',
        'iban_bic_swift',
    ];

    protected $casts = [
        'reseaux_sociaux' => 'array',
    ];

    /**
     * Relation avec le contact principal
     */
    public function contactPrincipal(): BelongsTo
    {
        return $this->belongsTo(User::class, 'contact_principal_id');
    }

    /**
     * Accesseur pour l'adresse complète formatée
     */
    public function getAdresseCompleteAttribute(): string
    {
        $parts = array_filter([
            $this->adresse,
            $this->pays
        ]);

        return implode(', ', $parts);
    }

    /**
     * Accesseur pour vérifier si les informations bancaires sont complètes
     */
    public function getInfosBancairesCompletesAttribute(): bool
    {
        return !empty($this->nom_compte_bancaire) &&
               !empty($this->nom_banque) &&
               !empty($this->numero_compte) &&
               !empty($this->iban_bic_swift);
    }

    /**
     * Accesseur pour vérifier si les informations légales sont complètes
     */
    public function getInfosLegalesCompletesAttribute(): bool
    {
        return !empty($this->siret) && !empty($this->numero_nda);
    }

    /**
     * Accesseur pour les réseaux sociaux formatés
     */
    public function getReseauxSociauxFormatesAttribute(): array
    {
        $reseaux = $this->reseaux_sociaux ?? [];
        $formatted = [];

        if (!empty($reseaux['facebook'])) {
            $formatted['Facebook'] = $reseaux['facebook'];
        }
        if (!empty($reseaux['twitter'])) {
            $formatted['Twitter'] = $reseaux['twitter'];
        }
        if (!empty($reseaux['instagram'])) {
            $formatted['Instagram'] = $reseaux['instagram'];
        }
        if (!empty($reseaux['linkedin'])) {
            $formatted['LinkedIn'] = $reseaux['linkedin'];
        }

        return $formatted;
    }

    /**
     * Récupère ou crée l'instance unique de Madinia
     */
    public static function getInstance(): self
    {
        return self::firstOrCreate(
            ['id' => 1],
            [
                'name' => 'Madin.IA',
                'pays' => 'France',
                'reseaux_sociaux' => [
                    'facebook' => '',
                    'twitter' => '',
                    'instagram' => '',
                    'linkedin' => ''
                ]
            ]
        );
    }
}
