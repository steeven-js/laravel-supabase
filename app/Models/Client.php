<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    /**
     * Les attributs qui peuvent être assignés en masse.
     */
    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'telephone',
        'adresse',
        'ville',
        'code_postal',
        'pays',
        'actif',
        'notes',
        'entreprise_id',
    ];

    /**
     * Les attributs qui doivent être castés.
     */
    protected $casts = [
        'actif' => 'boolean',
    ];

    /**
     * Relation avec l'entreprise.
     */
    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class);
    }

    /**
     * Relation avec les devis.
     */
    public function devis(): HasMany
    {
        return $this->hasMany(Devis::class);
    }

    /**
     * Retourne le nom complet du client.
     */
    public function getNomCompletAttribute(): string
    {
        return $this->prenom . ' ' . $this->nom;
    }

    /**
     * Scope pour les clients actifs.
     */
    public function scopeActifs($query)
    {
        return $query->where('actif', true);
    }

    /**
     * Scope pour rechercher par nom ou prénom.
     */
    public function scopeRechercheNom($query, $terme)
    {
        return $query->where(function ($q) use ($terme) {
            $q->where('nom', 'LIKE', "%{$terme}%")
              ->orWhere('prenom', 'LIKE', "%{$terme}%");
        });
    }

    /**
     * Scope pour les clients d'une entreprise.
     */
    public function scopeParEntreprise($query, $entrepriseId)
    {
        return $query->where('entreprise_id', $entrepriseId);
    }

    /**
     * Obtenir le total des devis acceptés du client.
     */
    public function getTotalDevisAcceptesAttribute(): float
    {
        return $this->devis()
                    ->where('statut', 'accepte')
                    ->sum('montant_ttc');
    }

    /**
     * Obtenir le nombre de devis en attente.
     */
    public function getNombreDevisEnAttenteAttribute(): int
    {
        return $this->devis()
                    ->whereIn('statut', ['brouillon', 'envoye'])
                    ->count();
    }
}
