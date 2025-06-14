<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Créer les administrateurs réels de la base Firebase
        $administrateurs = [
            [
                'name' => 'Jacques Steeven',
                'email' => 'jacques.steeven@gmail.com',
                'password' => Hash::make('password123'), // Mot de passe temporaire
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Jacques Steeven',
                'email' => 's.jacques@madin-ia.com',
                'password' => Hash::make('password123'), // Mot de passe temporaire
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Amandine Loza',
                'email' => 'a.loza@madin-ia.com',
                'password' => Hash::make('password123'), // Mot de passe temporaire
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Brault dimitri',
                'email' => 'd.brault@madin-ia.com',
                'password' => Hash::make('password123'), // Mot de passe temporaire
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Jacques-Henry Bernardin Joseph',
                'email' => 'jacques-h.joseph@outlook.com',
                'password' => Hash::make('password123'), // Mot de passe temporaire
                'email_verified_at' => now(),
            ],
            [
                'name' => 'FADILA BENJEBARA',
                'email' => 'business@madin-ia.com',
                'password' => Hash::make('password123'), // Mot de passe temporaire
                'email_verified_at' => now(),
            ],
        ];

        foreach ($administrateurs as $admin) {
            User::updateOrCreate(
                ['email' => $admin['email']],
                $admin
            );
        }

        $this->command->info('✅ Administrateurs réels créés avec succès à partir des données Firebase !');
    }
}
