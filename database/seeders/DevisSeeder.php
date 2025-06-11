<?php

namespace Database\Seeders;

use App\Models\Devis;
use App\Models\Client;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use Carbon\Carbon;

class DevisSeeder extends Seeder
{
    private $numeroCounter = 1;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('fr_FR');

        // Récupérer les clients actifs
        $clients = Client::where('actif', true)->get();

        if ($clients->count() === 0) {
            $this->command->warn('Aucun client actif trouvé. Créez des clients d\'abord.');
            return;
        }

        // Types de prestations réalistes
        $prestations = [
            [
                'objet' => 'Développement site web vitrine',
                'description' => 'Création d\'un site web vitrine responsive avec pages d\'accueil, services, à propos et contact. Intégration CMS pour la gestion autonome du contenu.',
                'montant_base' => [2500, 5000]
            ],
            [
                'objet' => 'Application mobile iOS/Android',
                'description' => 'Développement d\'une application mobile native pour iOS et Android avec fonctionnalités de base, interface utilisateur moderne et synchronisation cloud.',
                'montant_base' => [8000, 15000]
            ],
            [
                'objet' => 'Refonte identité visuelle',
                'description' => 'Création d\'un nouveau logo, charte graphique complète, déclinaisons supports print et digital.',
                'montant_base' => [1500, 3500]
            ],
            [
                'objet' => 'Formation équipe marketing digital',
                'description' => 'Formation complète de 3 jours sur les outils de marketing digital : SEO, SEA, réseaux sociaux, analytics.',
                'montant_base' => [3000, 6000]
            ],
            [
                'objet' => 'Audit cybersécurité',
                'description' => 'Audit complet de la sécurité informatique, test d\'intrusion, rapport détaillé et recommandations.',
                'montant_base' => [4000, 8000]
            ],
            [
                'objet' => 'E-commerce sur mesure',
                'description' => 'Développement d\'une boutique en ligne avec gestion des stocks, paiement sécurisé, interface d\'administration.',
                'montant_base' => [6000, 12000]
            ],
            [
                'objet' => 'Consultation stratégique',
                'description' => 'Accompagnement stratégique pour la transformation digitale, analyse des besoins, roadmap et plan d\'action.',
                'montant_base' => [2000, 5000]
            ],
        ];

        $statuts = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'];

        // Créer 50 devis variés
        for ($i = 0; $i < 50; $i++) {
            $prestation = $faker->randomElement($prestations);
            $client = $clients->random();

            // Calculer les dates
            $dateDevis = $faker->dateTimeBetween('-6 months', 'now');
            $dateValidite = (clone $dateDevis)->modify('+30 days');

            // Déterminer le statut en fonction de la date
            $statut = $this->determinerStatut($faker, $dateValidite);

            // Calculer les montants
            $montantHT = $faker->randomFloat(2, $prestation['montant_base'][0], $prestation['montant_base'][1]);
            $tauxTVA = $faker->randomElement([20.0, 10.0, 5.5]); // Taux TVA français
            $montantTVA = ($montantHT * $tauxTVA) / 100;
            $montantTTC = $montantHT + $montantTVA;

            // Déterminer le statut d'envoi de façon logique
            $statutEnvoi = match($statut) {
                'brouillon' => 'non_envoye', // Les brouillons ne sont jamais envoyés
                'accepte' => 'envoye', // Les devis acceptés ont forcément été envoyés
                'envoye' => $faker->randomElement(['envoye', 'non_envoye']), // Les envoyés peuvent avoir différents statuts d'envoi
                'refuse' => $faker->randomElement(['envoye', 'echec_envoi']), // Les refusés ont été envoyés ou ont échoué
                'expire' => $faker->randomElement(['envoye', 'non_envoye', 'echec_envoi']), // Les expirés peuvent avoir tous les statuts
                default => 'non_envoye'
            };

            $devis = Devis::create([
                'numero_devis' => $this->genererNumeroDevis($dateDevis),
                'client_id' => $client->id,
                'date_devis' => $dateDevis,
                'date_validite' => $dateValidite,
                'statut' => $statut,
                'statut_envoi' => $statutEnvoi,
                'objet' => $prestation['objet'],
                'description' => $prestation['description'],
                'montant_ht' => $montantHT,
                'taux_tva' => $tauxTVA,
                'montant_tva' => $montantTVA,
                'montant_ttc' => $montantTTC,
                'conditions' => $this->genererConditions($faker),
                'notes' => $faker->optional(0.4)->sentence(),
                'date_acceptation' => $statut === 'accepte' ?
                    $faker->dateTimeBetween($dateDevis, $dateValidite) : null,
                'date_envoi_client' => $statutEnvoi === 'envoye' ?
                    $faker->dateTimeBetween($dateDevis, min($dateValidite, now())) : null,
                'date_envoi_admin' => $statutEnvoi === 'envoye' ?
                    $faker->dateTimeBetween($dateDevis, min($dateValidite, now())) : null,
                'archive' => $faker->boolean(5), // 5% archivés
            ]);
        }

        // Créer quelques devis spécifiques pour les démonstrations
        $this->creerDevisDemo($clients, $faker);
    }

    /**
     * Détermine le statut du devis en fonction des dates
     */
    private function determinerStatut($faker, $dateValidite): string
    {
        $now = Carbon::now();

        // Si la date de validité est passée, le devis est expiré (sauf s'il a été accepté)
        if ($dateValidite < $now) {
            return $faker->randomElement([
                'expire', 'expire', // Plus d'expirés
                'accepte', // Peu d'acceptés même pour les anciens
                'refuse', 'refuse' // Quelques refusés
            ]);
        }

        // Pour les devis récents, distribution plus réaliste
        return $faker->randomElement([
            'brouillon', 'brouillon', 'brouillon', // Beaucoup de brouillons
            'envoye', 'envoye', 'envoye', 'envoye', // Beaucoup d'envoyés
            'accepte', // Très peu d'acceptés
            'refuse', 'refuse' // Quelques refusés
        ]);
    }

    /**
     * Génère un numéro de devis basé sur la date avec compteur global
     */
    private function genererNumeroDevis($date): string
    {
        $annee = $date->format('Y');
        $mois = $date->format('m');

        $numero = sprintf('DEV-%s-%s-%03d', $annee, $mois, $this->numeroCounter);
        $this->numeroCounter++;

        return $numero;
    }

    /**
     * Génère des conditions de devis réalistes
     */
    private function genererConditions($faker): string
    {
        $conditions = [
            "Devis valable 30 jours. Acompte de 30% à la commande, solde à la livraison.",
            "Tarif hors déplacement. TVA en sus selon taux en vigueur.",
            "Paiement à 30 jours fin de mois. Pénalités de retard : 3 fois le taux légal.",
            "Devis valable 45 jours. Paiement en 3 fois : 40% / 40% / 20%.",
            "Conditions générales de vente disponibles sur demande."
        ];

        return $faker->randomElement($conditions);
    }

    /**
     * Crée des devis de démonstration avec des données spécifiques
     */
    private function creerDevisDemo($clients, $faker): void
    {
        // Devis récent accepté (pour transformation en facture) avec un numéro unique
        $clientDemo = $clients->random();
        Devis::create([
            'numero_devis' => 'DEV-DEMO-' . time(), // Numéro unique avec timestamp
            'client_id' => $clientDemo->id,
            'date_devis' => now()->subDays(5),
            'date_validite' => now()->addDays(25),
            'statut' => 'accepte',
            'statut_envoi' => 'envoye',
            'objet' => 'Développement site e-commerce',
            'description' => 'Développement complet d\'un site e-commerce avec paiement sécurisé, gestion des stocks et interface d\'administration. Formation incluse.',
            'montant_ht' => 8500.00,
            'taux_tva' => 20.0,
            'montant_tva' => 1700.00,
            'montant_ttc' => 10200.00,
            'conditions' => 'Devis valable 30 jours. Acompte de 40% à la commande, 40% à mi-parcours, solde à la livraison.',
            'notes' => 'Client prioritaire - Livraison souhaitée avant fin de mois',
            'date_acceptation' => now()->subDays(2),
            'date_envoi_client' => now()->subDays(4),
            'date_envoi_admin' => now()->subDays(4),
            'archive' => false,
        ]);
    }
}
