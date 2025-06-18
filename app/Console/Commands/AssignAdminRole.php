<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\UserRole;

class AssignAdminRole extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:assign {email} {role=admin}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assigne un rôle admin ou super_admin à un utilisateur';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $roleName = $this->argument('role');

        // Validation du rôle
        if (!in_array($roleName, ['admin', 'super_admin'])) {
            $this->error('Le rôle doit être "admin" ou "super_admin"');
            return 1;
        }

        // Trouver l'utilisateur
        $user = User::where('email', $email)->first();
        if (!$user) {
            $this->error("Utilisateur avec l'email '{$email}' introuvable.");
            return 1;
        }

        // Trouver ou créer le rôle
        $role = UserRole::firstOrCreate(
            ['name' => $roleName],
            [
                'display_name' => $roleName === 'super_admin' ? 'Super Administrateur' : 'Administrateur',
                'description' => $roleName === 'super_admin' ? 'Accès complet au système' : 'Accès administrateur',
                'is_active' => true,
                'permissions' => $roleName === 'super_admin'
                    ? ['*']
                    : ['view_dashboard', 'manage_clients', 'manage_devis', 'view_notifications']
            ]
        );

        // Assigner le rôle à l'utilisateur
        $user->user_role_id = $role->id;
        $user->save();

        $this->info("✅ Rôle '{$roleName}' assigné avec succès à {$user->name} ({$email})");

        return 0;
    }
}
