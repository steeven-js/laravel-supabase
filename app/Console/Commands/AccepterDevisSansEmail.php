<?php

namespace App\Console\Commands;

use App\Models\Devis;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;

class AccepterDevisSansEmail extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'devis:accepter-sans-email {devis_id}';

    /**
     * The console command description.
     */
    protected $description = 'Accepte un devis sans envoyer d\'emails (contournement temporaire)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $devisId = $this->argument('devis_id');

        $devis = Devis::find($devisId);

        if (!$devis) {
            $this->error("Devis ID {$devisId} non trouvé");
            return 1;
        }

        $this->info("Acceptation du devis: {$devis->numero_devis}");
        $this->info("Statut actuel: {$devis->statut}");

        // Authentifier un utilisateur admin pour l'historique
        $admin = User::whereHas('userRole', function($q) {
            $q->whereIn('name', ['admin', 'super_admin']);
        })->first();

        if (!$admin) {
            $this->error('Aucun utilisateur admin trouvé');
            return 1;
        }

        Auth::login($admin);
        $this->info("Authentifié en tant que: {$admin->name}");

        try {
            // Accepter le devis manuellement sans emails
            $ancienStatut = $devis->statut;
            $devis->statut = 'accepte';
            $devis->date_acceptation = now();

            $result = $devis->save();

            if ($result) {
                // Enregistrer l'historique manuellement
                $devis->enregistrerHistorique(
                    'changement_statut',
                    "Devis accepté (sans email)",
                    "Le devis #{$devis->numero_devis} a été accepté manuellement via commande",
                    ['statut' => $ancienStatut],
                    ['statut' => 'accepte', 'date_acceptation' => $devis->date_acceptation->format('Y-m-d H:i:s')]
                );

                $this->info('✅ Devis accepté avec succès !');
                $this->info("Nouveau statut: {$devis->statut}");
                $this->info("Date d'acceptation: {$devis->date_acceptation}");
                $this->warn('⚠️ Les emails de confirmation n\'ont pas été envoyés');
                $this->info('Vous devez informer manuellement le client de l\'acceptation.');

                return 0;
            } else {
                $this->error('❌ Échec de l\'acceptation du devis');
                return 1;
            }

        } catch (\Exception $e) {
            $this->error('❌ Erreur lors de l\'acceptation: ' . $e->getMessage());
            return 1;
        }
    }
}
