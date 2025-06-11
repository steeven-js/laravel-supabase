<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Facture extends Model
{
    /**
     * Les attributs qui peuvent être assignés en masse.
     */
    protected $fillable = [
        'numero_facture',
        'devis_id',
        'client_id',
        'date_facture',
        'date_echeance',
        'statut',
        'objet',
        'description',
        'montant_ht',
        'taux_tva',
        'montant_tva',
        'montant_ttc',
        'conditions_paiement',
        'notes',
        'date_paiement',
        'mode_paiement',
        'reference_paiement',
        'archive',
        'date_envoi_client',
        'date_envoi_admin',
    ];

    /**
     * Les attributs qui doivent être castés.
     */
    protected $casts = [
        'date_facture' => 'date',
        'date_echeance' => 'date',
        'date_paiement' => 'date',
        'montant_ht' => 'decimal:2',
        'taux_tva' => 'decimal:2',
        'montant_tva' => 'decimal:2',
        'montant_ttc' => 'decimal:2',
        'archive' => 'boolean',
        'date_envoi_client' => 'datetime',
        'date_envoi_admin' => 'datetime',
    ];

    /**
     * Relation avec le devis d'origine.
     */
    public function devis(): BelongsTo
    {
        return $this->belongsTo(Devis::class);
    }

    /**
     * Relation avec le client.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Scope pour les factures non archivées.
     */
    public function scopeActives($query)
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
     * Scope pour les factures en retard.
     */
    public function scopeEnRetard($query)
    {
        return $query->where('date_echeance', '<', now())
                    ->whereIn('statut', ['envoyee', 'brouillon']);
    }

    /**
     * Scope pour les factures d'un client.
     */
    public function scopeParClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    /**
     * Vérifier si la facture est en retard.
     */
    public function getEstEnRetardAttribute(): bool
    {
        return $this->date_echeance < now() &&
               in_array($this->statut, ['envoyee', 'brouillon']);
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
     * Générer un numéro de facture automatique.
     */
    public static function genererNumeroFacture(): string
    {
        $annee = date('Y');
        $dernierNumero = static::where('numero_facture', 'LIKE', "FACT-{$annee}-%")
                              ->orderBy('numero_facture', 'desc')
                              ->first();

        if ($dernierNumero) {
            $dernierNum = (int) substr($dernierNumero->numero_facture, -4);
            $nouveauNum = $dernierNum + 1;
        } else {
            $nouveauNum = 1;
        }

        return sprintf('FACT-%s-%04d', $annee, $nouveauNum);
    }

    /**
     * Créer une facture à partir d'un devis.
     */
    public static function creerDepuisDevis(Devis $devis): self
    {
        $facture = new self([
            'numero_facture' => self::genererNumeroFacture(),
            'devis_id' => $devis->id,
            'client_id' => $devis->client_id,
            'date_facture' => now()->toDateString(),
            'date_echeance' => now()->addDays(30)->toDateString(), // 30 jours par défaut
            'statut' => 'brouillon',
            'objet' => $devis->objet,
            'description' => $devis->description,
            'montant_ht' => $devis->montant_ht,
            'taux_tva' => $devis->taux_tva,
            'conditions_paiement' => $devis->conditions,
            'notes' => $devis->notes,
        ]);

        $facture->calculerMontants();
        $facture->save();

        return $facture;
    }

    /**
     * Marquer comme payée.
     */
    public function marquerPayee(string $modePaiement = null, string $reference = null): bool
    {
        $this->statut = 'payee';
        $this->date_paiement = now()->toDateString();
        $this->mode_paiement = $modePaiement;
        $this->reference_paiement = $reference;

        return $this->save();
    }

    /**
     * Envoyer la facture (marquer comme envoyée).
     */
    public function marquerEnvoyee(): bool
    {
        $this->statut = 'envoyee';
        $this->date_envoi_client = now();

        return $this->save();
    }

    /**
     * Obtenir le statut en français.
     */
    public function getStatutFrAttribute(): string
    {
        return match($this->statut) {
            'brouillon' => 'Brouillon',
            'envoyee' => 'Envoyée',
            'payee' => 'Payée',
            'en_retard' => 'En retard',
            'annulee' => 'Annulée',
            default => ucfirst($this->statut)
        };
    }

    /**
     * Obtenir la couleur du statut pour l'interface.
     */
    public function getCouleurStatutAttribute(): string
    {
        return match($this->statut) {
            'brouillon' => 'gray',
            'envoyee' => 'blue',
            'payee' => 'green',
            'en_retard' => 'red',
            'annulee' => 'gray',
            default => 'gray'
        };
    }
}
