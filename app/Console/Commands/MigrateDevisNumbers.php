<?php

namespace App\Console\Commands;

use App\Models\Devis;
use Illuminate\Console\Command;

class MigrateDevisNumbers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'devis:migrate-numbers {--dry-run : Voir les changements sans les appliquer}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migre tous les numéros de devis vers le nouveau format basé sur l\'ID (DV-25-0001)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $annee = substr(date('Y'), -2);

        $this->info("🔄 Migration des numéros de devis vers le format DV-{$annee}-{ID}");
        $this->info($dryRun ? "Mode DRY RUN - Aucune modification ne sera appliquée" : "Mode ÉCRITURE - Les modifications seront appliquées");
        $this->newLine();

        $devis = Devis::orderBy('id')->get();
        $totalDevis = $devis->count();

        if ($totalDevis === 0) {
            $this->warn('Aucun devis trouvé à migrer.');
            return 0;
        }

        $this->info("📊 {$totalDevis} devis trouvés à migrer");
        $this->newLine();

        $bar = $this->output->createProgressBar($totalDevis);
        $bar->start();

        $modifiés = 0;
        $erreurs = 0;

        foreach ($devis as $unDevis) {
            $ancienNumero = $unDevis->numero_devis;
            $nouveauNumero = sprintf('DV-%s-%04d', $annee, $unDevis->id);

            if ($ancienNumero !== $nouveauNumero) {
                if (!$dryRun) {
                    try {
                        // Mise à jour sans déclencher les événements
                        Devis::withoutEvents(function () use ($unDevis, $nouveauNumero) {
                            $unDevis->update(['numero_devis' => $nouveauNumero]);
                        });

                        $modifiés++;
                    } catch (\Exception $e) {
                        $this->newLine();
                        $this->error("❌ Erreur lors de la migration du devis ID {$unDevis->id}: {$e->getMessage()}");
                        $erreurs++;
                    }
                } else {
                    $this->line("DRY RUN: Devis ID {$unDevis->id}: {$ancienNumero} → {$nouveauNumero}");
                    $modifiés++;
                }
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Résumé
        $this->info("📈 Résumé de la migration:");
        $this->table(
            ['Métrique', 'Valeur'],
            [
                ['Total devis', $totalDevis],
                ['Devis modifiés', $modifiés],
                ['Devis inchangés', $totalDevis - $modifiés],
                ['Erreurs', $erreurs],
            ]
        );

        if ($dryRun && $modifiés > 0) {
            $this->newLine();
            $this->comment("💡 Pour appliquer ces changements, exécutez la commande sans --dry-run:");
            $this->comment("php artisan devis:migrate-numbers");
        }

        if ($erreurs > 0) {
            $this->error("⚠️  {$erreurs} erreur(s) détectée(s) lors de la migration");
            return 1;
        }

        $this->info("✅ Migration terminée avec succès!");
        return 0;
    }
}
