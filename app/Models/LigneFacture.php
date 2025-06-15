<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LigneFacture extends Model
{
    use HasFactory;

    protected $table = 'lignes_factures';

    protected $fillable = [
        'facture_id',
        'service_id',
        'quantite',
        'prix_unitaire_ht',
        'taux_tva',
        'montant_ht',
        'montant_tva',
        'montant_ttc',
        'ordre',
        'description_personnalisee',
    ];

    protected $casts = [
        'quantite' => 'integer',
        'prix_unitaire_ht' => 'decimal:2',
        'taux_tva' => 'decimal:2',
        'montant_ht' => 'decimal:2',
        'montant_tva' => 'decimal:2',
        'montant_ttc' => 'decimal:2',
        'ordre' => 'integer',
    ];

    /**
     * La facture à laquelle appartient cette ligne
     */
    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class);
    }

    /**
     * Le service référencé par cette ligne
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Calculer automatiquement les montants lors de la sauvegarde
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($ligne) {
            $ligne->montant_ht = $ligne->quantite * $ligne->prix_unitaire_ht;
            $ligne->montant_tva = $ligne->montant_ht * ($ligne->taux_tva / 100);
            $ligne->montant_ttc = $ligne->montant_ht + $ligne->montant_tva;
        });
    }

    /**
     * Scope pour ordonner les lignes
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('ordre');
    }
}
