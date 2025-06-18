<?php

namespace App\Models;

use App\Traits\HasHistorique;
use App\Traits\SendsNotifications;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entreprise extends Model
{
    use HasHistorique, SendsNotifications;

    /**
     * Les attributs qui peuvent être assignés en masse.
     */
    protected $fillable = [
        'nom',
        'nom_commercial',
        'siret',
        'siren',
        'secteur_activite',
        'adresse',
        'ville',
        'code_postal',
        'pays',
        'telephone',
        'email',
        'site_web',
        'active',
        'notes',
    ];

    /**
     * Les attributs qui doivent être castés.
     */
    protected $casts = [
        'active' => 'boolean',
    ];

    /**
     * Relation avec les clients.
     */
    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }

    /**
     * Scope pour les entreprises actives.
     */
    public function scopeActives($query)
    {
        return $query->where('active', true);
    }

    /**
     * Scope pour rechercher par nom.
     */
    public function scopeRechercheNom($query, $terme)
    {
        return $query->where(function ($q) use ($terme) {
            $q->where('nom', 'LIKE', "%{$terme}%")
              ->orWhere('nom_commercial', 'LIKE', "%{$terme}%");
        });
    }

    /**
     * Scope par secteur d'activité.
     */
    public function scopeParSecteur($query, $secteur)
    {
        return $query->where('secteur_activite', $secteur);
    }

    /**
     * Retourne le nom d'affichage (commercial ou nom).
     */
    public function getNomAffichageAttribute(): string
    {
        return $this->nom_commercial ?: $this->nom;
    }

    /**
     * Retourne l'adresse complète.
     */
    public function getAdresseCompleteAttribute(): string
    {
        $adresse = $this->adresse;
        if ($this->ville) {
            $adresse .= ($adresse ? ', ' : '') . $this->code_postal . ' ' . $this->ville;
        }
        if ($this->pays && $this->pays !== 'France') {
            $adresse .= ', ' . $this->pays;
        }
        return $adresse;
    }
}
