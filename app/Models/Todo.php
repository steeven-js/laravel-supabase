<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Todo extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'description',
        'termine',
        'ordre',
        'priorite',
        'date_echeance',
        'client_id',
        'user_id',
    ];

    protected $casts = [
        'termine' => 'boolean',
        'ordre' => 'integer',
        'date_echeance' => 'date',
    ];

    // Constantes pour les priorités
    const PRIORITES = [
        'faible' => 'Faible',
        'normale' => 'Normale',
        'haute' => 'Haute',
        'critique' => 'Critique',
    ];

    /**
     * Relation avec le client
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Relation avec l'utilisateur créateur
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope pour les tâches d'un client spécifique
     */
    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    /**
     * Scope pour les tâches d'un utilisateur spécifique
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope pour les tâches terminées
     */
    public function scopeCompleted($query)
    {
        return $query->where('termine', true);
    }

    /**
     * Scope pour les tâches non terminées
     */
    public function scopePending($query)
    {
        return $query->where('termine', false);
    }

    /**
     * Scope pour ordonner par ordre
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('ordre');
    }

    /**
     * Marquer la tâche comme terminée
     */
    public function markAsCompleted()
    {
        $this->update(['termine' => true]);
    }

    /**
     * Marquer la tâche comme non terminée
     */
    public function markAsPending()
    {
        $this->update(['termine' => false]);
    }

    /**
     * Obtenir la couleur de la priorité
     */
    public function getPriorityColor(): string
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
     * Obtenir la classe CSS pour la couleur de priorité
     */
    public function getPriorityColorClass(): string
    {
        return match($this->priorite) {
            'faible' => 'bg-blue-100 text-blue-800 border-blue-200',
            'normale' => 'bg-gray-100 text-gray-800 border-gray-200',
            'haute' => 'bg-orange-100 text-orange-800 border-orange-200',
            'critique' => 'bg-red-100 text-red-800 border-red-200',
            default => 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }

    /**
     * Vérifier si la tâche est en retard
     */
    public function isOverdue(): bool
    {
        return $this->date_echeance &&
               !$this->termine &&
               $this->date_echeance->isPast();
    }
}
