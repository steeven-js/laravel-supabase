<?php

namespace App\Services;

use App\Models\Facture;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Exception;

class FacturePdfService
{
    /**
     * DEPRECATED - Utilise React PDF maintenant via les routes /generate-react-pdf
     * Cette méthode est conservée pour compatibilité mais ne génère plus de PDF
     */
    public function genererEtSauvegarder(Facture $facture): string
    {
        Log::warning('DEPRECATED: genererEtSauvegarder() - Utilisez React PDF via les routes /generate-react-pdf', [
            'facture_numero' => $facture->numero_facture
        ]);

        // Retourner un nom de fichier par défaut pour éviter les erreurs
        return $this->getNomFichier($facture);
    }

    /**
     * Met à jour le PDF d'une facture existante.
     */
    public function mettreAJour(Facture $facture): string
    {
        // Supprimer l'ancien PDF si il existe
        $this->supprimer($facture);

        // Générer un nouveau PDF
        return $this->genererEtSauvegarder($facture);
    }

    /**
     * Supprime le PDF d'une facture.
     */
    public function supprimer(Facture $facture): bool
    {
        try {
            $nomFichier = $this->getNomFichier($facture);

            // Supprimer le fichier local
            if (Storage::disk('public')->exists("pdfs/factures/{$nomFichier}")) {
                Storage::disk('public')->delete("pdfs/factures/{$nomFichier}");
                Log::info('PDF local supprimé', ['fichier' => $nomFichier]);
            }

            // Supprimer sur Supabase
            $this->supprimerSupabase($nomFichier);

            return true;
        } catch (Exception $e) {
            Log::error('Erreur suppression PDF facture', [
                'facture_id' => $facture->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Obtient le chemin complet du PDF d'une facture.
     */
    public function getCheminPdf(Facture $facture): ?string
    {
        $nomFichier = $this->getNomFichier($facture);
        $cheminLocal = storage_path("app/public/pdfs/factures/{$nomFichier}");

        if (file_exists($cheminLocal)) {
            return $cheminLocal;
        }

        return null;
    }

    /**
     * Obtient l'URL publique du PDF
     */
    public function getUrlPdf(Facture $facture): ?string
    {
        $nomFichier = $this->getNomFichier($facture);
        $urlSupabase = $this->getUrlSupabasePdf($facture);

        if ($urlSupabase) {
            return $urlSupabase;
        }

        // Fallback vers le stockage local
        if ($this->pdfExiste($facture)) {
            return asset("storage/pdfs/factures/{$nomFichier}");
        }

        return null;
    }

    /**
     * Récupère l'URL publique du PDF sur Supabase
     */
    public function getUrlSupabasePdf(Facture $facture): ?string
    {
        // Si l'URL est déjà stockée en base, la retourner
        if ($facture->pdf_url) {
            return $facture->pdf_url;
        }

        // Générer l'URL à partir de la configuration Supabase
        $nomFichier = $this->getNomFichier($facture);
        return $this->genererUrlSupabase($nomFichier);
    }

    /**
     * Génère l'URL publique Supabase pour un fichier PDF
     */
    private function genererUrlSupabase(string $nomFichier): ?string
    {
        $supabaseUrl = config('supabase.url');
        $bucketName = config('supabase.storage_bucket', 'pdfs');

        if ($supabaseUrl && $nomFichier) {
            return "{$supabaseUrl}/storage/v1/object/public/{$bucketName}/factures/{$nomFichier}";
        }

        return null;
    }

    /**
     * Vérifie si le PDF existe pour une facture.
     */
    public function pdfExiste(Facture $facture): bool
    {
        $nomFichier = $this->getNomFichier($facture);
        return Storage::disk('public')->exists("pdfs/factures/{$nomFichier}");
    }

    /**
     * Récupère le contenu du PDF pour les pièces jointes email
     */
    public function getContenuPdf(Facture $facture): ?string
    {
        $cheminPdf = $this->getCheminPdf($facture);

        if ($cheminPdf && file_exists($cheminPdf)) {
            return file_get_contents($cheminPdf);
        }

        return null;
    }

    /**
     * Synchronise un PDF existant vers Supabase Storage
     */
    public function synchroniserVersSupabase(Facture $facture): bool
    {
        try {
            $cheminLocal = $this->getCheminPdf($facture);

            if (!$cheminLocal || !file_exists($cheminLocal)) {
                Log::warning('PDF local introuvable pour synchronisation', [
                    'facture_id' => $facture->id,
                    'numero_facture' => $facture->numero_facture
                ]);
                return false;
            }

            $contenu = file_get_contents($cheminLocal);
            $nomFichier = $this->getNomFichier($facture);

            // Créer un objet PDF mock pour la synchronisation
            $pdf = new class($contenu) {
                private $content;
                public function __construct($content)
                {
                    $this->content = $content;
                }
                public function output()
                {
                    return $this->content;
                }
            };

            $this->sauvegarderSupabase($pdf, $nomFichier);

            Log::info('PDF synchronisé vers Supabase', [
                'facture_id' => $facture->id,
                'numero_facture' => $facture->numero_facture,
                'fichier' => $nomFichier
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Erreur synchronisation PDF vers Supabase', [
                'facture_id' => $facture->id,
                'numero_facture' => $facture->numero_facture,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }



    /**
     * Sauvegarde le PDF localement
     */
    private function sauvegarderLocal($pdf, string $nomFichier): void
    {
        // Créer le dossier s'il n'existe pas
        if (!Storage::disk('public')->exists('pdfs/factures')) {
            Storage::disk('public')->makeDirectory('pdfs/factures');
        }

        // Sauvegarder le PDF
        Storage::disk('public')->put(
            "pdfs/factures/{$nomFichier}",
            $pdf->output()
        );
    }

    /**
     * Sauvegarde le PDF sur Supabase Storage
     */
    private function sauvegarderSupabase($pdf, string $nomFichier): void
    {
        try {
            $supabaseUrl = config('supabase.url');
            $serviceKey = config('supabase.service_role_key');
            $bucketName = config('supabase.storage_bucket', 'pdfs');

            if (!$supabaseUrl || !$serviceKey) {
                Log::warning('Configuration Supabase manquante pour upload PDF');
                return;
            }

            // Obtenir le contenu binaire du PDF
            $pdfContent = $pdf->output();

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$serviceKey}",
                'Content-Type' => 'application/pdf',
            ])->withBody($pdfContent, 'application/pdf')
            ->put("{$supabaseUrl}/storage/v1/object/{$bucketName}/factures/{$nomFichier}");

            if ($response->successful()) {
                Log::info('PDF sauvegardé sur Supabase', [
                    'fichier' => $nomFichier,
                    'bucket' => $bucketName,
                    'taille' => strlen($pdfContent) . ' bytes'
                ]);
            } else {
                Log::error('Erreur sauvegarde PDF Supabase', [
                    'fichier' => $nomFichier,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            }
        } catch (Exception $e) {
            Log::error('Exception sauvegarde PDF Supabase', [
                'fichier' => $nomFichier,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Supprime le PDF sur Supabase Storage
     */
    private function supprimerSupabase(string $nomFichier): void
    {
        try {
            $supabaseUrl = config('supabase.url');
            $serviceKey = config('supabase.service_role_key');
            $bucketName = config('supabase.storage_bucket', 'pdfs');

            if (!$supabaseUrl || !$serviceKey) {
                Log::warning('Configuration Supabase manquante pour suppression PDF');
                return;
            }

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$serviceKey}",
            ])->delete(
                "{$supabaseUrl}/storage/v1/object/{$bucketName}/factures/{$nomFichier}"
            );

            if ($response->successful()) {
                Log::info('PDF supprimé sur Supabase', [
                    'fichier' => $nomFichier,
                    'bucket' => $bucketName
                ]);
            } else {
                Log::error('Erreur suppression PDF Supabase', [
                    'fichier' => $nomFichier,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            }
        } catch (Exception $e) {
            Log::error('Exception suppression PDF Supabase', [
                'fichier' => $nomFichier,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Génère le nom du fichier PDF basé sur le numéro de facture
     */
    private function getNomFichier(Facture $facture): string
    {
        return "facture_{$facture->numero_facture}.pdf";
    }
}
