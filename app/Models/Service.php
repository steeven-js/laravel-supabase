<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'code',
        'description',
        'prix_ht',
        'qte_defaut',
        'actif',
    ];

    protected $casts = [
        'prix_ht' => 'decimal:2',
        'qte_defaut' => 'integer',
        'actif' => 'boolean',
    ];

    /**
     * Les lignes de devis qui utilisent ce service
     */
    public function lignesDevis(): HasMany
    {
        return $this->hasMany(LigneDevis::class);
    }

    /**
     * Les lignes de factures qui utilisent ce service
     */
    public function lignesFactures(): HasMany
    {
        return $this->hasMany(LigneFacture::class);
    }

    /**
     * Scope pour les services actifs seulement
     */
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    /**
     * Scope pour rechercher par nom ou code
     */
    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('nom', 'like', '%' . $term . '%')
              ->orWhere('code', 'like', '%' . $term . '%')
              ->orWhere('description', 'like', '%' . $term . '%');
        });
    }
}
