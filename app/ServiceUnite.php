<?php

namespace App;

enum ServiceUnite: string
{
    case HEURE = 'heure';
    case JOURNEE = 'journee';
    case SEMAINE = 'semaine';
    case MOIS = 'mois';
    case UNITE = 'unite';
    case FORFAIT = 'forfait';
    case LICENCE = 'licence';

    /**
     * Retourne le libellé au singulier
     */
    public function getSingulier(): string
    {
        return match($this) {
            self::HEURE => 'heure',
            self::JOURNEE => 'journée',
            self::SEMAINE => 'semaine',
            self::MOIS => 'mois',
            self::UNITE => 'unité',
            self::FORFAIT => 'forfait',
            self::LICENCE => 'licence',
        };
    }

    /**
     * Retourne le libellé au pluriel
     */
    public function getPluriel(): string
    {
        return match($this) {
            self::HEURE => 'heures',
            self::JOURNEE => 'journées',
            self::SEMAINE => 'semaines',
            self::MOIS => 'mois',
            self::UNITE => 'unités',
            self::FORFAIT => 'forfaits',
            self::LICENCE => 'licences',
        };
    }

    /**
     * Retourne le libellé formaté selon la quantité
     */
    public function getLibelle(int $quantite): string
    {
        return $quantite <= 1 ? $this->getSingulier() : $this->getPluriel();
    }

    /**
     * Retourne tous les cas sous forme de tableau associatif
     */
    public static function toArray(): array
    {
        $cases = [];
        foreach (self::cases() as $case) {
            $cases[$case->value] = $case->getSingulier();
        }
        return $cases;
    }

    /**
     * Retourne le libellé d'affichage pour les formulaires
     */
    public function getDisplayLabel(): string
    {
        return match($this) {
            self::HEURE => 'Heure(s)',
            self::JOURNEE => 'Journée(s)',
            self::SEMAINE => 'Semaine(s)',
            self::MOIS => 'Mois',
            self::UNITE => 'Unité(s)',
            self::FORFAIT => 'Forfait(s)',
            self::LICENCE => 'Licence(s)',
        };
    }
}
