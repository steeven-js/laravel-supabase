<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class SyncAllPdfsToSupabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pdfs:sync-supabase
                            {--force : Forcer la synchronisation même si les fichiers existent déjà}
                            {--generate : Générer les PDFs manquants avant la synchronisation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronise tous les PDFs (devis et factures) vers Supabase Storage';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🚀 Synchronisation globale des PDFs vers Supabase Storage...');
        $this->newLine();

        $generate = $this->option('generate');
        $force = $this->option('force');

        $totalSuccess = 0;
        $totalErrors = 0;

        // Synchroniser les devis
        $this->info('📋 === SYNCHRONISATION DES DEVIS ===');

        if ($generate) {
            $exitCode = Artisan::call('devis:generate-pdfs', [
                '--sync-supabase' => true,
                '--force' => $force
            ]);
        } else {
            $exitCode = Artisan::call('devis:generate-pdfs', [
                '--only-supabase' => true
            ]);
        }

        $this->line(Artisan::output());

        if ($exitCode === 0) {
            $this->info('✅ Synchronisation des devis terminée avec succès');
        } else {
            $this->error('❌ Erreurs lors de la synchronisation des devis');
            $totalErrors++;
        }

        $this->newLine();

        // Synchroniser les factures
        $this->info('🧾 === SYNCHRONISATION DES FACTURES ===');

        if ($generate) {
            $exitCode = Artisan::call('factures:generate-pdfs', [
                '--sync-supabase' => true,
                '--force' => $force
            ]);
        } else {
            $exitCode = Artisan::call('factures:generate-pdfs', [
                '--only-supabase' => true
            ]);
        }

        $this->line(Artisan::output());

        if ($exitCode === 0) {
            $this->info('✅ Synchronisation des factures terminée avec succès');
            $totalSuccess++;
        } else {
            $this->error('❌ Erreurs lors de la synchronisation des factures');
            $totalErrors++;
        }

        $this->newLine();

        // Résumé global
        $this->info('📊 === RÉSUMÉ GLOBAL ===');
        $this->table(
            ['Type', 'Statut'],
            [
                ['Devis', $exitCode === 0 ? '✅ Succès' : '❌ Erreur'],
                ['Factures', $totalSuccess > 0 ? '✅ Succès' : '❌ Erreur'],
            ]
        );

        if ($totalErrors === 0) {
            $this->info('🎉 Synchronisation globale terminée avec succès !');
            $this->comment('💡 Tous vos PDFs sont maintenant disponibles sur Supabase Storage.');
        } else {
            $this->warn("⚠️  Synchronisation terminée avec {$totalErrors} erreur(s).");
        }

        return $totalErrors > 0 ? self::FAILURE : self::SUCCESS;
    }
}
