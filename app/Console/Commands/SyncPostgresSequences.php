<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncPostgresSequences extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:sync-sequences {--force : Force la séquence au prochain ID même si elle est plus élevée} {--dry-run : Affiche les changements sans les appliquer}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronise les séquences PostgreSQL avec les valeurs max des tables';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $force = $this->option('force');
        $dryRun = $this->option('dry-run');

        $this->info('🔄 Synchronisation des séquences PostgreSQL...');
        if ($dryRun) {
            $this->warn('Mode DRY RUN - Aucune modification ne sera appliquée');
        }
        if ($force) {
            $this->info('Mode FORCE activé - Les séquences seront forcées au prochain ID disponible');
        }
        $this->newLine();

        // Tables principales avec leurs séquences
        $tables = [
            'historique' => 'historique_id_seq',
            'devis' => 'devis_id_seq',
            'factures' => 'factures_id_seq',
            'clients' => 'clients_id_seq',
            'entreprises' => 'entreprises_id_seq',
            'services' => 'services_id_seq',
            'lignes_devis' => 'lignes_devis_id_seq',
            'lignes_factures' => 'lignes_factures_id_seq',
            'users' => 'users_id_seq',
            'notifications' => 'notifications_id_seq',
            'email_templates' => 'email_templates_id_seq',
            'client_emails' => 'client_emails_id_seq',
            'opportunities' => 'opportunities_id_seq',
            'tickets' => 'tickets_id_seq',
            'todos' => 'todos_id_seq',
        ];

        $synced = 0;
        $errors = 0;

        foreach ($tables as $table => $sequence) {
            try {
                // Vérifier si la table existe
                $tableExists = DB::select("SELECT to_regclass(?) IS NOT NULL as exists", [$table]);
                if (!$tableExists[0]->exists) {
                    $this->warn("⚠️  Table '$table' n'existe pas, ignorée");
                    continue;
                }

                // Vérifier si la séquence existe
                $sequenceExists = DB::select("SELECT to_regclass(?) IS NOT NULL as exists", [$sequence]);
                if (!$sequenceExists[0]->exists) {
                    $this->warn("⚠️  Séquence '$sequence' n'existe pas, ignorée");
                    continue;
                }

                // Obtenir les valeurs actuelles
                $maxId = DB::selectOne("SELECT COALESCE(MAX(id), 0) as max_id FROM $table")->max_id;
                $currentSeqValue = DB::selectOne("SELECT last_value FROM $sequence")->last_value;
                $nextAvailableId = $maxId + 1;

                // Afficher l'état actuel
                $this->line("📊 $table:");
                $this->line("   - Max ID en table: $maxId");
                $this->line("   - Séquence actuelle: $currentSeqValue");
                $this->line("   - Prochain ID disponible: $nextAvailableId");

                // Déterminer la nouvelle valeur de séquence
                if ($force) {
                    // Mode force: toujours régler au prochain ID disponible
                    $newSequenceValue = $nextAvailableId;
                    $action = "forcée";
                } else {
                    // Mode normal: prendre le maximum entre max_id et current_value
                    $newSequenceValue = max($maxId, $currentSeqValue);
                    $action = "synchronisée";
                }

                if ($currentSeqValue != $newSequenceValue) {
                    if (!$dryRun) {
                        // Appliquer le changement
                        DB::statement("SELECT setval('$sequence', $newSequenceValue)");
                        $this->info("   ✅ Séquence $action à $newSequenceValue");
                    } else {
                        $this->comment("   🔄 DRY RUN: Séquence serait $action à $newSequenceValue");
                    }
                    $synced++;
                } else {
                    $this->comment("   ✓ Aucun changement nécessaire");
                }

                $this->newLine();

            } catch (\Exception $e) {
                $this->error("❌ Erreur pour $table: " . $e->getMessage());
                $errors++;
            }
        }

        // Résumé final
        $this->info("📈 Résumé de la synchronisation:");
        $this->table(
            ['Métrique', 'Valeur'],
            [
                ['Tables traitées', count($tables)],
                ['Séquences modifiées', $synced],
                ['Erreurs', $errors],
            ]
        );

        if ($dryRun && $synced > 0) {
            $this->newLine();
            $this->comment("💡 Pour appliquer ces changements, exécutez la commande sans --dry-run:");
            $this->comment("php artisan db:sync-sequences" . ($force ? " --force" : ""));
        }

        if ($errors > 0) {
            $this->error("⚠️  $errors erreurs rencontrées");
            return 1;
        }

        if ($synced > 0) {
            $this->info("🎉 Synchronisation terminée avec succès!");
        } else {
            $this->info("✅ Toutes les séquences sont déjà synchronisées.");
        }

        return 0;
    }
}
