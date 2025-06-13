<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\FirebaseImportSeeder;
use Database\Seeders\MadiniaSeeder;
use Database\Seeders\ServiceSeeder;
use Illuminate\Support\Facades\DB;

class ImportFirebaseData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'firebase:import
                            {--fresh : Vider la base avant l\'import}
                            {--force : Forcer l\'import sans confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Importer les données depuis les exports Firebase JSON';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔥 Import des données Firebase vers Supabase');
        $this->info('═══════════════════════════════════════════');

        // Vérifier la présence des fichiers JSON
        $requiredFiles = [
            'users_export_2025-06-13.json' => 'Utilisateurs Firebase',
            'companies_export_2025-06-13.json' => 'Entreprises',
            'customers_export_2025-06-13.json' => 'Clients',
            'devis_export_2025-06-13.json' => 'Devis'
        ];

        $this->info('📂 Vérification des fichiers...');
        $missingFiles = [];
        foreach ($requiredFiles as $file => $description) {
            if (file_exists(base_path($file))) {
                $this->line("  ✅ {$description}: {$file}");
            } else {
                $this->line("  ❌ {$description}: {$file} (manquant)");
                $missingFiles[] = $file;
            }
        }

        if (!empty($missingFiles)) {
            $this->error('');
            $this->error('❌ Fichiers manquants détectés !');
            $this->error('Veuillez placer les fichiers d\'export Firebase à la racine du projet.');
            return Command::FAILURE;
        }

        $this->info('');
        $this->info('✅ Tous les fichiers sont présents !');

        // Option fresh
        if ($this->option('fresh')) {
            if ($this->option('force') || $this->confirm('⚠️  Voulez-vous vraiment vider la base de données ?')) {
                $this->freshDatabase();
            }
        }

        // Confirmation finale
        if (!$this->option('force')) {
            if (!$this->confirm('Démarrer l\'importation des données Firebase ?')) {
                $this->info('Import annulé.');
                return Command::SUCCESS;
            }
        }

        // Import
        $this->performImport();

        return Command::SUCCESS;
    }

    /**
     * Vider la base de données
     */
    private function freshDatabase(): void
    {
        $this->info('🗑️  Vidage de la base de données...');

        try {
            // Désactiver les contraintes de clés étrangères temporairement
            DB::statement('SET session_replication_role = replica;');

            // Tables dans l'ordre pour éviter les erreurs de contraintes
            $tables = [
                'lignes_factures',
                'lignes_devis',
                'factures',
                'devis',
                'client_emails',
                'clients',
                'entreprises',
                'historique',
                'opportunities',
                'tickets',
                'todos',
                'users'
            ];

            foreach ($tables as $table) {
                if (DB::getSchemaBuilder()->hasTable($table)) {
                    DB::table($table)->truncate();
                    $this->line("  ✅ Table {$table} vidée");
                }
            }

            // Réactiver les contraintes
            DB::statement('SET session_replication_role = DEFAULT;');

            $this->info('✅ Base de données vidée avec succès');

        } catch (\Exception $e) {
            // Réactiver les contraintes en cas d'erreur
            DB::statement('SET session_replication_role = DEFAULT;');
            $this->error("❌ Erreur lors du vidage : " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Effectuer l'import
     */
    private function performImport(): void
    {
        $this->info('');
        $this->info('🚀 Démarrage de l\'importation...');

        try {
            // Créer d'abord les données de base
            $this->call('db:seed', [
                '--class' => MadiniaSeeder::class,
                '--quiet' => true
            ]);

            $this->call('db:seed', [
                '--class' => ServiceSeeder::class,
                '--quiet' => true
            ]);

            // Puis l'import Firebase
            $this->call('db:seed', [
                '--class' => FirebaseImportSeeder::class
            ]);

            $this->info('');
            $this->info('🎉 Import terminé avec succès !');
            $this->displayFinalInstructions();

        } catch (\Exception $e) {
            $this->error('❌ Erreur lors de l\'import : ' . $e->getMessage());
            return;
        }
    }

    /**
     * Afficher les instructions finales
     */
    private function displayFinalInstructions(): void
    {
        $this->info('');
        $this->info('📋 Instructions de connexion :');
        $this->info('─────────────────────────────');
        $this->info('📧 Emails des administrateurs importés :');

        // Lister les emails des utilisateurs importés
        $users = \App\Models\User::select('name', 'email')->get();
        foreach ($users as $user) {
            $this->line("  • {$user->name} : {$user->email}");
        }

        $this->info('');
        $this->info('🔑 Mot de passe par défaut : password123');
        $this->info('');
        $this->info('⚠️  N\'oubliez pas de changer les mots de passe après la première connexion !');

        // Statistiques
        $this->info('');
        $this->info('📊 Données importées :');
        $this->info("  • Utilisateurs : " . \App\Models\User::count());
        $this->info("  • Entreprises : " . \App\Models\Entreprise::count());
        $this->info("  • Clients : " . \App\Models\Client::count());
        $this->info("  • Devis : " . \App\Models\Devis::count());
        $this->info("  • Lignes de devis : " . \App\Models\LigneDevis::count());
    }
}
