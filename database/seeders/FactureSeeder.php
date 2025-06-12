<?php

namespace Database\Seeders;

use App\Models\Facture;
use App\Models\Devis;
use App\Models\Client;
use App\Models\Service;
use App\Models\LigneFacture;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use Carbon\Carbon;

class FactureSeeder extends Seeder
{
    private $numeroCounter = 1;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('fr_FR');

        // Récupérer les devis acceptés qui n'ont pas encore de facture
        $devisAcceptes = Devis::where('statut', 'accepte')
                              ->whereDoesntHave('facture')
                              ->get();

        // Créer des factures à partir des devis acceptés (utilise la méthode du modèle)
        foreach ($devisAcceptes as $devis) {
            // Utiliser la méthode du modèle Facture qui copie automatiquement les lignes
            $facture = Facture::creerDepuisDevis($devis);

            // Calculer les dates
            $dateAcceptation = $devis->date_acceptation ?? $devis->date_devis;
            $dateDebut = Carbon::parse($dateAcceptation);
            $maintenant = Carbon::now();

            if ($dateDebut->isFuture()) {
                $dateDebut = Carbon::parse($devis->date_devis);
            }

            $dateFacture = $faker->dateTimeBetween($dateDebut, $maintenant);
            $dateEcheance = (clone $dateFacture)->modify('+30 days');

            // Déterminer le statut de la facture
            $statut = $this->determinerStatutFacture($faker, $dateFacture, $dateEcheance);

            // Déterminer le statut d'envoi
            $statutEnvoi = match($statut) {
                'brouillon' => 'non_envoyee',
                'envoyee', 'payee' => 'envoyee',
                'en_retard' => $faker->randomElement(['envoyee', 'non_envoyee']),
                'annulee' => $faker->randomElement(['envoyee', 'non_envoyee', 'echec_envoi']),
                default => 'non_envoyee'
            };

            // Mettre à jour les informations de la facture créée
            $facture->update([
                'date_facture' => $dateFacture,
                'date_echeance' => $dateEcheance,
                'statut' => $statut,
                'statut_envoi' => $statutEnvoi,
                'date_paiement' => $statut === 'payee' ?
                    $faker->dateTimeBetween($dateFacture, $dateEcheance) : null,
                'mode_paiement' => $statut === 'payee' ?
                    $faker->randomElement(['Virement bancaire', 'Chèque', 'Carte bancaire', 'Espèces']) : null,
                'reference_paiement' => $statut === 'payee' ?
                    $faker->optional(0.7)->regexify('[A-Z0-9]{8,12}') : null,
                'date_envoi_client' => $statutEnvoi === 'envoyee' ?
                    $faker->dateTimeBetween($dateFacture, max($dateFacture, $maintenant)) : null,
                'date_envoi_admin' => $faker->dateTimeBetween($dateFacture, max($dateFacture, $maintenant)),
            ]);
        }

        // Créer des factures indépendantes (sans devis)
        $clients = Client::where('actif', true)->get();
        $services = Service::where('actif', true)->get();

        if ($clients->count() > 0 && $services->count() > 0) {
            $this->creerFacturesIndependantes($clients, $services, $faker, 15);
        }

        // Créer quelques factures de démonstration
        if ($clients->count() > 0 && $services->count() > 0) {
            $this->creerFacturesDemo($clients, $services, $faker);
        }
    }

    /**
     * Détermine le statut de la facture en fonction des dates
     */
    private function determinerStatutFacture($faker, $dateFacture, $dateEcheance): string
    {
        $now = Carbon::now();

        // Si la facture est récente (moins de 5 jours)
        if ($dateFacture > $now->subDays(5)) {
            return $faker->randomElement(['brouillon', 'envoyee']);
        }

        // Si l'échéance est passée
        if ($dateEcheance < $now) {
            return $faker->randomElement(['payee', 'payee', 'payee', 'en_retard']); // 75% payées, 25% en retard
        }

        // Distribution normale pour les autres cas
        return $faker->randomElement([
            'brouillon', // 10%
            'envoyee', 'envoyee', 'envoyee', // 30%
            'payee', 'payee', 'payee', 'payee', 'payee', 'payee' // 60%
        ]);
    }

    /**
     * Génère un numéro de facture basé sur la date avec compteur
     */
    private function genererNumeroFacture($date): string
    {
        $annee = $date->format('Y');

        // Vérifier le dernier numéro existant pour cette année
        $dernierNumero = Facture::where('numero_facture', 'LIKE', "FACT-{$annee}-%")
                              ->orderBy('numero_facture', 'desc')
                              ->first();

        if ($dernierNumero) {
            $dernierNum = (int) substr($dernierNumero->numero_facture, -4);
            $nouveauNum = $dernierNum + 1;
        } else {
            $nouveauNum = $this->numeroCounter;
        }

        $numero = sprintf('FACT-%s-%04d', $annee, $nouveauNum);
        $this->numeroCounter = max($this->numeroCounter, $nouveauNum) + 1;

        return $numero;
    }

    /**
     * Crée des factures indépendantes (sans devis associé)
     */
    private function creerFacturesIndependantes($clients, $services, $faker, $nombre): void
    {
        for ($i = 0; $i < $nombre; $i++) {
            $client = $clients->random();
            $dateFacture = $faker->dateTimeBetween('-4 months', 'now');
            $dateEcheance = (clone $dateFacture)->modify('+30 days');

            $statut = $this->determinerStatutFacture($faker, $dateFacture, $dateEcheance);

            // Déterminer le statut d'envoi
            $statutEnvoi = match($statut) {
                'brouillon' => 'non_envoyee',
                'envoyee', 'payee' => 'envoyee',
                'en_retard' => $faker->randomElement(['envoyee', 'non_envoyee']),
                default => 'non_envoyee'
            };

            // Sélectionner 1 ou 2 services pour cette facture
            $servicesFacture = $services->random($faker->numberBetween(1, 2));
            $premierService = $servicesFacture->first();

            $facture = Facture::create([
                'numero_facture' => $this->genererNumeroFacture($dateFacture),
                'devis_id' => null,
                'client_id' => $client->id,
                'date_facture' => $dateFacture,
                'date_echeance' => $dateEcheance,
                'statut' => $statut,
                'statut_envoi' => $statutEnvoi,
                'objet' => $servicesFacture->count() === 1 ? $premierService->nom :
                          $premierService->nom . ' + ' . $servicesFacture->skip(1)->first()->nom,
                'description' => 'Facturation pour prestations réalisées.',
                'montant_ht' => 0, // Sera calculé à partir des lignes
                'taux_tva' => 20.0,
                'montant_tva' => 0,
                'montant_ttc' => 0,
                'conditions_paiement' => $faker->randomElement([
                    'Paiement à 30 jours par virement bancaire.',
                    'Paiement à réception par chèque ou virement.',
                    'Paiement comptant à la livraison.'
                ]),
                'notes' => $faker->optional(0.3)->sentence(),
                'date_paiement' => $statut === 'payee' ?
                    $faker->dateTimeBetween($dateFacture, $dateEcheance) : null,
                'mode_paiement' => $statut === 'payee' ?
                    $faker->randomElement(['Virement bancaire', 'Chèque', 'Carte bancaire']) : null,
                'reference_paiement' => $statut === 'payee' ?
                    $faker->optional(0.6)->regexify('[A-Z0-9]{6,10}') : null,
                'archive' => $faker->boolean(10),
                'date_envoi_client' => $statutEnvoi === 'envoyee' ?
                    $faker->dateTimeBetween($dateFacture, 'now') : null,
                'date_envoi_admin' => $faker->dateTimeBetween($dateFacture, 'now'),
            ]);

            // Créer les lignes de services pour cette facture
            $ordre = 1;
            foreach ($servicesFacture as $service) {
                // Pour les factures simples, utiliser généralement la quantité par défaut
                $quantite = $service->qte_defaut;
                if (in_array($service->code, ['CONSEIL-TECH', 'MAINT-MENSUELLE'])) {
                    $quantite = $faker->numberBetween(1, $service->qte_defaut);
                }

                $prixUnitaire = $service->prix_ht * $faker->randomFloat(2, 0.9, 1.1); // Variation de ±10%
                $tauxTva = $faker->randomElement([20.0, 10.0, 5.5]);

                LigneFacture::create([
                    'facture_id' => $facture->id,
                    'service_id' => $service->id,
                    'quantite' => $quantite,
                    'prix_unitaire_ht' => $prixUnitaire,
                    'taux_tva' => $tauxTva,
                    'ordre' => $ordre++,
                ]);
            }

            // Recalculer les montants totaux de la facture
            $facture->calculerMontants();
            $facture->save();
        }
    }

    /**
     * Crée des factures de démonstration
     */
    private function creerFacturesDemo($clients, $services, $faker): void
    {
        if ($clients->count() === 0 || $services->count() === 0) return;

        $clientDemo = $clients->random();
        $serviceApp = $services->where('code', 'DEV-APP-WEB')->first();
        $serviceConseil = $services->where('code', 'CONSEIL-TECH')->first();

        // Facture récente envoyée
        $facture1 = Facture::create([
            'numero_facture' => 'FACT-DEMO-' . time(),
            'devis_id' => null,
            'client_id' => $clientDemo->id,
            'date_facture' => now()->subDays(3),
            'date_echeance' => now()->addDays(27),
            'statut' => 'envoyee',
            'statut_envoi' => 'envoyee',
            'objet' => 'Développement + consultation',
            'description' => 'Développement module personnalisé et consultation technique.',
            'montant_ht' => 0,
            'taux_tva' => 20.0,
            'montant_tva' => 0,
            'montant_ttc' => 0,
            'conditions_paiement' => 'Paiement à 30 jours par virement bancaire.',
            'notes' => 'Facture prioritaire - Client VIP',
            'date_paiement' => null,
            'mode_paiement' => null,
            'reference_paiement' => null,
            'archive' => false,
            'date_envoi_client' => now()->subDays(3),
            'date_envoi_admin' => now()->subDays(3),
        ]);

        // Ajouter les lignes de services
        if ($serviceApp) {
            LigneFacture::create([
                'facture_id' => $facture1->id,
                'service_id' => $serviceApp->id,
                'quantite' => 1,
                'prix_unitaire_ht' => 3500.00,
                'taux_tva' => 20.0,
                'ordre' => 1,
            ]);
        }

        if ($serviceConseil) {
            LigneFacture::create([
                'facture_id' => $facture1->id,
                'service_id' => $serviceConseil->id,
                'quantite' => 8,
                'prix_unitaire_ht' => $serviceConseil->prix_ht,
                'taux_tva' => 20.0,
                'ordre' => 2,
            ]);
        }

        $facture1->calculerMontants();
        $facture1->save();

        // Facture en retard
        $clientRetard = $clients->random();
        $serviceMaintenance = $services->where('code', 'MAINT-MENSUELLE')->first();

        $facture2 = Facture::create([
            'numero_facture' => 'FACT-RETARD-' . time(),
            'devis_id' => null,
            'client_id' => $clientRetard->id,
            'date_facture' => now()->subDays(45),
            'date_echeance' => now()->subDays(15),
            'statut' => 'en_retard',
            'statut_envoi' => 'envoyee',
            'objet' => 'Maintenance mensuelle',
            'description' => 'Maintenance préventive et support technique.',
            'montant_ht' => 0,
            'taux_tva' => 20.0,
            'montant_tva' => 0,
            'montant_ttc' => 0,
            'conditions_paiement' => 'Paiement à 30 jours. Pénalités de retard applicables.',
            'notes' => 'Relance effectuée le ' . now()->subDays(7)->format('d/m/Y'),
            'date_paiement' => null,
            'mode_paiement' => null,
            'reference_paiement' => null,
            'archive' => false,
            'date_envoi_client' => now()->subDays(45),
            'date_envoi_admin' => now()->subDays(45),
        ]);

        if ($serviceMaintenance) {
            LigneFacture::create([
                'facture_id' => $facture2->id,
                'service_id' => $serviceMaintenance->id,
                'quantite' => 3,
                'prix_unitaire_ht' => $serviceMaintenance->prix_ht,
                'taux_tva' => 20.0,
                'ordre' => 1,
            ]);
        }

        $facture2->calculerMontants();
        $facture2->save();
    }
}
