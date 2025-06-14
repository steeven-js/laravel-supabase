<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Service;

class RefreshServicesCode extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'services:refresh-codes
                            {--force : Forcer la mise à jour même pour les codes déjà conformes}
                            {--dry-run : Simuler les changements sans les appliquer}';

    /**
     * The console command description.
     */
    protected $description = 'Rafraîchit tous les codes de services selon le format SRV-25-XXX';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');
        $isForce = $this->option('force');
        $annee = date('y');

        if ($isDryRun) {
            $this->info('🔍 Mode simulation - Aucun changement ne sera appliqué');
        }

        if ($isForce) {
            $this->warn('⚠️  Mode force activé - Tous les codes seront mis à jour');
        }

        $this->line('');
        $this->info("🔄 Rafraîchissement des codes de services au format SRV-{$annee}-XXX");
        $this->line('');

        $services = Service::orderBy('id')->get();

        if ($services->isEmpty()) {
            $this->warn('Aucun service trouvé.');
            return Command::SUCCESS;
        }

        $this->info("📊 {$services->count()} services à analyser");
        $this->line('');

        $updated = 0;
        $skipped = 0;
        $conflicts = 0;

        $progressBar = $this->output->createProgressBar($services->count());
        $progressBar->setFormat(' %current%/%max% [%bar%] %percent:3s%% %message%');
        $progressBar->setMessage('Démarrage...');
        $progressBar->start();

        foreach ($services as $service) {
            $ancienCode = $service->code;
            $id = str_pad($service->id, 3, '0', STR_PAD_LEFT);
            $nouveauCode = "SRV-{$annee}-{$id}";

            $progressBar->setMessage("Service #{$service->id}: {$service->nom}");

            // Vérifier si le code est déjà au bon format
            if ($ancienCode === $nouveauCode && !$isForce) {
                $skipped++;
                $progressBar->advance();
                continue;
            }

            // Vérifier les conflits potentiels
            if ($ancienCode !== $nouveauCode) {
                $existing = Service::where('code', $nouveauCode)
                                  ->where('id', '!=', $service->id)
                                  ->first();

                if ($existing) {
                    $conflicts++;
                    $progressBar->advance();
                    continue;
                }
            }

            if (!$isDryRun) {
                $service->update(['code' => $nouveauCode]);
            }

            $updated++;
            $progressBar->advance();
        }

        $progressBar->setMessage('Terminé !');
        $progressBar->finish();
        $this->line('');
        $this->line('');

        // Afficher les détails
        $this->info('📋 Détails des changements :');
        $this->line('');

        if ($updated > 0) {
            $services->each(function ($service) use ($annee, $isDryRun, $isForce) {
                $ancienCode = $service->code;
                $id = str_pad($service->id, 3, '0', STR_PAD_LEFT);
                $nouveauCode = "SRV-{$annee}-{$id}";

                if ($ancienCode !== $nouveauCode || $isForce) {
                    if ($isDryRun) {
                        $this->line("🔄 #{$service->id}: {$ancienCode} → {$nouveauCode}");
                    } else {
                        $this->line("✅ #{$service->id}: {$ancienCode} → {$nouveauCode}");
                    }
                }
            });
        }

        if ($conflicts > 0) {
            $this->line('');
            $this->error("⚠️  {$conflicts} conflits détectés - Ces services n'ont pas été mis à jour");
        }

        // Résumé final
        $this->line('');

        if ($isDryRun) {
            $this->info('📊 Résumé de la simulation :');
            $this->line("   • Services à mettre à jour : {$updated}");
            $this->line("   • Services déjà conformes : {$skipped}");
            $this->line("   • Conflits détectés : {$conflicts}");
            $this->line('');
            $this->info('💡 Pour appliquer les changements : php artisan services:refresh-codes');
            if ($conflicts > 0) {
                $this->warn('💡 Pour forcer la mise à jour : php artisan services:refresh-codes --force');
            }
        } else {
            $this->info('✅ Rafraîchissement terminé !');
            $this->line("   • Services mis à jour : {$updated}");
            $this->line("   • Services déjà conformes : {$skipped}");
            if ($conflicts > 0) {
                $this->line("   • Conflits ignorés : {$conflicts}");
            }
        }

        return Command::SUCCESS;
    }
}
