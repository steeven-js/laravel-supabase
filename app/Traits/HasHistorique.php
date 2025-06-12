<?php

namespace App\Traits;

use App\Models\Historique;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Auth;

trait HasHistorique
{
    /**
     * Relation polymorphe vers l'historique
     */
    public function historique(): MorphMany
    {
        return $this->morphMany(Historique::class, 'entite', 'entite_type', 'entite_id')
                    ->chronologique();
    }

    /**
     * Enregistrer une action dans l'historique
     */
    public function enregistrerHistorique(
        string $action,
        string $titre,
        ?string $description = null,
        ?array $donneesAvant = null,
        ?array $donneesApres = null,
        ?array $donneesSupplementaires = null
    ): Historique {
        return Historique::enregistrer(
            $this,
            $action,
            $titre,
            $description,
            $donneesAvant,
            $donneesApres,
            $donneesSupplementaires
        );
    }

    /**
     * Obtenir l'historique de création
     */
    public function getHistoriqueCreation(): ?Historique
    {
        return $this->historique()->action('creation')->first();
    }

    /**
     * Obtenir l'historique des modifications
     */
    public function getHistoriqueModifications()
    {
        return $this->historique()->action('modification')->get();
    }

    /**
     * Obtenir l'historique des changements de statut
     */
    public function getHistoriqueStatuts()
    {
        return $this->historique()->action('changement_statut')->get();
    }

    /**
     * Obtenir l'historique des envois d'emails
     */
    public function getHistoriqueEmails()
    {
        return $this->historique()->action('envoi_email')->get();
    }

    /**
     * Boot trait pour ajouter les événements automatiques
     */
    protected static function bootHasHistorique(): void
    {
        // Enregistrer la création automatiquement
        static::created(function ($model) {
            if (Auth::check()) {
                $model->enregistrerHistorique(
                    'creation',
                    "Création de " . class_basename($model) . " #{$model->id}",
                    "Nouvel enregistrement créé",
                    null,
                    $model->getAttributes()
                );
            }
        });

        // Enregistrer les modifications automatiquement
        static::updated(function ($model) {
            if (Auth::check() && $model->wasChanged()) {
                $changes = [];
                $original = [];

                foreach ($model->getChanges() as $key => $newValue) {
                    if ($key !== 'updated_at') {
                        $changes[$key] = $newValue;
                        $original[$key] = $model->getOriginal($key);
                    }
                }

                if (!empty($changes)) {
                    $model->enregistrerHistorique(
                        'modification',
                        "Modification de " . class_basename($model) . " #{$model->id}",
                        "Données mises à jour",
                        $original,
                        $changes
                    );
                }
            }
        });

        // Enregistrer la suppression automatiquement
        static::deleted(function ($model) {
            if (Auth::check()) {
                $model->enregistrerHistorique(
                    'suppression',
                    "Suppression de " . class_basename($model) . " #{$model->id}",
                    "Enregistrement supprimé",
                    $model->getAttributes(),
                    null
                );
            }
        });
    }
}
