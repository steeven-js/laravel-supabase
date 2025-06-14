<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Service;

class UpdateServicesCodeFormat extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'services:update-codes {--dry-run : Afficher les changements sans les appliquer}';

    /**
     * The console command description.
     */
    protected $description = 'Met à jour les codes de services au format SRV-25-001';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $services = Service::all();
        $annee = date('y'); // Année sur 2 digits
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->info('🔍 Mode simulation - Aucun changement ne sera appliqué');
            $this->line('');
        }

        $this->info("📋 Mise à jour des codes de services au format SRV-{$annee}-XXX");
        $this->line('');

        if ($services->isEmpty()) {
            $this->warn('Aucun service trouvé.');
            return Command::SUCCESS;
        }

        $updated = 0;
        $skipped = 0;

        foreach ($services as $service) {
            $ancienCode = $service->code;
            $id = str_pad($service->id, 3, '0', STR_PAD_LEFT);
            $nouveauCode = "SRV-{$annee}-{$id}";

            // Vérifier si le code est déjà au bon format
            if ($ancienCode === $nouveauCode) {
                $this->line("⏭️  Service #{$service->id} : Code déjà au bon format ({$nouveauCode})");
                $skipped++;
                continue;
            }

            // Vérifier si le nouveau code existe déjà
            if (Service::where('code', $nouveauCode)->where('id', '!=', $service->id)->exists()) {
                $this->error("❌ Conflit : Le code {$nouveauCode} existe déjà pour un autre service");
                continue;
            }

            if ($isDryRun) {
                $this->line("🔄 Service #{$service->id} : {$ancienCode} → {$nouveauCode}");
            } else {
                $service->update(['code' => $nouveauCode]);
                $this->line("✅ Service #{$service->id} : {$ancienCode} → {$nouveauCode}");
            }

            $updated++;
        }

        $this->line('');

        if ($isDryRun) {
            $this->info("📊 Résumé de la simulation :");
            $this->line("   • Services à mettre à jour : {$updated}");
            $this->line("   • Services déjà conformes : {$skipped}");
            $this->line('');
            $this->info('Pour appliquer les changements, exécutez la commande sans --dry-run');
        } else {
            $this->info("✅ Mise à jour terminée !");
            $this->line("   • Services mis à jour : {$updated}");
            $this->line("   • Services déjà conformes : {$skipped}");
        }

        return Command::SUCCESS;
    }
}
