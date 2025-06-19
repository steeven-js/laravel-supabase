<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class TransformationLogService
{
    private static string $logFile = 'transformations';
    private static ?string $currentSessionId = null;

    /**
     * Démarrer une nouvelle session de transformation
     */
    public static function startTransformationSession(string $devisNumero, string $clientNom): string
    {
        self::$currentSessionId = uniqid('transform_', true);

        $sessionInfo = [
            'session_id' => self::$currentSessionId,
            'devis_numero' => $devisNumero,
            'client_nom' => $clientNom,
            'started_at' => now()->format('Y-m-d H:i:s'),
        ];

        self::writeLog('info', "🚀 === DÉBUT TRANSFORMATION DEVIS ===", $sessionInfo);
        self::writeLog('info', "📄 Transformation du devis {$devisNumero} pour {$clientNom}", $sessionInfo);

        return self::$currentSessionId;
    }

    /**
     * Logger un événement de transformation
     */
    public static function logEvent(string $message, array $context = [], string $level = 'info'): void
    {
        $context['session_id'] = self::$currentSessionId;
        $context['timestamp'] = now()->format('Y-m-d H:i:s.u');

        $icon = match($level) {
            'info' => '📋',
            'success' => '✅',
            'warning' => '⚠️',
            'error' => '❌',
            default => '📝'
        };

        self::writeLog($level, "{$icon} {$message}", $context);
    }

    /**
     * Logger la création de la facture
     */
    public static function logFactureCreated(string $factureNumero, array $context = []): void
    {
        $context['facture_numero'] = $factureNumero;
        self::logEvent("🧾 Facture {$factureNumero} créée avec succès", $context, 'success');
    }

    /**
     * Logger la copie des lignes
     */
    public static function logLignesCopied(int $nbLignes, array $context = []): void
    {
        $context['nb_lignes'] = $nbLignes;
        self::logEvent("📋 {$nbLignes} ligne(s) copiée(s) du devis vers la facture", $context, 'info');
    }

    /**
     * Logger les calculs de montants
     */
    public static function logMontantsCalculated(float $montantHT, float $montantTTC, array $context = []): void
    {
        $context['montant_ht'] = $montantHT;
        $context['montant_ttc'] = $montantTTC;
        self::logEvent("💰 Montants calculés - HT: {$montantHT}€, TTC: {$montantTTC}€", $context, 'info');
    }

    /**
     * Logger les paramètres de transformation
     */
    public static function logTransformationParams(array $params, array $context = []): void
    {
        $context['params'] = $params;
        $dateFacture = $params['date_facture'] ?? 'N/A';
        $dateEcheance = $params['date_echeance'] ?? 'N/A';
        self::logEvent("⚙️ Paramètres appliqués - Facture: {$dateFacture}, Échéance: {$dateEcheance}", $context, 'info');
    }

    /**
     * Logger l'envoi d'emails
     */
    public static function logEmailSent(string $type, string $destinataire, array $context = []): void
    {
        $context['email_type'] = $type;
        $context['destinataire'] = $destinataire;
        $icon = $type === 'client' ? '📧' : '📨';
        self::logEvent("{$icon} Email {$type} envoyé à {$destinataire}", $context, 'success');
    }

    /**
     * Logger une erreur
     */
    public static function logError(string $message, ?\Throwable $exception = null, array $context = []): void
    {
        if ($exception) {
            $context['exception'] = [
                'message' => $exception->getMessage(),
                'file' => basename($exception->getFile()),
                'line' => $exception->getLine(),
                'code' => $exception->getCode(),
            ];
        }

        self::logEvent("💥 ERREUR: {$message}", $context, 'error');
    }

    /**
     * Logger l'optimisation des notifications
     */
    public static function logNotificationOptimization(bool $disabled, array $context = []): void
    {
        $status = $disabled ? 'DÉSACTIVÉES' : 'RÉACTIVÉES';
        $icon = $disabled ? '🔇' : '🔔';
        self::logEvent("{$icon} Notifications automatiques {$status}", $context, 'info');
    }

    /**
     * Logger les performances
     */
    public static function logPerformance(float $executionTimeMs, int $dbQueries = null, array $context = []): void
    {
        $context['execution_time_ms'] = $executionTimeMs;
        if ($dbQueries !== null) {
            $context['db_queries'] = $dbQueries;
        }

        $performanceIcon = $executionTimeMs < 1000 ? '⚡' : ($executionTimeMs < 5000 ? '🚀' : '🐌');
        $message = "{$performanceIcon} Performance - Temps: {$executionTimeMs}ms";
        if ($dbQueries !== null) {
            $message .= ", Requêtes DB: {$dbQueries}";
        }

        self::logEvent($message, $context, 'info');
    }

    /**
     * Terminer la session de transformation
     */
    public static function endTransformationSession(bool $success, array $finalContext = []): void
    {
        if (!self::$currentSessionId) {
            return;
        }

        $finalContext['session_id'] = self::$currentSessionId;
        $finalContext['ended_at'] = now()->format('Y-m-d H:i:s');
        $finalContext['success'] = $success;

        if ($success) {
            self::writeLog('info', "🎉 === TRANSFORMATION RÉUSSIE ===", $finalContext);
        } else {
            self::writeLog('error', "💥 === TRANSFORMATION ÉCHOUÉE ===", $finalContext);
        }

        self::writeLog('info', "🔚 === FIN SESSION TRANSFORMATION ===", $finalContext);

        // Ligne de séparation pour la lisibilité
        self::writeLog('info', str_repeat('=', 80), []);

        self::$currentSessionId = null;
    }

    /**
     * Obtenir les logs de transformation
     */
    public static function getTransformationLogs(int $lines = 100): array
    {
        $logPath = storage_path("logs/" . self::$logFile . ".log");

        if (!file_exists($logPath)) {
            return [];
        }

        $content = file_get_contents($logPath);
        $logLines = array_filter(explode("\n", $content));

        // Prendre les dernières lignes
        $recentLines = array_slice($logLines, -$lines);

        return array_map(function ($line) {
            return [
                'timestamp' => now()->format('Y-m-d H:i:s'),
                'content' => $line,
                'level' => self::extractLogLevel($line),
            ];
        }, $recentLines);
    }

    /**
     * Nettoyer les anciens logs
     */
    public static function cleanOldLogs(int $daysToKeep = 30): bool
    {
        $logPath = storage_path("logs/" . self::$logFile . ".log");

        if (!file_exists($logPath)) {
            return true;
        }

        $cutoffDate = Carbon::now()->subDays($daysToKeep);
        $content = file_get_contents($logPath);
        $lines = explode("\n", $content);

        $filteredLines = array_filter($lines, function ($line) use ($cutoffDate) {
            if (preg_match('/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/', $line, $matches)) {
                $lineDate = Carbon::createFromFormat('Y-m-d H:i:s', $matches[1]);
                return $lineDate->gt($cutoffDate);
            }
            return true; // Garder les lignes sans date
        });

        return file_put_contents($logPath, implode("\n", $filteredLines)) !== false;
    }

    /**
     * Écrire dans le fichier de log
     */
    private static function writeLog(string $level, string $message, array $context = []): void
    {
        // Mapper les niveaux personnalisés vers les niveaux Monolog valides
        $monologLevel = match($level) {
            'success' => 'info',
            'warning' => 'warning',
            'error' => 'error',
            default => 'info'
        };

        $logPath = storage_path("logs/" . self::$logFile . ".log");
        Log::build([
            'driver' => 'single',
            'path' => $logPath,
        ])->log($monologLevel, $message, $context);
    }

    /**
     * Extraire le niveau de log d'une ligne
     */
    private static function extractLogLevel(string $line): string
    {
        if (strpos($line, '[ERROR]') !== false || strpos($line, '❌') !== false || strpos($line, '💥') !== false) {
            return 'error';
        } elseif (strpos($line, '[WARNING]') !== false || strpos($line, '⚠️') !== false) {
            return 'warning';
        } elseif (strpos($line, '✅') !== false || strpos($line, '🎉') !== false) {
            return 'success';
        }
        return 'info';
    }
}
