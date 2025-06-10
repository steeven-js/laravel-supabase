<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Devis extends Model
{
    /**
     * Les attributs qui peuvent être assignés en masse.
     */
    protected $fillable = [
        'numero_devis',
        'client_id',
        'date_devis',
        'date_validite',
        'statut',
        'objet',
        'description',
        'montant_ht',
        'taux_tva',
        'montant_tva',
        'montant_ttc',
        'conditions',
        'notes',
        'date_acceptation',
        'archive',
    ];

    /**
     * Les attributs qui doivent être castés.
     */
    protected $casts = [
        'date_devis' => 'date',
        'date_validite' => 'date',
        'date_acceptation' => 'date',
        'montant_ht' => 'decimal:2',
        'taux_tva' => 'decimal:2',
        'montant_tva' => 'decimal:2',
        'montant_ttc' => 'decimal:2',
        'archive' => 'boolean',
    ];

    /**
     * Relation avec le client.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Scope pour les devis non archivés.
     */
    public function scopeActifs($query)
    {
        return $query->where('archive', false);
    }

    /**
     * Scope par statut.
     */
    public function scopeParStatut($query, $statut)
    {
        return $query->where('statut', $statut);
    }

    /**
     * Scope pour les devis expirés.
     */
    public function scopeExpires($query)
    {
        return $query->where('date_validite', '<', now())
                    ->where('statut', '!=', 'accepte');
    }

    /**
     * Scope pour les devis d'un client.
     */
    public function scopeParClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    /**
     * Vérifier si le devis est expiré.
     */
    public function getEstExpireAttribute(): bool
    {
        return $this->date_validite < now() && $this->statut !== 'accepte';
    }

    /**
     * Calculer automatiquement les montants.
     */
    public function calculerMontants(): void
    {
        $this->montant_tva = ($this->montant_ht * $this->taux_tva) / 100;
        $this->montant_ttc = $this->montant_ht + $this->montant_tva;
    }

    /**
     * Générer un numéro de devis automatique.
     */
    public static function genererNumeroDevis(): string
    {
        $annee = date('Y');
        $dernierNumero = static::where('numero_devis', 'LIKE', "DEV-{$annee}-%")
                              ->orderBy('numero_devis', 'desc')
                              ->first();

        if ($dernierNumero) {
            $dernierNum = (int) substr($dernierNumero->numero_devis, -4);
            $nouveauNum = $dernierNum + 1;
        } else {
            $nouveauNum = 1;
        }

        return sprintf('DEV-%s-%04d', $annee, $nouveauNum);
    }

    /**
     * Accepter le devis.
     */
    public function accepter(): bool
    {
        $this->statut = 'accepte';
        $this->date_acceptation = now();
        return $this->save();
    }

    /**
     * Refuser le devis.
     */
    public function refuser(): bool
    {
        $this->statut = 'refuse';
        return $this->save();
    }

    /**
     * Marquer comme expiré automatiquement.
     */
    public function marquerExpire(): bool
    {
        if ($this->est_expire && $this->statut !== 'accepte') {
            $this->statut = 'expire';
            return $this->save();
        }
        return false;
    }

    /**
     * Obtenir le statut en français.
     */
    public function getStatutFrAttribute(): string
    {
        return match($this->statut) {
            'brouillon' => 'Brouillon',
            'envoye' => 'Envoyé',
            'accepte' => 'Accepté',
            'refuse' => 'Refusé',
            'expire' => 'Expiré',
            default => ucfirst($this->statut)
        };
    }
}
