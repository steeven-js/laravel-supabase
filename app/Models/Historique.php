<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Auth;

class Historique extends Model
{
    use HasFactory;

    protected $table = 'historique';

    // Pas de updated_at car on ne modifie jamais un historique
    public $timestamps = false;

    protected $fillable = [
        'entite_type',
        'entite_id',
        'action',
        'titre',
        'description',
        'donnees_avant',
        'donnees_apres',
        'donnees_supplementaires',
        'user_id',
        'user_nom',
        'user_email',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'donnees_avant' => 'array',
        'donnees_apres' => 'array',
        'donnees_supplementaires' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Relation polymorphe vers l'entité concernée
     */
    public function entite(): MorphTo
    {
        return $this->morphTo('entite', 'entite_type', 'entite_id');
    }

    /**
     * Relation vers l'utilisateur qui a effectué l'action
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope pour filtrer par type d'entité
     */
    public function scopeForEntity($query, $entityType, $entityId = null)
    {
        $query->where('entite_type', $entityType);

        if ($entityId) {
            $query->where('entite_id', $entityId);
        }

        return $query;
    }

    /**
     * Scope pour filtrer par action
     */
    public function scopeAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope pour filtrer par utilisateur
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope pour ordre chronologique (plus récent en premier)
     */
    public function scopeChronologique($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Méthode statique pour créer un historique facilement
     */
    public static function enregistrer(
        Model $entite,
        string $action,
        string $titre,
        ?string $description = null,
        ?array $donneesAvant = null,
        ?array $donneesApres = null,
        ?array $donneesSupplementaires = null,
        ?User $user = null
        ): self {
        $user = $user ?? Auth::user();

        if (!$user) {
            throw new \Exception('Aucun utilisateur authentifié pour enregistrer l\'historique');
        }

        return self::create([
            'entite_type' => get_class($entite),
            'entite_id' => $entite->id,
            'action' => $action,
            'titre' => $titre,
            'description' => $description,
            'donnees_avant' => $donneesAvant,
            'donnees_apres' => $donneesApres,
            'donnees_supplementaires' => $donneesSupplementaires,
            'user_id' => $user->id,
            'user_nom' => $user->nom . ' ' . $user->prenom,
            'user_email' => $user->email,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }

    /**
     * Obtenir une description lisible des changements
     */
    public function getChangementsAttribute(): ?string
    {
        if (!$this->donnees_avant || !$this->donnees_apres) {
            return null;
        }

        $changements = [];

        foreach ($this->donnees_apres as $champ => $nouvelleValeur) {
            $ancienneValeur = $this->donnees_avant[$champ] ?? null;

            if ($ancienneValeur !== $nouvelleValeur) {
                $changements[] = "{$champ}: '{$ancienneValeur}' → '{$nouvelleValeur}'";
            }
        }

        return empty($changements) ? null : implode(', ', $changements);
    }

    /**
     * Obtenir une icône pour l'action
     */
    public function getIconeAttribute(): string
    {
        return match ($this->action) {
            'creation' => '🆕',
            'modification' => '✏️',
            'changement_statut' => '🔄',
            'envoi_email' => '📧',
            'suppression' => '🗑️',
            'archivage' => '📦',
            'restauration' => '♻️',
            'transformation' => '🔄',
            default => '📋',
        };
    }

    /**
     * Obtenir une couleur pour l'action (pour l'affichage)
     */
    public function getCouleurAttribute(): string
    {
        return match ($this->action) {
            'creation' => 'green',
            'modification' => 'blue',
            'changement_statut' => 'orange',
            'envoi_email' => 'purple',
            'suppression' => 'red',
            'archivage' => 'gray',
            'restauration' => 'green',
            'transformation' => 'blue',
            default => 'gray',
        };
    }
}
