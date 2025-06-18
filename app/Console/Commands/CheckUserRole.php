<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class CheckUserRole extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:check {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Vérifie le rôle et les permissions d\'un utilisateur';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        // Trouver l'utilisateur
        $user = User::with('userRole')->where('email', $email)->first();
        if (!$user) {
            $this->error("Utilisateur avec l'email '{$email}' introuvable.");
            return 1;
        }

        $this->info("=== INFORMATIONS UTILISATEUR ===");
        $this->line("ID: {$user->id}");
        $this->line("Nom: {$user->name}");
        $this->line("Email: {$user->email}");
        $this->line("User Role ID: " . ($user->user_role_id ?? 'null'));

        if ($user->userRole) {
            $this->info("\n=== RÔLE ACTUEL ===");
            $this->line("Nom du rôle: {$user->userRole->name}");
            $this->line("Nom d'affichage: {$user->userRole->display_name}");
            $this->line("Description: " . ($user->userRole->description ?? 'N/A'));
            $this->line("Actif: " . ($user->userRole->is_active ? 'Oui' : 'Non'));

            $this->info("\n=== PERMISSIONS ===");
            $this->line("Est Admin: " . ($user->isAdmin() ? 'Oui' : 'Non'));
            $this->line("Est Super Admin: " . ($user->isSuperAdmin() ? 'Oui' : 'Non'));

            if ($user->userRole->permissions) {
                $this->line("Permissions: " . implode(', ', $user->userRole->permissions));
            }
        } else {
            $this->error("\n❌ AUCUN RÔLE ASSIGNÉ!");
        }

        $this->info("\n=== ACCÈS AUX FONCTIONNALITÉS ===");
        $this->line("🔔 Notifications: " . ($user->isAdmin() ? '✅ Oui' : '❌ Non'));
        $this->line("👥 Utilisateurs: " . ($user->isSuperAdmin() ? '✅ Oui' : '❌ Non'));
        $this->line("📊 Monitoring: " . ($user->isSuperAdmin() ? '✅ Oui' : '❌ Non'));
        $this->line("📁 Repository: " . ($user->isSuperAdmin() ? '✅ Oui' : '❌ Non'));

        return 0;
    }
}
