<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Entreprise;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class ClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('fr_FR');

        // Récupérer les entreprises existantes
        $entreprises = Entreprise::where('active', true)->get();

        // Créer quelques clients spécifiques pour les tests
        $clientsTests = [
            [
                'nom' => 'Martin',
                'prenom' => 'Pierre',
                'email' => 'pierre.martin@email.com',
                'entreprise' => true
            ],
            [
                'nom' => 'Dubois',
                'prenom' => 'Marie',
                'email' => 'marie.dubois@gmail.com',
                'entreprise' => false
            ],
            [
                'nom' => 'Leroy',
                'prenom' => 'Jean',
                'email' => 'jean.leroy@company.fr',
                'entreprise' => true
            ],
        ];

        foreach ($clientsTests as $clientTest) {
            Client::create([
                'nom' => $clientTest['nom'],
                'prenom' => $clientTest['prenom'],
                'email' => $clientTest['email'],
                'telephone' => $faker->phoneNumber,
                'adresse' => $faker->streetAddress,
                'ville' => $faker->city,
                'code_postal' => $faker->postcode,
                'pays' => 'France',
                'entreprise_id' => $clientTest['entreprise'] && $entreprises->count() > 0
                    ? $entreprises->random()->id
                    : null,
                'actif' => true,
                'notes' => $faker->optional(0.3)->sentence(),
            ]);
        }

        // Créer 40 clients supplémentaires
        for ($i = 0; $i < 40; $i++) {
            // 60% de chance d'être rattaché à une entreprise
            $avecEntreprise = $faker->boolean(60) && $entreprises->count() > 0;

            Client::create([
                'nom' => $faker->lastName,
                'prenom' => $faker->firstName,
                'email' => $faker->unique()->email,
                'telephone' => $faker->optional(0.9)->phoneNumber,
                'adresse' => $faker->streetAddress,
                'ville' => $faker->city,
                'code_postal' => $faker->postcode,
                'pays' => $faker->randomElement(['France', 'Belgique', 'Suisse', 'Canada']),
                'entreprise_id' => $avecEntreprise ? $entreprises->random()->id : null,
                'actif' => $faker->boolean(90), // 90% de clients actifs
                'notes' => $faker->optional(0.2)->sentence(),
            ]);
        }

        // Créer quelques clients particuliers (sans entreprise) avec des profils variés
        $profilsParticuliers = [
            'Freelance Développeur',
            'Consultant Indépendant',
            'Designer Graphique',
            'Photographe',
            'Artisan',
            'Commerciaux',
            'Formateur'
        ];

        foreach ($profilsParticuliers as $profil) {
            Client::create([
                'nom' => $faker->lastName,
                'prenom' => $faker->firstName,
                'email' => $faker->unique()->email,
                'telephone' => $faker->phoneNumber,
                'adresse' => $faker->streetAddress,
                'ville' => $faker->city,
                'code_postal' => $faker->postcode,
                'pays' => 'France',
                'entreprise_id' => null,
                'actif' => true,
                'notes' => "Profil : $profil",
            ]);
        }
    }
}
