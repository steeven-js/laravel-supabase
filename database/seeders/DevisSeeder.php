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
        $baseQte = $service->qte_defaut ?? 1;

        // Pour certains services, ajouter de la variabilité
        if (in_array($service->code, ['CONSEIL-TECH', 'FORM-USERS', 'MAINT-MENSUELLE', 'HEBERGEMENT-PREMIUM'])) {
            return $faker->numberBetween(max(1, $baseQte - 2), $baseQte + 5);
        }

        return $faker->numberBetween(max(1, $baseQte - 1), $baseQte + 1);
    }

    /**
     * Ajuste le prix d'un service avec variation
     */
    private function ajusterPrixService($faker, $prixBase): float
    {
        // Variation de ±20% du prix de base
        $variation = $faker->randomFloat(2, 0.8, 1.2);
        return round($prixBase * $variation, 2);
    }

    /**
     * Génère un numéro de devis unique
     */
    private function genererNumeroDevis($date): string
    {
        $annee = $date->format('Y');
        $mois = $date->format('m');

        if (!isset($this->numeroCounters[$annee][$mois])) {
            // Trouver le dernier numéro pour ce mois
            $dernierDevis = Devis::where('numero_devis', 'LIKE', "DEV-{$annee}{$mois}-%")
                ->orderBy('numero_devis', 'desc')
                ->first();

            if ($dernierDevis) {
                preg_match('/DEV-\d{6}-(\d+)$/', $dernierDevis->numero_devis, $matches);
                $this->numeroCounters[$annee][$mois] = (int)($matches[1] ?? 0);
            } else {
                $this->numeroCounters[$annee][$mois] = 0;
            }
        }

        $this->numeroCounters[$annee][$mois]++;

        return sprintf('DEV-%s%s-%03d', $annee, $mois, $this->numeroCounters[$annee][$mois]);
    }

    /**
     * Génère des conditions générales
     */
    private function genererConditions($faker): string
    {
        $conditions = [
            "Validité de l'offre : 30 jours à compter de la date d'émission.",
            "Acompte de 30% à la commande, solde à la livraison.",
            "Délai de livraison : sous réserve d'acceptation du devis et de réception de l'acompte.",
            "TVA en sus au taux en vigueur.",
            "Règlement par virement bancaire ou chèque.",
            "En cas de retard de paiement, des pénalités pourront être appliquées."
        ];

        return implode("\n", $faker->randomElements($conditions, $faker->numberBetween(3, 6)));
    }

    /**
     * Crée des devis de démonstration avec des données spécifiques
     */
    private function creerDevisDemo($clients, $services, $faker): void
    {
        // Créer 3 devis de démonstration avec des montants significatifs
        for ($i = 0; $i < 3; $i++) {
            $client = $clients->random();
            $dateDevis = $faker->dateTimeBetween('-1 month', 'now');
            $dateValidite = (clone $dateDevis)->modify('+30 days');

            $statutsDemo = ['envoye', 'accepte', 'brouillon'];
            $statut = $statutsDemo[$i];

            $statutEnvoi = match($statut) {
                'brouillon' => 'non_envoye',
                'accepte' => 'envoye',
                'envoye' => 'envoye',
                default => 'non_envoye'
            };

            // Sélectionner 2-3 services premium
            $servicesDemo = $services->random($faker->numberBetween(2, 3));

            $devis = Devis::create([
                'numero_devis' => $this->genererNumeroDevis($dateDevis),
                'client_id' => $client->id,
                'date_devis' => $dateDevis,
                'date_validite' => $dateValidite,
                'statut' => $statut,
                'statut_envoi' => $statutEnvoi,
                'objet' => 'Projet de développement web complet',
                'description' => 'Développement d\'une application web sur mesure avec interface moderne et fonctionnalités avancées.',
                'montant_ht' => 0,
                'taux_tva' => 20.0,
                'montant_tva' => 0,
                'montant_ttc' => 0,
                'conditions' => $this->genererConditions($faker),
                'notes' => 'Projet prioritaire - Contact client privilégié',
                'date_acceptation' => $statut === 'accepte' ? $faker->dateTimeBetween($dateDevis, $dateValidite) : null,
                'date_envoi_client' => in_array($statutEnvoi, ['envoye']) ? $faker->dateTimeBetween($dateDevis, now()) : null,
                'date_envoi_admin' => in_array($statutEnvoi, ['envoye']) ? $faker->dateTimeBetween($dateDevis, now()) : null,
                'archive' => false,
            ]);

            // Créer des lignes avec des montants importants
            $ordre = 1;
            foreach ($servicesDemo as $service) {
                $quantite = $faker->numberBetween(5, 20);
                $prixUnitaire = $faker->randomFloat(2, 150, 800);
                $tauxTva = 20.0;

                LigneDevis::create([
                    'devis_id' => $devis->id,
                    'service_id' => $service->id,
                    'quantite' => $quantite,
                    'prix_unitaire_ht' => $prixUnitaire,
                    'taux_tva' => $tauxTva,
                    'ordre' => $ordre++,
                    'description_personnalisee' => $faker->optional(0.5)->sentence(),
                ]);
            }

            // Recalculer les montants
            $devis->calculerMontants();
            $devis->save();
        }
    }
}
