<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Client;
use App\Models\Service;
use Carbon\Carbon;

class TestFacturesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Vider les tables de test en premier
        DB::table('test_lignes_factures')->delete();
        DB::table('test_factures')->delete();

        // Récupérer les clients, services et devis de test existants
        $clients = Client::all();
        $services = Service::all();
        $devisTest = DB::table('test_devis')->get();

        if ($clients->isEmpty() || $services->isEmpty()) {
            $this->command->warn('Aucun client ou service trouvé. Veuillez d\'abord seeder les tables clients et services.');
            return;
        }

        $this->command->info('Création des factures de test...');

        // Créer 8 factures de test
        for ($i = 1; $i <= 8; $i++) {
            $client = $clients->random();
            $dateFacture = Carbon::now()->subDays(rand(1, 60));
            $dateEcheance = $dateFacture->copy()->addDays(30);

            // Statuts variés pour les tests
            $statuts = ['brouillon', 'envoyee', 'payee', 'en_retard', 'annulee'];
            $statut = $statuts[array_rand($statuts)];

            // Associer parfois à un devis de test
            $devisId = null;
            if (!$devisTest->isEmpty() && rand(0, 1)) {
                $devisId = $devisTest->random()->id;
            }

            $factureId = DB::table('test_factures')->insertGetId([
                'numero_facture' => 'TEST-FACT-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'devis_id' => $devisId,
                'client_id' => $client->id,
                'date_facture' => $dateFacture,
                'date_echeance' => $dateEcheance,
                'statut' => $statut,
                'statut_envoi' => $statut === 'brouillon' ? 'non_envoyee' : 'envoyee',
                'objet' => 'Facture de test #' . $i . ' - ' . $client->nom,
                'description' => 'Description de la facture de test numéro ' . $i,
                'montant_ht' => 0, // Sera calculé après les lignes
                'taux_tva' => 20.00,
                'montant_tva' => 0,
                'montant_ttc' => 0,
                'conditions_paiement' => 'Paiement à 30 jours',
                'notes' => 'Note de test pour la facture #' . $i,
                'date_paiement' => $statut === 'payee' ? $dateFacture->copy()->addDays(rand(1, 25)) : null,
                'mode_paiement' => $statut === 'payee' ? ['virement', 'chèque', 'espèces', 'carte'][array_rand(['virement', 'chèque', 'espèces', 'carte'])] : null,
                'reference_paiement' => $statut === 'payee' ? 'REF-TEST-' . $i : null,
                'archive' => false,
                'date_envoi_client' => $statut !== 'brouillon' ? $dateFacture->copy()->addHours(1) : null,
                'date_envoi_admin' => $statut !== 'brouillon' ? $dateFacture->copy()->addHours(1) : null,
                'created_at' => $dateFacture,
                'updated_at' => $dateFacture,
            ]);

            // Ajouter 1-3 lignes par facture
            $nbLignes = rand(1, 3);
            $montantTotalHT = 0;

            for ($j = 1; $j <= $nbLignes; $j++) {
                $service = $services->random();
                $quantite = rand(1, 3);
                $prixUnitaire = rand(200, 1500);
                $montantHT = $quantite * $prixUnitaire;
                $montantTVA = $montantHT * 0.20;
                $montantTTC = $montantHT + $montantTVA;

                $montantTotalHT += $montantHT;

                DB::table('test_lignes_factures')->insert([
                    'facture_id' => $factureId,
                    'service_id' => $service->id,
                    'quantite' => $quantite,
                    'prix_unitaire_ht' => $prixUnitaire,
                    'taux_tva' => 20.00,
                    'montant_ht' => $montantHT,
                    'montant_tva' => $montantTVA,
                    'montant_ttc' => $montantTTC,
                    'ordre' => $j,
                    'description_personnalisee' => 'Ligne de test #' . $j . ' - ' . $service->nom,
                    'created_at' => $dateFacture,
                    'updated_at' => $dateFacture,
                ]);
            }

            // Mettre à jour les montants de la facture
            $montantTVA = $montantTotalHT * 0.20;
            $montantTTC = $montantTotalHT + $montantTVA;

            DB::table('test_factures')->where('id', $factureId)->update([
                'montant_ht' => $montantTotalHT,
                'montant_tva' => $montantTVA,
                'montant_ttc' => $montantTTC,
            ]);
        }

        $this->command->info('✅ 8 factures de test créées avec succès !');
    }
}
