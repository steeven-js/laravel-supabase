<?php

namespace Database\Seeders;

use App\Models\Madinia;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MadiniaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Récupérer le premier utilisateur comme contact principal par défaut
        $firstUser = User::first();

        Madinia::create([
            'name' => 'Madin.IA',
            'contact_principal_id' => $firstUser?->id,
            'telephone' => '0647438084',
            'email' => 'd.brault@madin-ia.com',
            'site_web' => 'https://madinia.fr',
            'siret' => '934 303 843 00015',
            'numero_nda' => '02973663897',
            'pays' => 'Martinique',
            'adresse' => '1 Chemin du Sud, 97233 Schoelcher',
            'description' => 'Madin.IA est une entreprise innovante spécialisée dans l\'intelligence artificielle et les solutions numériques pour les entreprises caribéennes.',
            'reseaux_sociaux' => [
                'facebook' => '',
                'twitter' => '',
                'instagram' => '',
                'linkedin' => '',
            ],
            'nom_compte_bancaire' => 'MADIN.IA',
            'nom_banque' => 'Revolut',
            'numero_compte' => 'FR76 2823 3000 0190 7580 9673 493',
            'iban_bic_swift' => 'FR76 2823 3000 0190 7580 9673 493 (BIC: REVOFRP2)',
        ]);
    }
}
