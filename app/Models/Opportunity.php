<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Opportunity extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'description',
        'etape',
        'probabilite',
        'montant',
        'date_cloture_prevue',
        'date_cloture_reelle',
        'client_id',
        'user_id',
        'notes',
        'active',
    ];

    protected $casts = [
        'date_cloture_prevue' => 'date',
        'date_cloture_reelle' => 'date',
        'montant' => 'decimal:2',
        'probabilite' => 'integer',
        'active' => 'boolean',
    ];

    /**
     * Les étapes disponibles pour les opportunités
     */
    public const ETAPES = [
        'prospection' => 'Prospection',
        'qualification' => 'Qualification',
        'proposition' => 'Proposition',
        'negociation' => 'Négociation',
        'fermeture' => 'Fermeture',
        'gagnee' => 'Gagnée',
        'perdue' => 'Perdue',
    ];

    /**
     * Relation avec le client
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Relation avec l'utilisateur responsable
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope pour les opportunités actives
     */
    public function scopeActives(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    /**
     * Scope pour les opportunités d'un client
     */
    public function scopeParClient(Builder $query, int $clientId): Builder
    {
        return $query->where('client_id', $clientId);
    }

    /**
     * Scope pour les opportunités d'un utilisateur
     */
    public function scopeParUtilisateur(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope pour les opportunités ouvertes (non fermées)
     */
    public function scopeOuvertes(Builder $query): Builder
    {
        return $query->whereNotIn('etape', ['gagnee', 'perdue']);
    }

    /**
     * Scope pour les opportunités fermées
     */
    public function scopeFermees(Builder $query): Builder
    {
        return $query->whereIn('etape', ['gagnee', 'perdue']);
    }

    /**
     * Obtenir le libellé de l'étape
     */
    public function getEtapeLabelAttribute(): string
    {
        return self::ETAPES[$this->etape] ?? $this->etape;
    }

    /**
     * Vérifier si l'opportunité est fermée
     */
    public function isFermee(): bool
    {
        return in_array($this->etape, ['gagnee', 'perdue']);
    }

    /**
     * Vérifier si l'opportunité est gagnée
     */
    public function isGagnee(): bool
    {
        return $this->etape === 'gagnee';
    }

    /**
     * Vérifier si l'opportunité est perdue
     */
    public function isPerdue(): bool
    {
        return $this->etape === 'perdue';
    }

    /**
     * Obtenir la couleur de l'étape pour l'affichage
     */
    public function getEtapeColorAttribute(): string
    {
        return match($this->etape) {
            'prospection' => 'blue',
            'qualification' => 'indigo',
            'proposition' => 'purple',
            'negociation' => 'yellow',
            'fermeture' => 'orange',
            'gagnee' => 'green',
            'perdue' => 'red',
            default => 'gray',
        };
    }

    /**
     * Obtenir le montant formaté
     */
    public function getMontantFormateAttribute(): string
    {
        if (!$this->montant) {
            return 'Non défini';
        }

        return number_format($this->montant, 2, ',', ' ') . ' €';
    }

    /**
     * Obtenir la probabilité formatée
     */
    public function getProbabiliteFormatteeAttribute(): string
    {
        return $this->probabilite . '%';
    }
}
