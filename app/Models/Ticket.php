<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'description',
        'priorite',
        'statut',
        'type',
        'client_id',
        'user_id',
        'created_by',
        'notes_internes',
        'solution',
        'date_resolution',
        'date_echeance',
        'temps_estime',
        'temps_passe',
        'progression',
        'visible_client',
    ];

    protected $casts = [
        'date_resolution' => 'datetime',
        'date_echeance' => 'datetime',
        'temps_estime' => 'integer',
        'temps_passe' => 'integer',
        'progression' => 'integer',
        'visible_client' => 'boolean',
    ];

    /**
     * Les priorités disponibles
     */
    public const PRIORITES = [
        'faible' => 'Faible',
        'normale' => 'Normale',
        'haute' => 'Haute',
        'critique' => 'Critique',
    ];

    /**
     * Les statuts disponibles
     */
    public const STATUTS = [
        'ouvert' => 'Ouvert',
        'en_cours' => 'En cours',
        'resolu' => 'Résolu',
        'ferme' => 'Fermé',
    ];

    /**
     * Les types disponibles
     */
    public const TYPES = [
        'bug' => 'Bug',
        'demande' => 'Demande',
        'incident' => 'Incident',
        'question' => 'Question',
        'autre' => 'Autre',
    ];

    /**
     * Relation avec le client
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Relation avec l'utilisateur assigné
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec l'utilisateur qui a créé le ticket
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope pour les tickets ouverts
     */
    public function scopeOuverts(Builder $query): Builder
    {
        return $query->whereIn('statut', ['ouvert', 'en_cours']);
    }

    /**
     * Scope pour les tickets fermés
     */
    public function scopeFermes(Builder $query): Builder
    {
        return $query->whereIn('statut', ['resolu', 'ferme']);
    }

    /**
     * Scope pour les tickets par priorité
     */
    public function scopeParPriorite(Builder $query, string $priorite): Builder
    {
        return $query->where('priorite', $priorite);
    }

    /**
     * Scope pour les tickets par client
     */
    public function scopeParClient(Builder $query, int $clientId): Builder
    {
        return $query->where('client_id', $clientId);
    }

    /**
     * Scope pour les tickets assignés à un utilisateur
     */
    public function scopeAssignesA(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope pour les tickets en retard
     */
    public function scopeEnRetard(Builder $query): Builder
    {
        return $query->where('date_echeance', '<', now())
                    ->whereIn('statut', ['ouvert', 'en_cours']);
    }

    /**
     * Obtenir le libellé de la priorité
     */
    public function getPrioriteLabel(): string
    {
        return self::PRIORITES[$this->priorite] ?? $this->priorite;
    }

    /**
     * Obtenir le libellé du statut
     */
    public function getStatutLabel(): string
    {
        return self::STATUTS[$this->statut] ?? $this->statut;
    }

    /**
     * Obtenir le libellé du type
     */
    public function getTypeLabel(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    /**
     * Vérifier si le ticket est ouvert
     */
    public function isOuvert(): bool
    {
        return in_array($this->statut, ['ouvert', 'en_cours']);
    }

    /**
     * Vérifier si le ticket est fermé
     */
    public function isFerme(): bool
    {
        return in_array($this->statut, ['resolu', 'ferme']);
    }

    /**
     * Vérifier si le ticket est en retard
     */
    public function isEnRetard(): bool
    {
        return $this->date_echeance &&
               $this->date_echeance->isPast() &&
               $this->isOuvert();
    }

    /**
     * Obtenir la couleur de la priorité
     */
    public function getPrioriteColor(): string
    {
        return match($this->priorite) {
            'faible' => 'blue',
            'normale' => 'gray',
            'haute' => 'orange',
            'critique' => 'red',
            default => 'gray',
        };
    }

    /**
     * Obtenir la couleur du statut
     */
    public function getStatutColor(): string
    {
        return match($this->statut) {
            'ouvert' => 'red',
            'en_cours' => 'yellow',
            'resolu' => 'green',
            'ferme' => 'gray',
            default => 'gray',
        };
    }

    /**
     * Obtenir la progression en pourcentage
     */
    public function getProgression(): int
    {
        // Si une progression personnalisée est définie, l'utiliser
        if ($this->progression !== null) {
            return $this->progression;
        }

        // Sinon, utiliser la progression par défaut basée sur le statut
        return match($this->statut) {
            'ouvert' => 0,
            'en_cours' => 50,
            'resolu' => 100,
            'ferme' => 100,
            default => 0,
        };
    }

    /**
     * Obtenir la couleur de la progression
     */
    public function getProgressionColor(): string
    {
        $progression = $this->getProgression();

        if ($progression <= 25) return 'red';
        if ($progression <= 50) return 'orange';
        if ($progression <= 75) return 'yellow';
        return 'green';
    }

    /**
     * Obtenir la classe CSS pour la couleur de progression
     */
    public function getProgressionColorClass(): string
    {
        $progression = $this->getProgression();

        if ($progression <= 25) return 'bg-red-500';
        if ($progression <= 50) return 'bg-orange-500';
        if ($progression <= 75) return 'bg-yellow-500';
        return 'bg-green-500';
    }

    /**
     * Obtenir le temps restant estimé
     */
    public function getTempsRestant(): ?int
    {
        if (!$this->temps_estime) {
            return null;
        }

        return max(0, $this->temps_estime - $this->temps_passe);
    }

    /**
     * Marquer comme résolu
     */
    public function resoudre(?string $solution = null): void
    {
        $this->update([
            'statut' => 'resolu',
            'date_resolution' => now(),
            'solution' => $solution ?? $this->solution,
        ]);
    }

    /**
     * Fermer le ticket
     */
    public function fermer(): void
    {
        $this->update([
            'statut' => 'ferme',
            'date_resolution' => $this->date_resolution ?? now(),
        ]);
    }
}
