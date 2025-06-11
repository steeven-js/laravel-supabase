<?php

namespace App\Console\Commands;

use App\Models\Devis;
use App\Models\Facture;
use App\Services\DevisPdfService;
use App\Services\FacturePdfService;
use Illuminate\Console\Command;

class UpdatePdfUrls extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pdfs:update-urls {--force : Mettre à jour même si l\'URL existe déjà}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Met à jour les URLs Supabase des PDFs pour tous les devis et factures existants';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔗 Mise à jour des URLs Supabase des PDFs...');
        $this->newLine();

        $force = $this->option('force');

        // Mettre à jour les devis
        $this->updateDevisUrls($force);

        // Mettre à jour les factures
        $this->updateFacturesUrls($force);

        $this->newLine();
        $this->info('✅ Mise à jour des URLs terminée !');
    }

    private function updateDevisUrls(bool $force): void
    {
        $this->info('📋 Mise à jour des URLs des devis...');

        $devisPdfService = app(DevisPdfService::class);

        $query = Devis::whereNotNull('pdf_file');

        if (!$force) {
            $query->whereNull('pdf_url');
        }

        $devis = $query->get();

        if ($devis->isEmpty()) {
            $this->warn('   Aucun devis à mettre à jour.');
            return;
        }

        $this->info("   {$devis->count()} devis à traiter...");

        $bar = $this->output->createProgressBar($devis->count());
        $bar->start();

        $updated = 0;
        $errors = 0;

        foreach ($devis as $devisItem) {
            try {
                $urlSupabase = $devisPdfService->getUrlSupabasePdf($devisItem);

                if ($urlSupabase) {
                    $devisItem->pdf_url = $urlSupabase;
                    $devisItem->save();
                    $updated++;
                } else {
                    $errors++;
                }
            } catch (\Exception $e) {
                $this->newLine();
                $this->error("   Erreur devis {$devisItem->numero_devis}: {$e->getMessage()}");
                $errors++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $this->info("   ✅ Devis: {$updated} URLs mises à jour, {$errors} erreurs");
    }

    private function updateFacturesUrls(bool $force): void
    {
        $this->info('🧾 Mise à jour des URLs des factures...');

        $facturePdfService = app(FacturePdfService::class);

        $query = Facture::whereNotNull('pdf_file');

        if (!$force) {
            $query->whereNull('pdf_url');
        }

        $factures = $query->get();

        if ($factures->isEmpty()) {
            $this->warn('   Aucune facture à mettre à jour.');
            return;
        }

        $this->info("   {$factures->count()} factures à traiter...");

        $bar = $this->output->createProgressBar($factures->count());
        $bar->start();

        $updated = 0;
        $errors = 0;

        foreach ($factures as $factureItem) {
            try {
                $urlSupabase = $facturePdfService->getUrlSupabasePdf($factureItem);

                if ($urlSupabase) {
                    $factureItem->pdf_url = $urlSupabase;
                    $factureItem->save();
                    $updated++;
                } else {
                    $errors++;
                }
            } catch (\Exception $e) {
                $this->newLine();
                $this->error("   Erreur facture {$factureItem->numero_facture}: {$e->getMessage()}");
                $errors++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $this->info("   ✅ Factures: {$updated} URLs mises à jour, {$errors} erreurs");
    }
}
