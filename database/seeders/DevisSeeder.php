<?php

namespace Database\Seeders;

use App\Models\Devis;
use App\Models\Client;
use App\Models\Service;
use App\Models\LigneDevis;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use Carbon\Carbon;

class DevisSeeder extends Seeder
{
    private $numeroCounters = [];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('fr_FR');

        // Récupérer les clients et services actifs
        $clients = Client::where('actif', true)->get();
        $services = Service::where('actif', true)->get();

        if ($clients->count() === 0) {
            $this->command->warn('Aucun client actif trouvé. Créez des clients d\'abord.');
            return;
        }

        if ($services->count() === 0) {
            $this->command->warn('Aucun service actif trouvé. Créez des services d\'abord.');
            return;
        }

        // Créer 60 devis variés
        for ($i = 0; $i < 60; $i++) {
            $client = $clients->random();

            // Calculer les dates
            if ($i < 45) {
                $dateDevis = $faker->dateTimeBetween('-2 months', 'now');
            } else {
                $dateDevis = $faker->dateTimeBetween('-6 months', '-2 months');
            }

            $dateValidite = (clone $dateDevis)->modify('+30 days');

            // Déterminer le statut en fonction de la date
            $statut = $this->determinerStatut($faker, $dateValidite, $i);

            // Déterminer le statut d'envoi
            $statutEnvoi = match($statut) {
                'brouillon' => 'non_envoye',
                'accepte' => 'envoye',
                'envoye' => $faker->randomElement(['envoye', 'non_envoye']),
                'refuse' => $faker->randomElement(['envoye', 'echec_envoi']),
                'expire' => $faker->randomElement(['envoye', 'non_envoye', 'echec_envoi']),
                default => 'non_envoye'
            };

            // Sélectionner les services pour ce devis (1 à 4 services)
            $servicesDevis = $services->random($faker->numberBetween(1, 4));
            $premierService = $servicesDevis->first();

            // Créer le devis
            $devis = Devis::create([
                'numero_devis' => $this->genererNumeroDevis($dateDevis),
                'client_id' => $client->id,
                'date_devis' => $dateDevis,
                'date_validite' => $dateValidite,
                'statut' => $statut,
                'statut_envoi' => $statutEnvoi,
                'objet' => $this->genererObjet($servicesDevis),
                'description' => $this->genererDescription($servicesDevis),
                'montant_ht' => 0, // Sera calculé à partir des lignes
                'taux_tva' => 20.0, // Valeur par défaut, sera recalculée
                'montant_tva' => 0,
                'montant_ttc' => 0,
                'conditions' => $this->genererConditions($faker),
                'notes' => $faker->optional(0.4)->sentence(),
                'date_acceptation' => $statut === 'accepte' ?
                    $faker->dateTimeBetween($dateDevis, $dateValidite) : null,
                'date_envoi_client' => $statutEnvoi === 'envoye' ?
                    $faker->dateTimeBetween($dateDevis, min($dateValidite, now())) : null,
                'date_envoi_admin' => $statutEnvoi === 'envoye' ?
                    $faker->dateTimeBetween($dateDevis, min($dateValidite, now())) : null,
                'archive' => $faker->boolean(3),
            ]);

            // Créer les lignes de services pour ce devis
            $ordre = 1;
            foreach ($servicesDevis as $service) {
                $quantite = $this->determinerQuantite($faker, $service);
                $prixUnitaire = $this->ajusterPrixService($faker, $service->prix_ht);
                $tauxTva = $faker->randomElement([20.0, 10.0, 5.5]);

                LigneDevis::create([
                    'devis_id' => $devis->id,
                    'service_id' => $service->id,
                    'quantite' => $quantite,
                    'prix_unitaire_ht' => $prixUnitaire,
                    'taux_tva' => $tauxTva,
                    'ordre' => $ordre++,
                    'description_personnalisee' => $faker->optional(0.3)->text(100),
                ]);
            }

            // Recalculer les montants totaux du devis
            $devis->calculerMontants();
            $devis->save();
        }

        // Créer quelques devis de démonstration
        $this->creerDevisDemo($clients, $services, $faker);
    }

    /**
     * Détermine le statut du devis
     */
    private function determinerStatut($faker, $dateValidite, $index): string
    {
        $now = Carbon::now();

        if ($index < 45) {
            return $faker->randomElement([
                'brouillon', 'brouillon', 'brouillon', 'brouillon', 'brouillon',
                'brouillon', 'brouillon', 'brouillon', 'brouillon', 'brouillon',
                'envoye', 'envoye',
            ]);
        }

        if ($dateValidite < $now) {
            return $faker->randomElement([
                'brouillon', 'brouillon', 'brouillon', 'brouillon',
                'expire', 'expire', 'expire',
                'accepte',
                'refuse', 'refuse',
            ]);
        }

        return $faker->randomElement([
            'brouillon', 'brouillon', 'brouillon',
            'envoye',
            'accepte',
            'refuse',
        ]);
    }

    /**
     * Génère un objet de devis basé sur les services
     */
    private function genererObjet($services): string
    {
        if ($services->count() === 1) {
            return $services->first()->nom;
        }

        $nomsServices = $services->pluck('nom')->take(2)->toArray();
        $objet = implode(' + ', $nomsServices);

        if ($services->count() > 2) {
            $objet .= ' + autres prestations';
        }

        return $objet;
    }

    /**
     * Génère une description basée sur les services
     */
    private function genererDescription($services): string
    {
        $descriptions = $services->pluck('description')->toArray();

        if (count($descriptions) === 1) {
            return $descriptions[0];
        }

        return "Prestation comprenant :\n" . implode("\n", array_map(function($desc, $index) {
            return "• " . $desc;
        }, $descriptions, array_keys($descriptions)));
    }

    /**
     * Détermine la quantité selon le type de service
     */
    private function determinerQuantite($faker, $service): int
    {
        // Utiliser la quantité par défaut du service avec variation
        $baseQte = $service->qte_defaut;

        // Pour certains services, ajouter de la variabilité
        if (in_array($service->code, ['CONSEIL-TECH', 'FORM-USERS', 'MAINT-MENSUELLE', 'HEBERGEMENT-PREMIUM'])) {
            return $faker->numberBetween(max(1, $baseQte - 2), $baseQte + 5);
        }

        return $faker->numberBetween(max(1, $baseQte - 1), $baseQte + 1);
    }

    /**
     * Ajuste le prix du service avec une variation réaliste
     */
    private function ajusterPrixService($faker, $prixBase): float
    {
        // Variation de ±15% sur le prix de base
        $variation = $faker->randomFloat(2, -15, 15);
        $nouveauPrix = $prixBase * (1 + $variation / 100);

        return max(0, $nouveauPrix);
    }

    /**
     * Génère un numéro de devis basé sur la date
     */
    private function genererNumeroDevis($date): string
    {
        $annee = $date->format('Y');
        $mois = $date->format('m');

        // Créer un numéro unique basé sur le timestamp et un compteur aléatoire
        $timestamp = time();
        $random = mt_rand(100, 999);
        $tentatives = 0;

        do {
            // Utiliser une approche plus simple avec un compteur basé sur l'heure
            $numero = sprintf('DEV-%s-%s-%03d', $annee, $mois, ($timestamp + $random + $tentatives) % 1000);

            // Vérifier que le numéro n'existe pas déjà
            $exists = \App\Models\Devis::where('numero_devis', $numero)->exists();

            if ($exists) {
                $tentatives++;
                // Si on a trop de tentatives, changer complètement l'approche
                if ($tentatives > 50) {
                    $numero = sprintf('DEV-%s-%s-%s%03d', $annee, $mois, substr(uniqid(), -2), $tentatives);
                    $exists = \App\Models\Devis::where('numero_devis', $numero)->exists();
                }
            }

            // Sécurité pour éviter une boucle infinie
            if ($tentatives > 100) {
                throw new \Exception("Impossible de générer un numéro de devis unique après 100 tentatives pour {$annee}-{$mois}");
            }

        } while ($exists);

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
     * Crée des devis de démonstration
     */
    private function creerDevisDemo($clients, $services, $faker): void
    {
        // Devis accepté pour démonstration
        $clientDemo = $clients->random();
        $serviceApp = $services->where('code', 'DEV-APP-WEB')->first();
        $serviceApi = $services->where('code', 'DEV-API-REST')->first();

        $devis = Devis::create([
            'numero_devis' => $this->genererNumeroDevis(now()->subDays(5)),
            'client_id' => $clientDemo->id,
            'date_devis' => now()->subDays(5),
            'date_validite' => now()->addDays(25),
            'statut' => 'accepte',
            'statut_envoi' => 'envoye',
            'objet' => 'Application web + API',
            'description' => 'Développement complet d\'une application web avec API REST.',
            'montant_ht' => 0,
            'taux_tva' => 20.0,
            'montant_tva' => 0,
            'montant_ttc' => 0,
            'conditions' => 'Devis valable 30 jours. Paiement en 3 fois.',
            'notes' => 'Client prioritaire',
            'date_acceptation' => now()->subDays(2),
            'date_envoi_client' => now()->subDays(4),
            'date_envoi_admin' => now()->subDays(4),
            'archive' => false,
        ]);

        // Ajouter les lignes
        if ($serviceApp) {
            LigneDevis::create([
                'devis_id' => $devis->id,
                'service_id' => $serviceApp->id,
                'quantite' => 1,
                'prix_unitaire_ht' => $serviceApp->prix_ht,
                'taux_tva' => 20.0,
                'ordre' => 1,
            ]);
        }

        if ($serviceApi) {
            LigneDevis::create([
                'devis_id' => $devis->id,
                'service_id' => $serviceApi->id,
                'quantite' => 1,
                'prix_unitaire_ht' => $serviceApi->prix_ht,
                'taux_tva' => 20.0,
                'ordre' => 2,
            ]);
        }

        $devis->calculerMontants();
        $devis->save();

        // Créer quelques brouillons récents
        for ($i = 0; $i < 8; $i++) {
            $client = $clients->random();
            $service = $services->random();

            $devis = Devis::create([
                'numero_devis' => $this->genererNumeroDevis(now()->subDays(rand(1, 15))),
                'client_id' => $client->id,
                'date_devis' => now()->subDays(rand(1, 15)),
                'date_validite' => now()->addDays(rand(15, 30)),
                'statut' => 'brouillon',
                'statut_envoi' => 'non_envoye',
                'objet' => $service->nom,
                'description' => $service->description,
                'montant_ht' => 0,
                'taux_tva' => 20.0,
                'montant_tva' => 0,
                'montant_ttc' => 0,
                'conditions' => 'Conditions en cours de définition.',
                'notes' => $faker->optional(0.7)->sentence(),
                'archive' => false,
            ]);

            // Ajouter une ligne de service
            LigneDevis::create([
                'devis_id' => $devis->id,
                'service_id' => $service->id,
                'quantite' => $service->qte_defaut,
                'prix_unitaire_ht' => $service->prix_ht,
                'taux_tva' => 20.0,
                'ordre' => 1,
            ]);

            $devis->calculerMontants();
            $devis->save();
        }
    }
}
