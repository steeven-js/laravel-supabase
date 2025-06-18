<?php

namespace App\Console\Commands;

use App\Models\Devis;
use App\Models\Facture;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class MigratePdfFilenames extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pdf:migrate-filenames {--dry-run : Voir les changements sans les appliquer} {--type=all : Type à migrer (devis, factures, all)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migre les noms de fichiers PDF vers le nouveau format basé sur les numéros';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $type = $this->option('type');

        $this->info("🔄 Migration des noms de fichiers PDF vers le format basé sur les numéros");
        $this->info($dryRun ? "Mode DRY RUN - Aucune modification ne sera appliquée" : "Mode ÉCRITURE - Les modifications seront appliquées");
        $this->newLine();

        $totalMigrations = 0;
        $totalErreurs = 0;

        if ($type === 'all' || $type === 'devis') {
            $this->info("📋 Migration des PDFs de devis...");
            [$migrations, $erreurs] = $this->migrerDevis($dryRun);
            $totalMigrations += $migrations;
            $totalErreurs += $erreurs;
            $this->newLine();
        }

        if ($type === 'all' || $type === 'factures') {
            $this->info("🧾 Migration des PDFs de factures...");
            [$migrations, $erreurs] = $this->migrerFactures($dryRun);
            $totalMigrations += $migrations;
            $totalErreurs += $erreurs;
            $this->newLine();
        }

        // Résumé final
        $this->info("📈 Résumé de la migration:");
        $this->table(
            ['Métrique', 'Valeur'],
            [
                ['Total fichiers migrés', $totalMigrations],
                ['Total erreurs', $totalErreurs],
            ]
        );

        if ($dryRun && $totalMigrations > 0) {
            $this->newLine();
            $this->comment("💡 Pour appliquer ces changements, exécutez la commande sans --dry-run:");
            $this->comment("php artisan pdf:migrate-filenames --type={$type}");
        }

        if ($totalErreurs > 0) {
            $this->error("⚠️  {$totalErreurs} erreur(s) détectée(s) lors de la migration");
            return 1;
        }

        $this->info("✅ Migration terminée avec succès!");
        return 0;
    }

    /**
     * Migre les PDFs de devis
     */
    private function migrerDevis(bool $dryRun): array
    {
        $devis = Devis::whereNotNull('pdf_file')->get();
        $migrations = 0;
        $erreurs = 0;

        if ($devis->isEmpty()) {
            $this->warn('Aucun devis avec PDF trouvé.');
            return [$migrations, $erreurs];
        }

        $bar = $this->output->createProgressBar($devis->count());
        $bar->start();

        foreach ($devis as $unDevis) {
            try {
                $ancienNom = $unDevis->pdf_file;
                $nouveauNom = "devis_{$unDevis->numero_devis}.pdf";

                if ($ancienNom !== $nouveauNom) {
                    if ($dryRun) {
                        $this->line("DRY RUN: Devis {$unDevis->numero_devis}: {$ancienNom} → {$nouveauNom}");
                    } else {
                        // Renommer le fichier local s'il existe
                        if (Storage::disk('public')->exists("pdfs/devis/{$ancienNom}")) {
                            Storage::disk('public')->move(
                                "pdfs/devis/{$ancienNom}",
                                "pdfs/devis/{$nouveauNom}"
                            );
                        }

                        // Mettre à jour la base de données
                        $unDevis->update(['pdf_file' => $nouveauNom]);

                        // Mettre à jour l'URL Supabase si elle existe
                        if ($unDevis->pdf_url) {
                            $nouvelleUrl = str_replace($ancienNom, $nouveauNom, $unDevis->pdf_url);
                            $unDevis->update(['pdf_url' => $nouvelleUrl]);
                        }

                        Log::info('PDF devis renommé', [
                            'devis_id' => $unDevis->id,
                            'ancien_nom' => $ancienNom,
                            'nouveau_nom' => $nouveauNom
                        ]);
                    }
                    $migrations++;
                }
            } catch (\Exception $e) {
                $this->newLine();
                $this->error("❌ Erreur lors de la migration du devis {$unDevis->numero_devis}: {$e->getMessage()}");
                $erreurs++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        return [$migrations, $erreurs];
    }

    /**
     * Migre les PDFs de factures
     */
    private function migrerFactures(bool $dryRun): array
    {
        $factures = Facture::whereNotNull('pdf_file')->get();
        $migrations = 0;
        $erreurs = 0;

        if ($factures->isEmpty()) {
            $this->warn('Aucune facture avec PDF trouvée.');
            return [$migrations, $erreurs];
        }

        $bar = $this->output->createProgressBar($factures->count());
        $bar->start();

        foreach ($factures as $facture) {
            try {
                $ancienNom = $facture->pdf_file;
                $nouveauNom = "facture_{$facture->numero_facture}.pdf";

                if ($ancienNom !== $nouveauNom) {
                    if ($dryRun) {
                        $this->line("DRY RUN: Facture {$facture->numero_facture}: {$ancienNom} → {$nouveauNom}");
                    } else {
                        // Renommer le fichier local s'il existe
                        if (Storage::disk('public')->exists("pdfs/factures/{$ancienNom}")) {
                            Storage::disk('public')->move(
                                "pdfs/factures/{$ancienNom}",
                                "pdfs/factures/{$nouveauNom}"
                            );
                        }

                        // Mettre à jour la base de données
                        $facture->update(['pdf_file' => $nouveauNom]);

                        // Mettre à jour l'URL Supabase si elle existe
                        if ($facture->pdf_url) {
                            $nouvelleUrl = str_replace($ancienNom, $nouveauNom, $facture->pdf_url);
                            $facture->update(['pdf_url' => $nouvelleUrl]);
                        }

                        Log::info('PDF facture renommé', [
                            'facture_id' => $facture->id,
                            'ancien_nom' => $ancienNom,
                            'nouveau_nom' => $nouveauNom
                        ]);
                    }
                    $migrations++;
                }
            } catch (\Exception $e) {
                $this->newLine();
                $this->error("❌ Erreur lors de la migration de la facture {$facture->numero_facture}: {$e->getMessage()}");
                $erreurs++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        return [$migrations, $erreurs];
    }
}
