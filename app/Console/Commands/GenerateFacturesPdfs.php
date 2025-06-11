<?php

namespace App\Console\Commands;

use App\Models\Facture;
use App\Services\FacturePdfService;
use Illuminate\Console\Command;
use Exception;

class GenerateFacturesPdfs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'factures:generate-pdfs
                                        {--force : Régénérer les PDFs même s\'ils existent déjà}
                                        {--sync-supabase : Synchroniser tous les PDFs existants vers Supabase Storage}
                                        {--only-supabase : Uniquement synchroniser vers Supabase sans générer de nouveaux PDFs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Génère les PDFs pour toutes les factures existantes et les synchronise avec Supabase Storage';

    /**
     * Execute the console command.
     */
        public function handle(FacturePdfService $facturePdfService): int
    {
        $onlySupabase = $this->option('only-supabase');
        $syncSupabase = $this->option('sync-supabase') || $onlySupabase;
        $force = $this->option('force');

        if ($onlySupabase) {
            return $this->handleSupabaseSync($facturePdfService);
        }

        $this->info('🚀 Génération des PDFs des factures...');

        // Récupérer toutes les factures actives
        $query = Facture::with(['client.entreprise', 'devis'])
            ->where('archive', false);

        if (!$force) {
            // Uniquement les factures sans PDF existant
            $query->whereNull('pdf_file');
        }

        $factures = $query->get();

        if ($factures->isEmpty()) {
            if ($force) {
                $this->warn('Aucune facture trouvée.');
            } else {
                $this->warn('Aucune facture sans PDF trouvée. Utilisez --force pour régénérer tous les PDFs.');
            }

            if ($syncSupabase) {
                return $this->handleSupabaseSync($facturePdfService);
            }

            return 0;
        }

        $this->info("📄 {$factures->count()} facture(s) à traiter...");

        $bar = $this->output->createProgressBar($factures->count());
        $bar->start();

        $succes = 0;
        $erreurs = 0;

        foreach ($factures as $factureItem) {
            try {
                $nomFichier = $force
                    ? $facturePdfService->mettreAJour($factureItem)
                    : $facturePdfService->genererEtSauvegarder($factureItem);

                $factureItem->pdf_file = $nomFichier;
                $factureItem->save();

                $succes++;
            } catch (Exception $e) {
                $this->newLine();
                $this->error("❌ Erreur pour la facture {$factureItem->numero_facture}: {$e->getMessage()}");
                $erreurs++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Afficher le résumé
        $this->table(
            ['Résultat', 'Nombre'],
            [
                ['✅ Succès', $succes],
                ['❌ Erreurs', $erreurs],
                ['📊 Total', $factures->count()],
            ]
        );

        if ($succes > 0) {
            $this->info("🎉 Génération terminée! {$succes} PDF(s) généré(s) avec succès.");
        }

        if ($erreurs > 0) {
            $this->warn("⚠️  {$erreurs} erreur(s) rencontrée(s).");
        }

        // Synchroniser vers Supabase si demandé
        if ($syncSupabase) {
            $this->newLine();
            $this->handleSupabaseSync($facturePdfService);
        }

        return $erreurs > 0 ? 1 : 0;
    }

    /**
     * Gère la synchronisation des PDFs vers Supabase Storage
     */
    private function handleSupabaseSync(FacturePdfService $facturePdfService): int
    {
        $this->info('🔄 Synchronisation des PDFs vers Supabase Storage...');

        // Récupérer toutes les factures ayant un PDF
        $factures = Facture::with(['client.entreprise', 'devis'])
            ->where('archive', false)
            ->whereNotNull('pdf_file')
            ->get();

        if ($factures->isEmpty()) {
            $this->warn('Aucune facture avec PDF trouvée pour la synchronisation.');
            return 0;
        }

        $this->info("📤 {$factures->count()} facture(s) à synchroniser vers Supabase...");

        $bar = $this->output->createProgressBar($factures->count());
        $bar->start();

        $synchronises = 0;
        $erreurs = 0;
        $deja_synchro = 0;

        foreach ($factures as $factureItem) {
            try {
                // Vérifier si le PDF existe localement
                $cheminLocal = $facturePdfService->getCheminPdf($factureItem);

                if (!$cheminLocal || !file_exists($cheminLocal)) {
                    $this->newLine();
                    $this->warn("⚠️  PDF local introuvable pour la facture {$factureItem->numero_facture}");
                    $erreurs++;
                    $bar->advance();
                    continue;
                }

                                 // Vérifier si déjà sur Supabase
                 $urlSupabase = $facturePdfService->getUrlSupabasePdf($factureItem);
                 if ($urlSupabase && $this->checkUrlExists($urlSupabase)) {
                     $deja_synchro++;
                 } else {
                     // Synchroniser vers Supabase
                     if ($facturePdfService->synchroniserVersSupabase($factureItem)) {
                         $synchronises++;
                     } else {
                         $erreurs++;
                     }
                 }

            } catch (Exception $e) {
                $this->newLine();
                $this->error("❌ Erreur sync facture {$factureItem->numero_facture}: {$e->getMessage()}");
                $erreurs++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Afficher le résumé de la synchronisation
        $this->table(
            ['Résultat Synchronisation', 'Nombre'],
            [
                ['📤 Synchronisés', $synchronises],
                ['✅ Déjà sur Supabase', $deja_synchro],
                ['❌ Erreurs', $erreurs],
                ['📊 Total', $factures->count()],
            ]
        );

        if ($synchronises > 0) {
            $this->info("🎉 Synchronisation terminée! {$synchronises} PDF(s) envoyé(s) vers Supabase.");
        }

        if ($erreurs > 0) {
            $this->warn("⚠️  {$erreurs} erreur(s) de synchronisation.");
            return 1;
        }

        return 0;
    }



    /**
     * Vérifie si une URL existe
     */
    private function checkUrlExists(string $url): bool
    {
        try {
            $response = \Illuminate\Support\Facades\Http::head($url);
            return $response->successful();
        } catch (Exception $e) {
            return false;
        }
    }
}
