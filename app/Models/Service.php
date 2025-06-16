<?php

namespace App\Models;

use App\Traits\HasHistorique;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory, HasHistorique;

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

    /**
     * Générer automatiquement le code au format SRV-25-001
     */
    public static function genererCodeService(): string
    {
        $annee = date('y'); // Année sur 2 digits (25)

        // Trouver le prochain ID disponible
        $dernierService = self::orderBy('id', 'desc')->first();
        $prochainId = $dernierService ? $dernierService->id + 1 : 1;

        // Formater l'ID sur 3 digits
        $id = str_pad($prochainId, 3, '0', STR_PAD_LEFT);

        return "SRV-{$annee}-{$id}";
    }

    /**
     * Boot du modèle pour générer automatiquement le code
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($service) {
            // Générer automatiquement le code si pas fourni
            if (empty($service->code)) {
                $service->code = self::genererCodeService();
            }
        });

        static::created(function ($service) {
            // Mettre à jour le code avec l'ID réel après création
            $annee = date('y');
            $id = str_pad($service->id, 3, '0', STR_PAD_LEFT);
            $nouveauCode = "SRV-{$annee}-{$id}";

            if ($service->code !== $nouveauCode) {
                $service->update(['code' => $nouveauCode]);
            }
        });
    }
}
