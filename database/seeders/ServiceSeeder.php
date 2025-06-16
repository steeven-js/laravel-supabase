<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Service;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            [
                'nom' => 'Développement site web vitrine',
                'code' => 'DEV-WEB-VITRINE',
                'description' => 'Création d\'un site web vitrine responsive avec CMS',
                'prix_ht' => 2500.00,
                'qte_defaut' => 1,
                'unite' => 'forfait',
                'actif' => true,
            ],
            [
                'nom' => 'Application web sur mesure',
                'code' => 'DEV-APP-WEB',
                'description' => 'Développement d\'une application web personnalisée (Laravel/React)',
                'prix_ht' => 8000.00,
                'qte_defaut' => 1,
                'unite' => 'forfait',
                'actif' => true,
            ],
            [
                'nom' => 'Développement API REST',
                'code' => 'DEV-API-REST',
                'description' => 'Création d\'une API REST sécurisée avec documentation',
                'prix_ht' => 3500.00,
                'qte_defaut' => 1,
                'unite' => 'forfait',
                'actif' => true,
            ],
            [
                'nom' => 'Intégration systèmes',
                'code' => 'INT-SYSTEMES',
                'description' => 'Intégration entre différents systèmes et plateformes',
                'prix_ht' => 1500.00,
                'qte_defaut' => 1,
                'unite' => 'forfait',
                'actif' => true,
            ],
            [
                'nom' => 'Maintenance mensuelle',
                'code' => 'MAINT-MENSUELLE',
                'description' => 'Maintenance et support technique mensuel',
                'prix_ht' => 350.00,
                'qte_defaut' => 12,
                'unite' => 'mois',
                'actif' => true,
            ],
            [
                'nom' => 'Formation utilisateurs',
                'code' => 'FORM-USERS',
                'description' => 'Formation des utilisateurs finaux (par journée)',
                'prix_ht' => 450.00,
                'qte_defaut' => 2,
                'unite' => 'journee',
                'actif' => true,
            ],
            [
                'nom' => 'Audit de sécurité',
                'code' => 'AUDIT-SECU',
                'description' => 'Audit de sécurité complet avec rapport détaillé',
                'prix_ht' => 1200.00,
                'qte_defaut' => 1,
                'unite' => 'forfait',
                'actif' => true,
            ],
            [
                'nom' => 'Optimisation performances',
                'code' => 'OPTIM-PERF',
                'description' => 'Optimisation des performances et de la vitesse',
                'prix_ht' => 800.00,
                'qte_defaut' => 1,
                'unite' => 'forfait',
                'actif' => true,
            ],
            [
                'nom' => 'Migration de données',
                'code' => 'MIG-DONNEES',
                'description' => 'Migration sécurisée de données entre systèmes',
                'prix_ht' => 1800.00,
                'qte_defaut' => 1,
                'unite' => 'forfait',
                'actif' => true,
            ],
            [
                'nom' => 'Design UX/UI',
                'code' => 'DESIGN-UX-UI',
                'description' => 'Conception d\'interface utilisateur et expérience utilisateur',
                'prix_ht' => 2200.00,
                'qte_defaut' => 1,
                'unite' => 'forfait',
                'actif' => true,
            ],
            [
                'nom' => 'Consultation technique',
                'code' => 'CONSEIL-TECH',
                'description' => 'Consultation technique et conseils stratégiques (par heure)',
                'prix_ht' => 85.00,
                'qte_defaut' => 8,
                'unite' => 'heure',
                'actif' => true,
            ],
            [
                'nom' => 'Hébergement premium',
                'code' => 'HEBERGEMENT-PREMIUM',
                'description' => 'Hébergement haute performance avec support 24/7 (par mois)',
                'prix_ht' => 150.00,
                'qte_defaut' => 12,
                'unite' => 'mois',
                'actif' => true,
            ],
        ];

        foreach ($services as $service) {
            Service::firstOrCreate(
                ['code' => $service['code']], // Recherche par code unique
                $service // Données à créer si n'existe pas
            );
        }
    }
}
