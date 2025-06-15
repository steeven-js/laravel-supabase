<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Emails des super administrateurs
        $superAdminEmails = [
            'jacques.steeven@gmail.com',
            's.jacques@madin-ia.com'
        ];

        // Créer ou mettre à jour les super administrateurs
        foreach ($superAdminEmails as $email) {
            $user = User::where('email', $email)->first();

            if (!$user) {
                User::create([
                    'name' => 'Super Administrateur',
                    'email' => $email,
                    'password' => Hash::make('password123'),
                    'role' => 'superadmin',
                    'email_verified_at' => now(),
                ]);
                $this->command->info('Super administrateur créé: ' . $email);
            } else {
                // Mettre à jour le rôle vers superadmin si nécessaire
                if ($user->role !== 'superadmin') {
                    $user->update(['role' => 'superadmin']);
                    $this->command->info('Rôle mis à jour vers Super Administrateur pour: ' . $email);
                } else {
                    $this->command->info('Super administrateur existe déjà: ' . $email);
                }
            }
        }

        // Créer des utilisateurs de test avec le rôle admin par défaut
        $testUsers = [
            [
                'name' => 'Administrateur Test',
                'email' => 'admin-test@laravel-supabase.com',
                'password' => Hash::make('password123'),
                'role' => 'admin', // Rôle par défaut maintenant
            ],
            [
                'name' => 'Utilisateur Test',
                'email' => 'user-test@laravel-supabase.com',
                'password' => Hash::make('password123'),
                'role' => 'admin', // Rôle par défaut maintenant
            ],
        ];

        foreach ($testUsers as $userData) {
            $existingUser = User::where('email', $userData['email'])->first();
            if (!$existingUser) {
                User::create($userData + ['email_verified_at' => now()]);
                $this->command->info('Utilisateur admin créé: ' . $userData['email']);
            } else {
                // Mettre à jour le rôle si nécessaire (migration depuis user vers admin)
                if ($existingUser->role !== 'admin' && $existingUser->role !== 'superadmin') {
                    $existingUser->update(['role' => 'admin']);
                    $this->command->info('Rôle mis à jour vers Admin pour: ' . $existingUser->email);
                }
            }
        }

        // Mettre à jour tous les utilisateurs existants avec un rôle "user" vers "admin"
        $usersToUpdate = User::where('role', 'user')->get();
        foreach ($usersToUpdate as $user) {
            $user->update(['role' => 'admin']);
            $this->command->info('Utilisateur migré vers admin: ' . $user->email);
        }

        $this->command->info('');
        $this->command->info('=== Résumé des rôles ===');
        $this->command->info('Super Administrateurs: ' . User::where('role', 'superadmin')->count());
        $this->command->info('Administrateurs: ' . User::where('role', 'admin')->count());
    }
}
