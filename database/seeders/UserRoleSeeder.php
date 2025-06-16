<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Support\Facades\Hash;

class UserRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtenir les rôles
        $superAdminRole = UserRole::where('name', 'super_admin')->first();
        $adminRole = UserRole::where('name', 'admin')->first();

        if (!$superAdminRole || !$adminRole) {
            $this->command->error('Les rôles n\'ont pas été créés. Veuillez exécuter la migration create_user_roles_table d\'abord.');
            return;
        }

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
                    'user_role_id' => $superAdminRole->id,
                    'email_verified_at' => now(),
                ]);
                $this->command->info('Super administrateur créé: ' . $email);
            } else {
                // Mettre à jour le rôle vers super_admin si nécessaire
                if ($user->user_role_id !== $superAdminRole->id) {
                    $user->update(['user_role_id' => $superAdminRole->id]);
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
                'user_role_id' => $adminRole->id,
            ],
            [
                'name' => 'Utilisateur Test',
                'email' => 'user-test@laravel-supabase.com',
                'password' => Hash::make('password123'),
                'user_role_id' => $adminRole->id,
            ],
        ];

        foreach ($testUsers as $userData) {
            $existingUser = User::where('email', $userData['email'])->first();
            if (!$existingUser) {
                User::create($userData + ['email_verified_at' => now()]);
                $this->command->info('Utilisateur admin créé: ' . $userData['email']);
            } else {
                // Mettre à jour le rôle si nécessaire
                if ($existingUser->user_role_id !== $adminRole->id && $existingUser->user_role_id !== $superAdminRole->id) {
                    $existingUser->update(['user_role_id' => $adminRole->id]);
                    $this->command->info('Rôle mis à jour vers Admin pour: ' . $existingUser->email);
                }
            }
        }

        // Mettre à jour tous les utilisateurs sans rôle assigné vers admin
        $usersWithoutRole = User::whereNull('user_role_id')->get();
        foreach ($usersWithoutRole as $user) {
            $user->update(['user_role_id' => $adminRole->id]);
            $this->command->info('Rôle admin assigné à: ' . $user->email);
        }

        $this->command->info('');
        $this->command->info('=== Résumé des rôles ===');
        $this->command->info('Super Administrateurs: ' . User::whereHas('userRole', function ($q) {
            $q->where('name', 'super_admin');
        })->count());
        $this->command->info('Administrateurs: ' . User::whereHas('userRole', function ($q) {
            $q->where('name', 'admin');
        })->count());
    }
}
