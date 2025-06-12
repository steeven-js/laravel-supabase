<?php

namespace App\Models;

use App\Traits\HasHistorique;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Devis extends Model
{
    use HasHistorique;

    /**
     * Les attributs qui peuvent être assignés en masse.
     */
    protected $fillable = [
        'numero_devis',
        'client_id',
        'date_devis',
        'date_validite',
        'statut',
        'statut_envoi',
        'pdf_file',
        'objet',
        'description',
        'montant_ht',
        'taux_tva',
        'montant_tva',
        'montant_ttc',
        'conditions',
        'notes',
        'date_acceptation',
        'date_envoi_client',
        'date_envoi_admin',
        'archive',
    ];

    /**
     * Les attributs qui doivent être castés.
     */
    protected $casts = [
        'date_devis' => 'date',
        'date_validite' => 'date',
        'date_acceptation' => 'date',
        'date_envoi_client' => 'datetime',
        'date_envoi_admin' => 'datetime',
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
     * Relation avec la facture générée à partir de ce devis.
     */
    public function facture()
    {
        return $this->hasOne(Facture::class);
    }

    /**
     * Relation avec les lignes de ce devis.
     */
    public function lignes()
    {
        return $this->hasMany(LigneDevis::class)->ordered();
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
     * Calculer automatiquement les montants à partir des lignes.
     */
    public function calculerMontants(): void
    {
        $this->load('lignes');

        $this->montant_ht = $this->lignes->sum('montant_ht');
        $this->montant_tva = $this->lignes->sum('montant_tva');
        $this->montant_ttc = $this->lignes->sum('montant_ttc');

        // Calculer le taux de TVA moyen pondéré si il y a des lignes
        if ($this->montant_ht > 0) {
            $this->taux_tva = ($this->montant_tva / $this->montant_ht) * 100;
        }
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
        $ancienStatut = $this->statut;
        $this->statut = 'accepte';
        $this->date_acceptation = now();

        $result = $this->save();

        if ($result) {
            $this->enregistrerHistorique(
                'changement_statut',
                "Devis accepté",
                "Le devis #{$this->numero_devis} a été accepté",
                ['statut' => $ancienStatut],
                ['statut' => 'accepte', 'date_acceptation' => $this->date_acceptation->format('Y-m-d H:i:s')]
            );
        }

        return $result;
    }

    /**
     * Refuser le devis.
     */
    public function refuser(): bool
    {
        $ancienStatut = $this->statut;
        $this->statut = 'refuse';

        $result = $this->save();

        if ($result) {
            $this->enregistrerHistorique(
                'changement_statut',
                "Devis refusé",
                "Le devis #{$this->numero_devis} a été refusé",
                ['statut' => $ancienStatut],
                ['statut' => 'refuse']
            );
        }

        return $result;
    }

    /**
     * Marquer comme expiré automatiquement.
     */
    public function marquerExpire(): bool
    {
        if ($this->est_expire && $this->statut !== 'accepte') {
            $ancienStatut = $this->statut;
            $this->statut = 'expire';

            $result = $this->save();

            if ($result) {
                $this->enregistrerHistorique(
                    'changement_statut',
                    "Devis expiré",
                    "Le devis #{$this->numero_devis} a expiré automatiquement",
                    ['statut' => $ancienStatut],
                    ['statut' => 'expire']
                );
            }

            return $result;
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

    /**
     * Obtenir le statut d'envoi en français.
     */
    public function getStatutEnvoiFrAttribute(): string
    {
        return match($this->statut_envoi) {
            'non_envoye' => 'Non envoyé',
            'envoye' => 'Envoyé',
            'echec_envoi' => 'Échec d\'envoi',
            default => ucfirst($this->statut_envoi)
        };
    }

    /**
     * Marquer le devis comme envoyé au client.
     */
    public function marquerEnvoye(): bool
    {
        $ancienStatut = $this->statut;
        $ancienStatutEnvoi = $this->statut_envoi;

        // Si le devis est en brouillon, il passe automatiquement en "envoyé"
        if ($this->statut === 'brouillon') {
            $this->statut = 'envoye';
        }

        $this->statut_envoi = 'envoye';
        $this->date_envoi_client = now();

        $result = $this->save();

        if ($result) {
            $changes = [
                'statut_envoi' => 'envoye',
                'date_envoi_client' => $this->date_envoi_client->format('Y-m-d H:i:s')
            ];

            $original = [
                'statut_envoi' => $ancienStatutEnvoi,
                'date_envoi_client' => null
            ];

            if ($ancienStatut !== $this->statut) {
                $changes['statut'] = $this->statut;
                $original['statut'] = $ancienStatut;
            }

            $this->enregistrerHistorique(
                'envoi_email',
                "Devis envoyé au client",
                "Le devis #{$this->numero_devis} a été envoyé avec succès au client {$this->client->nom_complet}",
                $original,
                $changes,
                [
                    'email_destinataire' => $this->client->email,
                    'type_envoi' => 'client'
                ]
            );
        }

        return $result;
    }

    /**
     * Marquer le devis comme échec d'envoi.
     */
    public function marquerEchecEnvoi(): bool
    {
        $ancienStatutEnvoi = $this->statut_envoi;
        $this->statut_envoi = 'echec_envoi';

        $result = $this->save();

        if ($result) {
            $this->enregistrerHistorique(
                'envoi_email',
                "Échec d'envoi du devis",
                "L'envoi du devis #{$this->numero_devis} au client {$this->client->nom_complet} a échoué",
                ['statut_envoi' => $ancienStatutEnvoi],
                ['statut_envoi' => 'echec_envoi'],
                [
                    'email_destinataire' => $this->client->email,
                    'type_envoi' => 'client',
                    'resultat' => 'echec'
                ]
            );
        }

        return $result;
    }

    /**
     * Vérifier si le devis peut être envoyé ou renvoyé.
     */
    public function peutEtreEnvoye(): bool
    {
        // Peut être envoyé si :
        // - Le statut permet l'envoi (brouillon ou envoyé)
        // - ET ce n'est pas un devis accepté, refusé ou expiré (ceux-ci ne doivent plus être modifiés)
        return in_array($this->statut, ['brouillon', 'envoye']);
    }

    /**
     * Vérifier si le devis peut être transformé en facture.
     */
    public function peutEtreTransformeEnFacture(): bool
    {
        return $this->statut === 'accepte' && !$this->facture()->exists();
    }

    /**
     * Transformer le devis en facture.
     */
    public function transformerEnFacture(array $parametres = []): Facture
    {
        if (!$this->peutEtreTransformeEnFacture()) {
            throw new \Exception('Ce devis ne peut pas être transformé en facture.');
        }

        // Créer la facture à partir du devis
        $facture = Facture::creerDepuisDevis($this);

        // Appliquer les paramètres personnalisés si fournis
        if (!empty($parametres)) {
            $facture->fill($parametres);
            $facture->calculerMontants();
            $facture->save();
        }

        return $facture;
    }
}
