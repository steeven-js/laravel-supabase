<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class EntrepriseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('fr_FR');

        // Types d'entreprises réalistes
        $typesEntreprises = [
            ['nom' => 'Tech Solutions SARL', 'secteur' => 'IT'],
            ['nom' => 'Digital Innovation SAS', 'secteur' => 'Numérique'],
            ['nom' => 'Consulting Group', 'secteur' => 'Conseil'],
            ['nom' => 'Marketing Agency', 'secteur' => 'Marketing'],
            ['nom' => 'Web Development', 'secteur' => 'Développement'],
        ];

        // Créer des entreprises spécifiques
        foreach ($typesEntreprises as $type) {
            $nomCommercial = $faker->company;
            $nomRaisonSociale = $nomCommercial . ' ' . $faker->randomElement(['SARL', 'SAS']);

            Entreprise::create([
                'nom' => $nomRaisonSociale,
                'nom_commercial' => $nomCommercial,
                'siret' => $faker->siret(false),
                'siren' => substr($faker->siret(false), 0, 9),
                'adresse' => $faker->streetAddress,
                'ville' => $faker->city,
                'code_postal' => $faker->postcode,
                'pays' => 'France',
                'telephone' => $faker->phoneNumber,
                'email' => $faker->unique()->companyEmail,
                'site_web' => $faker->url,
                'secteur_activite' => $type['secteur'],
                'nombre_employes' => $faker->numberBetween(1, 50),
                'chiffre_affaires' => $faker->randomFloat(2, 100000, 2000000),
                'active' => true,
                'notes' => $faker->optional(0.3)->sentence(),
            ]);
        }

        // Créer 15 entreprises supplémentaires avec des données plus variées
        for ($i = 0; $i < 15; $i++) {
            $secteurs = [
                'Informatique', 'Marketing', 'Conseil', 'E-commerce', 'Design',
                'Formation', 'Événementiel', 'Communication', 'Finance', 'Logistique'
            ];

            $secteur = $faker->randomElement($secteurs);
            $nomBase = $faker->company;
            $suffixe = $faker->randomElement(['SARL', 'SAS', 'SA', 'EURL']);

            Entreprise::create([
                'nom' => $nomBase . ' ' . $suffixe,
                'nom_commercial' => $faker->optional(0.7)->passthrough($nomBase),
                'siret' => $faker->siret(false),
                'siren' => substr($faker->siret(false), 0, 9),
                'adresse' => $faker->streetAddress,
                'ville' => $faker->city,
                'code_postal' => $faker->postcode,
                'pays' => $faker->randomElement(['France', 'Belgique', 'Suisse']),
                'telephone' => $faker->phoneNumber,
                'email' => $faker->unique()->companyEmail,
                'site_web' => $faker->optional(0.8)->url,
                'secteur_activite' => $secteur,
                'nombre_employes' => $faker->numberBetween(1, 200),
                'chiffre_affaires' => $faker->randomFloat(2, 50000, 5000000),
                'active' => $faker->boolean(95), // 95% d'entreprises actives
                'notes' => $faker->optional(0.2)->sentence(),
            ]);
        }
    }
}
