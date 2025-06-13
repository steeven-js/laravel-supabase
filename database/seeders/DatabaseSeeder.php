<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Vérifier si on doit utiliser l'import Firebase
        if ($this->command->confirm('Voulez-vous importer les données depuis Firebase ?', false)) {
            $this->runFirebaseImport();
            return;
        }

        // Créer l'utilisateur principal
        $this->createMainUser();

        // Créer les données de test en ordre de dépendance
        $this->call([
            MadiniaSeeder::class,
            EntrepriseSeeder::class,
            ClientSeeder::class,
            ServiceSeeder::class,
            DevisSeeder::class,
            // FactureSeeder::class, // Supprimé selon les instructions
        ]);

        $this->command->info('🎉 Toutes les données ont été créées avec succès !');
        $this->command->info('📧 Utilisateur principal : jacques.steeven@gmail.com');
        $this->command->info('🔑 Mot de passe : password');

        // Afficher les statistiques
        $this->afficherStatistiques();
    }

    /**
     * Exécuter l'import Firebase
     */
    private function runFirebaseImport(): void
    {
        $this->command->info('🔥 Démarrage de l\'importation Firebase...');

        // Vérifier la présence des fichiers JSON
        $requiredFiles = [
            'users_export_2025-06-13.json',
            'companies_export_2025-06-13.json',
            'customers_export_2025-06-13.json',
            'devis_export_2025-06-13.json'
        ];

        $missingFiles = [];
        foreach ($requiredFiles as $file) {
            if (!file_exists(base_path($file))) {
                $missingFiles[] = $file;
            }
        }

        if (!empty($missingFiles)) {
            $this->command->error('❌ Fichiers manquants :');
            foreach ($missingFiles as $file) {
                $this->command->error("  - {$file}");
            }
            return;
        }

        // Demander confirmation
        if (!$this->command->confirm('Les fichiers Firebase ont été trouvés. Continuer l\'importation ?')) {
            $this->command->info('Importation annulée.');
            return;
        }

        // Créer d'abord les services et Madinia si nécessaire
        $this->call([
            MadiniaSeeder::class,
            ServiceSeeder::class,
        ]);

        // Puis l'import Firebase
        $this->call(FirebaseImportSeeder::class);

        $this->command->info('');
        $this->command->info('🎉 Importation Firebase terminée avec succès !');
        $this->command->info('📧 Connectez-vous avec les emails des administrateurs importés');
        $this->command->info('🔑 Mot de passe par défaut : password123');
    }

    /**
     * Créer l'utilisateur principal
     */
    private function createMainUser(): void
    {
        // Supprimer l'utilisateur s'il existe déjà
        User::where('email', 'jacques.steeven@gmail.com')->delete();

        $user = User::create([
            'name' => 'Jacques Steeven',
            'email' => 'jacques.steeven@gmail.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
        ]);

        $this->command->info("✅ Utilisateur principal créé : {$user->email}");
    }

    /**
     * Afficher les statistiques des données créées
     */
    private function afficherStatistiques(): void
    {
        $stats = [
            'Utilisateurs' => User::count(),
            'Entreprise (Madinia)' => \App\Models\Madinia::count(),
            'Services' => \App\Models\Service::count(),
            'Entreprises' => \App\Models\Entreprise::count(),
            'Clients' => \App\Models\Client::count(),
            'Devis' => \App\Models\Devis::count(),
            'Factures' => \App\Models\Facture::count(),
        ];

        $this->command->info('');
        $this->command->info('📊 Statistiques des données créées :');
        $this->command->info('─────────────────────────────────────');

        foreach ($stats as $type => $count) {
            $this->command->info("  {$type}: {$count}");
        }

        // Statistiques détaillées pour les devis
        $devisStats = [
            'Brouillon' => \App\Models\Devis::where('statut', 'brouillon')->count(),
            'Envoyé' => \App\Models\Devis::where('statut', 'envoye')->count(),
            'Accepté' => \App\Models\Devis::where('statut', 'accepte')->count(),
            'Refusé' => \App\Models\Devis::where('statut', 'refuse')->count(),
            'Expiré' => \App\Models\Devis::where('statut', 'expire')->count(),
        ];

        $this->command->info('');
        $this->command->info('📋 Répartition des devis par statut :');
        foreach ($devisStats as $statut => $count) {
            $this->command->info("  {$statut}: {$count}");
        }

        // Statistiques détaillées pour les factures (si elles existent)
        $factureCount = \App\Models\Facture::count();
        if ($factureCount > 0) {
            $factureStats = [
                'Brouillon' => \App\Models\Facture::where('statut', 'brouillon')->count(),
                'Envoyée' => \App\Models\Facture::where('statut', 'envoyee')->count(),
                'Payée' => \App\Models\Facture::where('statut', 'payee')->count(),
                'En retard' => \App\Models\Facture::where('statut', 'en_retard')->count(),
                'Annulée' => \App\Models\Facture::where('statut', 'annulee')->count(),
            ];

            $this->command->info('');
            $this->command->info('💰 Répartition des factures par statut :');
            foreach ($factureStats as $statut => $count) {
                $this->command->info("  {$statut}: {$count}");
            }

            // Montant total des factures
            $montantTotal = \App\Models\Facture::sum('montant_ttc');
            $this->command->info('');
            $this->command->info("💰 Montant total des factures : " . number_format($montantTotal, 2, ',', ' ') . "€");
        }
    }

    /**
     * Reset toutes les données sauf l'utilisateur principal
     */
    public static function resetDataKeepUser(): void
    {
        // Augmenter le timeout pour cette opération
        set_time_limit(120);

        DB::transaction(function () {
            // Désactiver les contraintes de clés étrangères temporairement (PostgreSQL)
            DB::statement('SET session_replication_role = replica;');

            try {
                // Utiliser truncate pour plus d'efficacité (plus rapide que delete)
                DB::table('lignes_factures')->truncate();
                DB::table('lignes_devis')->truncate();
                DB::table('factures')->truncate();
                DB::table('devis')->truncate();
                DB::table('clients')->truncate();
                DB::table('entreprises')->truncate();
                DB::table('services')->truncate();

                // Garder seulement l'utilisateur principal (utiliser delete pour la condition WHERE)
                \App\Models\User::where('email', '!=', 'jacques.steeven@gmail.com')->delete();

                // Réactiver les contraintes de clés étrangères (PostgreSQL)
                DB::statement('SET session_replication_role = DEFAULT;');

                // Recréer les données
                $seeder = new self();
                $seeder->call([
                    MadiniaSeeder::class,
                    EntrepriseSeeder::class,
                    ClientSeeder::class,
                    ServiceSeeder::class,
                    DevisSeeder::class,
                    FactureSeeder::class,
                ]);

            } catch (\Exception $e) {
                // Réactiver les contraintes en cas d'erreur (PostgreSQL)
                DB::statement('SET session_replication_role = DEFAULT;');
                throw $e;
            }
        });
    }

    /**
     * Reset toutes les données y compris l'utilisateur
     */
    public static function resetAllData(): void
    {
        // Augmenter le timeout pour cette opération
        set_time_limit(120);

        DB::transaction(function () {
            // Désactiver les contraintes de clés étrangères temporairement (PostgreSQL)
            DB::statement('SET session_replication_role = replica;');

            try {
                // Utiliser truncate pour plus d'efficacité
                DB::table('lignes_factures')->truncate();
                DB::table('lignes_devis')->truncate();
                DB::table('factures')->truncate();
                DB::table('devis')->truncate();
                DB::table('clients')->truncate();
                DB::table('entreprises')->truncate();
                DB::table('services')->truncate();
                DB::table('users')->truncate();

                // Réactiver les contraintes de clés étrangères (PostgreSQL)
                DB::statement('SET session_replication_role = DEFAULT;');

                // Recréer toutes les données
                $seeder = new self();
                $seeder->run();

            } catch (\Exception $e) {
                // Réactiver les contraintes en cas d'erreur (PostgreSQL)
                DB::statement('SET session_replication_role = DEFAULT;');
                throw $e;
            }
        });
    }
}
