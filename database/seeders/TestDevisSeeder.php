<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Client;
use App\Models\Service;
use Carbon\Carbon;

class TestDevisSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Vider les tables de test en premier
        DB::table('test_lignes_devis')->delete();
        DB::table('test_devis')->delete();

        // Récupérer les clients et services existants
        $clients = Client::all();
        $services = Service::all();

        if ($clients->isEmpty() || $services->isEmpty()) {
            $this->command->warn('Aucun client ou service trouvé. Veuillez d\'abord seeder les tables clients et services.');
            return;
        }

        $this->command->info('Création des devis de test...');

        // Créer 10 devis de test
        for ($i = 1; $i <= 10; $i++) {
            $client = $clients->random();
            $dateDevis = Carbon::now()->subDays(rand(1, 30));
            $dateValidite = $dateDevis->copy()->addDays(30);

            // Statuts variés pour les tests
            $statuts = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'];
            $statut = $statuts[array_rand($statuts)];

            $devisId = DB::table('test_devis')->insertGetId([
                'numero_devis' => 'TEST-DV-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'client_id' => $client->id,
                'date_devis' => $dateDevis,
                'date_validite' => $dateValidite,
                'statut' => $statut,
                'statut_envoi' => $statut === 'brouillon' ? 'non_envoye' : 'envoye',
                'date_envoi_client' => $statut !== 'brouillon' ? $dateDevis->copy()->addHours(2) : null,
                'date_envoi_admin' => $statut !== 'brouillon' ? $dateDevis->copy()->addHours(2) : null,
                'objet' => 'Devis de test #' . $i . ' - ' . $client->nom,
                'description' => 'Description du devis de test numéro ' . $i,
                'montant_ht' => 0, // Sera calculé après les lignes
                'taux_tva' => 20.00,
                'montant_tva' => 0,
                'montant_ttc' => 0,
                'conditions' => 'Conditions générales de vente standard',
                'notes' => 'Note de test pour le devis #' . $i,
                'date_acceptation' => $statut === 'accepte' ? $dateDevis->copy()->addDays(2) : null,
                'archive' => false,
                'created_at' => $dateDevis,
                'updated_at' => $dateDevis,
            ]);

            // Ajouter 2-4 lignes par devis
            $nbLignes = rand(2, 4);
            $montantTotalHT = 0;

            for ($j = 1; $j <= $nbLignes; $j++) {
                $service = $services->random();
                $quantite = rand(1, 5);
                $prixUnitaire = rand(100, 2000);
                $montantHT = $quantite * $prixUnitaire;
                $montantTVA = $montantHT * 0.20;
                $montantTTC = $montantHT + $montantTVA;

                $montantTotalHT += $montantHT;

                DB::table('test_lignes_devis')->insert([
                    'devis_id' => $devisId,
                    'service_id' => $service->id,
                    'quantite' => $quantite,
                    'prix_unitaire_ht' => $prixUnitaire,
                    'taux_tva' => 20.00,
                    'montant_ht' => $montantHT,
                    'montant_tva' => $montantTVA,
                    'montant_ttc' => $montantTTC,
                    'ordre' => $j,
                    'description_personnalisee' => 'Ligne de test #' . $j . ' - ' . $service->nom,
                    'created_at' => $dateDevis,
                    'updated_at' => $dateDevis,
                ]);
            }

            // Mettre à jour les montants du devis
            $montantTVA = $montantTotalHT * 0.20;
            $montantTTC = $montantTotalHT + $montantTVA;

            DB::table('test_devis')->where('id', $devisId)->update([
                'montant_ht' => $montantTotalHT,
                'montant_tva' => $montantTVA,
                'montant_ttc' => $montantTTC,
            ]);
        }

        $this->command->info('✅ 10 devis de test créés avec succès !');
    }
}
