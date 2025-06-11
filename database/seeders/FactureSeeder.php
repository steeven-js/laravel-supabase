<?php

namespace Database\Seeders;

use App\Models\Facture;
use App\Models\Devis;
use App\Models\Client;
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

        // Créer des factures à partir des devis acceptés
        foreach ($devisAcceptes as $devis) {
            // Calculer les dates - s'assurer que la date d'acceptation est antérieure à maintenant
            $dateAcceptation = $devis->date_acceptation ?? $devis->date_devis;
            $dateDebut = Carbon::parse($dateAcceptation);
            $maintenant = Carbon::now();

            // Si la date d'acceptation est dans le futur, utiliser la date du devis
            if ($dateDebut->isFuture()) {
                $dateDebut = Carbon::parse($devis->date_devis);
            }

            $dateFacture = $faker->dateTimeBetween($dateDebut, $maintenant);
            $dateEcheance = (clone $dateFacture)->modify('+30 days');

            // Déterminer le statut de la facture
            $statut = $this->determinerStatutFacture($faker, $dateFacture, $dateEcheance);

            $facture = Facture::create([
                'numero_facture' => $this->genererNumeroFacture($dateFacture),
                'devis_id' => $devis->id,
                'client_id' => $devis->client_id,
                'date_facture' => $dateFacture,
                'date_echeance' => $dateEcheance,
                'statut' => $statut,
                'objet' => $devis->objet,
                'description' => $devis->description,
                'montant_ht' => $devis->montant_ht,
                'taux_tva' => $devis->taux_tva,
                'montant_tva' => $devis->montant_tva,
                'montant_ttc' => $devis->montant_ttc,
                'conditions_paiement' => $devis->conditions ?? 'Paiement à 30 jours par virement bancaire.',
                'notes' => $devis->notes,
                'date_paiement' => $statut === 'payee' ?
                    $faker->dateTimeBetween($dateFacture, $dateEcheance) : null,
                'mode_paiement' => $statut === 'payee' ?
                    $faker->randomElement(['Virement bancaire', 'Chèque', 'Carte bancaire', 'Espèces']) : null,
                'reference_paiement' => $statut === 'payee' ?
                    $faker->optional(0.7)->regexify('[A-Z0-9]{8,12}') : null,
                                'archive' => false,
                'date_envoi_client' => in_array($statut, ['envoyee', 'payee']) ?
                    $faker->dateTimeBetween($dateFacture, max($dateFacture, $maintenant)) : null,
                'date_envoi_admin' => $faker->dateTimeBetween($dateFacture, max($dateFacture, $maintenant)),
            ]);
        }

        // Créer des factures indépendantes (sans devis)
        $clients = Client::where('actif', true)->get();

        if ($clients->count() > 0) {
            $this->creerFacturesIndependantes($clients, $faker, 15);
        }

        // Créer quelques factures de démonstration
        $this->creerFacturesDemo($clients, $faker);
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

        $numero = sprintf('FACT-%s-%04d', $annee, $this->numeroCounter);
        $this->numeroCounter++;

        return $numero;
    }

    /**
     * Crée des factures indépendantes (sans devis associé)
     */
    private function creerFacturesIndependantes($clients, $faker, $nombre): void
    {
        $prestationsSimples = [
            'Maintenance site web mensuelle',
            'Formation utilisateur',
            'Support technique',
            'Consultation ponctuelle',
            'Mise à jour sécurité',
            'Sauvegarde et restauration',
            'Analyse de performance',
            'Optimisation SEO'
        ];

        for ($i = 0; $i < $nombre; $i++) {
            $client = $clients->random();
            $dateFacture = $faker->dateTimeBetween('-4 months', 'now');
            $dateEcheance = (clone $dateFacture)->modify('+30 days');

            $statut = $this->determinerStatutFacture($faker, $dateFacture, $dateEcheance);

            $montantHT = $faker->randomFloat(2, 300, 2500);
            $tauxTVA = $faker->randomElement([20.0, 10.0, 5.5]);
            $montantTVA = ($montantHT * $tauxTVA) / 100;
            $montantTTC = $montantHT + $montantTVA;

            Facture::create([
                'numero_facture' => $this->genererNumeroFacture($dateFacture),
                'devis_id' => null,
                'client_id' => $client->id,
                'date_facture' => $dateFacture,
                'date_echeance' => $dateEcheance,
                'statut' => $statut,
                'objet' => $faker->randomElement($prestationsSimples),
                'description' => $faker->sentence(10),
                'montant_ht' => $montantHT,
                'taux_tva' => $tauxTVA,
                'montant_tva' => $montantTVA,
                'montant_ttc' => $montantTTC,
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
                                'archive' => $faker->boolean(10), // 10% archivées
                'date_envoi_client' => in_array($statut, ['envoyee', 'payee']) ?
                    $faker->dateTimeBetween($dateFacture, 'now') : null,
                'date_envoi_admin' => $faker->dateTimeBetween($dateFacture, 'now'),
            ]);
        }
    }

    /**
     * Crée des factures de démonstration
     */
    private function creerFacturesDemo($clients, $faker): void
    {
        if ($clients->count() === 0) return;

        $clientDemo = $clients->random();

        // Facture récente envoyée avec numéro unique
        Facture::create([
            'numero_facture' => 'FACT-DEMO-' . time(),
            'devis_id' => null,
            'client_id' => $clientDemo->id,
            'date_facture' => now()->subDays(3),
            'date_echeance' => now()->addDays(27),
            'statut' => 'envoyee',
            'objet' => 'Développement module personnalisé',
            'description' => 'Développement d\'un module personnalisé pour l\'intégration de l\'API de paiement et gestion des webhooks.',
            'montant_ht' => 3500.00,
            'taux_tva' => 20.0,
            'montant_tva' => 700.00,
            'montant_ttc' => 4200.00,
            'conditions_paiement' => 'Paiement à 30 jours par virement bancaire. Références à mentionner obligatoirement.',
            'notes' => 'Facture prioritaire - Client VIP',
            'date_paiement' => null,
            'mode_paiement' => null,
            'reference_paiement' => null,
            'archive' => false,
            'date_envoi_client' => now()->subDays(3),
            'date_envoi_admin' => now()->subDays(3),
        ]);

        // Facture en retard avec numéro unique
        $clientRetard = $clients->random();
        Facture::create([
            'numero_facture' => 'FACT-RETARD-' . time(),
            'devis_id' => null,
            'client_id' => $clientRetard->id,
            'date_facture' => now()->subDays(45),
            'date_echeance' => now()->subDays(15),
            'statut' => 'en_retard',
            'objet' => 'Maintenance serveur décembre',
            'description' => 'Maintenance préventive du serveur, mise à jour sécurité et monitoring mensuel.',
            'montant_ht' => 850.00,
            'taux_tva' => 20.0,
            'montant_tva' => 170.00,
            'montant_ttc' => 1020.00,
            'conditions_paiement' => 'Paiement à 30 jours. Pénalités de retard : 3 fois le taux d\'intérêt légal.',
            'notes' => 'Relance effectuée le ' . now()->subDays(7)->format('d/m/Y'),
            'date_paiement' => null,
            'mode_paiement' => null,
            'reference_paiement' => null,
            'archive' => false,
            'date_envoi_client' => now()->subDays(45),
            'date_envoi_admin' => now()->subDays(45),
        ]);
    }
}
