<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class PdfCacheService
{
    const CACHE_DURATION = 3600; // 1 heure
    const PDF_STORAGE_PATH = 'pdfs';

    /**
     * Vérifie si un PDF existe et est à jour
     */
    public function isPdfUpToDate(string $entityType, int $entityId, Carbon $lastModified): bool
    {
        $cacheKey = $this->getCacheKey($entityType, $entityId);

        // Vérifier le cache Redis
        $cachedInfo = Cache::get($cacheKey);
        if ($cachedInfo && isset($cachedInfo['last_modified'])) {
            $cachedLastModified = Carbon::parse($cachedInfo['last_modified']);
            return $cachedLastModified->gte($lastModified);
        }

        // Vérifier le fichier local
        $localPath = $this->getLocalPdfPath($entityType, $entityId);
        if (Storage::disk('local')->exists($localPath)) {
            $fileModified = Carbon::createFromTimestamp(Storage::disk('local')->lastModified($localPath));
            return $fileModified->gte($lastModified);
        }

        return false;
    }

    /**
     * Met en cache les informations d'un PDF
     */
    public function cachePdfInfo(string $entityType, int $entityId, array $pdfInfo): void
    {
        $cacheKey = $this->getCacheKey($entityType, $entityId);

        $cacheData = [
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'file_size' => $pdfInfo['file_size'] ?? 0,
            'local_path' => $pdfInfo['local_path'] ?? null,
            'supabase_url' => $pdfInfo['supabase_url'] ?? null,
            'last_modified' => $pdfInfo['last_modified'] ?? now()->toISOString(),
            'generated_at' => now()->toISOString(),
        ];

        Cache::put($cacheKey, $cacheData, self::CACHE_DURATION);

        Log::info('PDF info mise en cache', [
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'cache_key' => $cacheKey,
        ]);
    }

    /**
     * Récupère les informations d'un PDF depuis le cache
     */
    public function getCachedPdfInfo(string $entityType, int $entityId): ?array
    {
        $cacheKey = $this->getCacheKey($entityType, $entityId);
        return Cache::get($cacheKey);
    }

    /**
     * Invalide le cache pour un PDF
     */
    public function invalidatePdfCache(string $entityType, int $entityId): void
    {
        $cacheKey = $this->getCacheKey($entityType, $entityId);
        Cache::forget($cacheKey);

        Log::info('Cache PDF invalidé', [
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'cache_key' => $cacheKey,
        ]);
    }

    /**
     * Nettoie les anciens PDFs (local et cache)
     */
    public function cleanupOldPdfs(int $daysOld = 30): int
    {
        $cleaned = 0;
        $cutoffDate = now()->subDays($daysOld);

        // Nettoyer les fichiers locaux
        $localFiles = Storage::disk('local')->files(self::PDF_STORAGE_PATH);
        foreach ($localFiles as $file) {
            $lastModified = Carbon::createFromTimestamp(Storage::disk('local')->lastModified($file));
            if ($lastModified->lt($cutoffDate)) {
                Storage::disk('local')->delete($file);
                $cleaned++;
            }
        }

        Log::info('Nettoyage des anciens PDFs', [
            'files_cleaned' => $cleaned,
            'cutoff_date' => $cutoffDate->toDateString(),
        ]);

        return $cleaned;
    }

    /**
     * Obtient les statistiques du cache PDF
     */
    public function getCacheStats(): array
    {
        $stats = [
            'total_cached_pdfs' => 0,
            'cache_hit_rate' => 0,
            'average_file_size' => 0,
            'storage_usage' => 0,
        ];

        // Calculer l'utilisation du stockage local
        $localFiles = Storage::disk('local')->files(self::PDF_STORAGE_PATH);
        $totalSize = 0;
        foreach ($localFiles as $file) {
            $totalSize += Storage::disk('local')->size($file);
        }

        $stats['storage_usage'] = $totalSize;
        $stats['total_local_files'] = count($localFiles);

        return $stats;
    }

    /**
     * Préchauffe le cache pour une liste d'entités
     */
    public function preloadCache(string $entityType, array $entityIds): int
    {
        $preloaded = 0;

        foreach ($entityIds as $entityId) {
            if (!$this->getCachedPdfInfo($entityType, $entityId)) {
                // Logique pour charger les infos PDF si nécessaire
                $preloaded++;
            }
        }

        Log::info('Cache PDF préchargé', [
            'entity_type' => $entityType,
            'entities_preloaded' => $preloaded,
        ]);

        return $preloaded;
    }

    /**
     * Génère une clé de cache unique
     */
    private function getCacheKey(string $entityType, int $entityId): string
    {
        return "pdf_cache:{$entityType}:{$entityId}";
    }

    /**
     * Obtient le chemin local pour un PDF
     */
    private function getLocalPdfPath(string $entityType, int $entityId): string
    {
        return self::PDF_STORAGE_PATH . "/{$entityType}_{$entityId}.pdf";
    }

    /**
     * Force la régénération d'un PDF et met à jour le cache
     */
    public function forceRegeneratePdf(string $entityType, int $entityId, callable $generateCallback): array
    {
        try {
            // Invalider le cache existant
            $this->invalidatePdfCache($entityType, $entityId);

            // Générer le nouveau PDF
            $result = $generateCallback();

            // Mettre à jour le cache
            $this->cachePdfInfo($entityType, $entityId, [
                'file_size' => $result['file_size'] ?? 0,
                'local_path' => $result['local_path'] ?? null,
                'supabase_url' => $result['supabase_url'] ?? null,
                'last_modified' => now()->toISOString(),
            ]);

            Log::info('PDF régénéré avec succès', [
                'entity_type' => $entityType,
                'entity_id' => $entityId,
            ]);

            return [
                'success' => true,
                'message' => 'PDF régénéré avec succès',
                'result' => $result,
            ];

        } catch (\Exception $e) {
            Log::error('Erreur lors de la régénération forcée du PDF', [
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Erreur lors de la régénération du PDF',
                'error' => $e->getMessage(),
            ];
        }
    }
}
