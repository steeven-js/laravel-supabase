<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\AdminNotification;
use Illuminate\Console\Command;

class TestNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Teste le système de notifications en créant des notifications d\'exemple';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $admins = User::whereHas('userRole', function ($query) {
            $query->whereIn('name', ['admin', 'super_admin']);
        })->get();

        if ($admins->isEmpty()) {
            $this->error('Aucun administrateur trouvé. Créez d\'abord un utilisateur admin.');
            return 1;
        }

        $this->info("Envoi de notifications de test à {$admins->count()} administrateur(s)...");

        $notifications = [
            [
                'title' => 'Nouveau client créé',
                'message' => 'Un nouveau client "Jean Dupont" a été ajouté au système.',
                'icon_type' => 'client',
            ],
            [
                'title' => 'Devis accepté',
                'message' => 'Le devis #DEV-25-001 d\'un montant de 2 500€ HT a été accepté.',
                'icon_type' => 'devis',
            ],
            [
                'title' => 'Nouvelle facture',
                'message' => 'La facture #FAC-25-001 d\'un montant de 3 000€ TTC a été créée.',
                'icon_type' => 'facture',
            ],
            [
                'title' => 'Service modifié',
                'message' => 'Le service "Développement web" a été mis à jour.',
                'icon_type' => 'service',
            ],
            [
                'title' => 'Nouvelle entreprise',
                'message' => 'L\'entreprise "ACME Corp" a été ajoutée avec succès.',
                'icon_type' => 'entreprise',
            ],
        ];

        foreach ($notifications as $notificationData) {
            foreach ($admins as $admin) {
                $admin->notify(new AdminNotification(
                    $notificationData['title'],
                    $notificationData['message'],
                    null,
                    $notificationData['icon_type']
                ));
            }
            $this->line("✓ Notification '{$notificationData['title']}' envoyée");
        }

        $this->info("\n🎉 Toutes les notifications de test ont été envoyées avec succès !");
        $this->line("Vous pouvez maintenant voir les notifications dans l'interface d'administration.");

        return 0;
    }
}
