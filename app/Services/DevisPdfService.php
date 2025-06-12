<?php

namespace App\Services;

use App\Models\Devis;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Exception;

class DevisPdfService
{
    /**
     * Génère le PDF d'un devis et le sauvegarde (double sauvegarde: local + Supabase)
     */
    public function genererEtSauvegarder(Devis $devis): string
    {
        try {
            // Charger les relations nécessaires
            $devis->load(['client.entreprise']);

            // Générer le PDF
            $pdf = $this->genererPdf($devis);

            // Définir le nom du fichier
            $nomFichier = $this->getNomFichier($devis);

            // Sauvegarder localement
            $this->sauvegarderLocal($pdf, $nomFichier);

            // Sauvegarder sur Supabase
            $this->sauvegarderSupabase($pdf, $nomFichier);

            // Générer et stocker l'URL Supabase
            $urlSupabase = $this->genererUrlSupabase($nomFichier);
            $devis->pdf_url = $urlSupabase;
            $devis->save();

            Log::info('PDF devis généré et sauvegardé (local + Supabase)', [
                'devis_numero' => $devis->numero_devis,
                'fichier' => $nomFichier,
                'url_supabase' => $urlSupabase
            ]);

            return $nomFichier;
        } catch (Exception $e) {
            Log::error('Erreur génération PDF devis', [
                'devis_numero' => $devis->numero_devis,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Met à jour le PDF d'un devis existant
     */
    public function mettreAJour(Devis $devis): string
    {
        try {
            // Supprimer l'ancien PDF s'il existe
            $this->supprimer($devis);

            // Générer et sauvegarder le nouveau PDF
            return $this->genererEtSauvegarder($devis);
        } catch (Exception $e) {
            Log::error('Erreur mise à jour PDF devis', [
                'devis_numero' => $devis->numero_devis,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Supprime le PDF d'un devis
     */
    public function supprimer(Devis $devis): bool
    {
        try {
            $nomFichier = $this->getNomFichier($devis);
            $supprime = false;

            // Supprimer le fichier local
            if (Storage::disk('public')->exists("pdfs/devis/{$nomFichier}")) {
                Storage::disk('public')->delete("pdfs/devis/{$nomFichier}");
                $supprime = true;
            }

            // Supprimer sur Supabase
            $this->supprimerSupabase($nomFichier);

            if ($supprime) {
                Log::info('PDF devis supprimé (local + Supabase)', [
                    'devis_numero' => $devis->numero_devis,
                    'fichier' => $nomFichier
                ]);
            }

            return $supprime;
        } catch (Exception $e) {
            Log::error('Erreur suppression PDF devis', [
                'devis_numero' => $devis->numero_devis,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Récupère le chemin du PDF d'un devis
     */
    public function getCheminPdf(Devis $devis): ?string
    {
        $nomFichier = $this->getNomFichier($devis);

        if (Storage::disk('public')->exists("pdfs/devis/{$nomFichier}")) {
            return Storage::disk('public')->path("pdfs/devis/{$nomFichier}");
        }

        return null;
    }

    /**
     * Récupère l'URL publique du PDF d'un devis
     */
    public function getUrlPdf(Devis $devis): ?string
    {
        $nomFichier = $this->getNomFichier($devis);

        if (Storage::disk('public')->exists("pdfs/devis/{$nomFichier}")) {
            return asset("storage/pdfs/devis/{$nomFichier}");
        }

        return null;
    }

    /**
     * Récupère l'URL publique du PDF sur Supabase
     */
    public function getUrlSupabasePdf(Devis $devis): ?string
    {
        // Si l'URL est déjà stockée en base, la retourner
        if ($devis->pdf_url) {
            return $devis->pdf_url;
        }

        // Générer l'URL à partir de la configuration Supabase
        $nomFichier = $this->getNomFichier($devis);
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
            return "{$supabaseUrl}/storage/v1/object/public/{$bucketName}/devis/{$nomFichier}";
        }

        return null;
    }

    /**
     * Vérifie si le PDF existe
     */
    public function pdfExiste(Devis $devis): bool
    {
        $nomFichier = $this->getNomFichier($devis);
        return Storage::disk('public')->exists("pdfs/devis/{$nomFichier}");
    }

    /**
     * Récupère le contenu du PDF pour les pièces jointes email
     */
    public function getContenuPdf(Devis $devis): ?string
    {
        $cheminPdf = $this->getCheminPdf($devis);

        if ($cheminPdf && file_exists($cheminPdf)) {
            return file_get_contents($cheminPdf);
        }

        return null;
    }

    /**
     * Synchronise un PDF existant vers Supabase Storage
     */
    public function synchroniserVersSupabase(Devis $devis): bool
    {
        try {
            $cheminLocal = $this->getCheminPdf($devis);

            if (!$cheminLocal || !file_exists($cheminLocal)) {
                Log::warning('PDF local introuvable pour synchronisation', [
                    'devis_id' => $devis->id,
                    'numero_devis' => $devis->numero_devis
                ]);
                return false;
            }

            $contenu = file_get_contents($cheminLocal);
            $nomFichier = $this->getNomFichier($devis);

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
                'devis_id' => $devis->id,
                'numero_devis' => $devis->numero_devis,
                'fichier' => $nomFichier
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Erreur synchronisation PDF vers Supabase', [
                'devis_id' => $devis->id,
                'numero_devis' => $devis->numero_devis,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Génère le PDF à partir du template
     */
    private function genererPdf(Devis $devis)
    {
        // Charger les relations nécessaires
        $devis->load(['lignes.service']);

        // Récupérer les informations Madinia
        $madinia = \App\Models\Madinia::getInstance();

        return Pdf::loadView('pdfs.devis', [
            'devis' => $devis,
            'client' => $devis->client,
            'entreprise' => $devis->client->entreprise,
            'madinia' => $madinia,
            'lignes' => $devis->lignes,
        ])
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'dpi' => 150,
                'defaultFont' => 'sans-serif',
                'isRemoteEnabled' => true,
                'chroot' => [resource_path(), public_path()],
            ]);
    }

    /**
     * Sauvegarde le PDF localement
     */
    private function sauvegarderLocal($pdf, string $nomFichier): void
    {
        // Créer le dossier s'il n'existe pas
        if (!Storage::disk('public')->exists('pdfs/devis')) {
            Storage::disk('public')->makeDirectory('pdfs/devis');
        }

        // Sauvegarder le PDF
        Storage::disk('public')->put(
            "pdfs/devis/{$nomFichier}",
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

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$serviceKey}",
                'Content-Type' => 'application/pdf',
            ])->put(
                "{$supabaseUrl}/storage/v1/object/{$bucketName}/devis/{$nomFichier}",
                $pdf->output()
            );

            if ($response->successful()) {
                Log::info('PDF sauvegardé sur Supabase', [
                    'fichier' => $nomFichier,
                    'bucket' => $bucketName
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
                "{$supabaseUrl}/storage/v1/object/{$bucketName}/devis/{$nomFichier}"
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
     * Génère le nom du fichier PDF
     */
    private function getNomFichier(Devis $devis): string
    {
        return "devis_{$devis->numero_devis}_{$devis->id}.pdf";
    }
}
