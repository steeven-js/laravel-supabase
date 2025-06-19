<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class EmailLogService
{
    private const LOG_FILE = 'emails.log';
    private const LOG_PATH = 'storage/logs/';
    private static $sessionId = null;

    /**
     * Démarrer une session d'envoi d'email
     */
    public static function startEmailSession(string $type = 'general', array $context = []): string
    {
        self::$sessionId = uniqid('email_', true);

        $sessionInfo = [
            'session_id' => self::$sessionId,
            'type' => $type,
            'context' => $context,
            'started_at' => now()->toISOString(),
        ];

        self::writeLog('🚀 SESSION START', 'INFO', "Début de session d'envoi d'email", $sessionInfo);
        self::writeLog('┌─────────────────────────────────────────────────┐', 'SEPARATOR', '');

        return self::$sessionId;
    }

    /**
     * Terminer une session d'envoi d'email
     */
    public static function endEmailSession(bool $success = true, array $summary = []): void
    {
        if (!self::$sessionId) {
            return;
        }

        $sessionInfo = [
            'session_id' => self::$sessionId,
            'success' => $success,
            'summary' => $summary,
            'ended_at' => now()->toISOString(),
        ];

        self::writeLog('└─────────────────────────────────────────────────┘', 'SEPARATOR', '');

        $icon = $success ? '✅ SESSION END' : '❌ SESSION FAILED';
        self::writeLog($icon, $success ? 'SUCCESS' : 'ERROR', "Fin de session d'envoi d'email", $sessionInfo);
        self::writeLog('', 'BLANK', ''); // Ligne vide pour séparer les sessions

        self::$sessionId = null;
    }

    /**
     * Logger un événement d'email
     */
    public static function logEvent(string $event, string $level = 'INFO', array $data = []): void
    {
        $icons = [
            'SENDING' => '📤',
            'SUCCESS' => '✅',
            'ERROR' => '❌',
            'WARNING' => '⚠️',
            'ATTACHMENT' => '📎',
            'RECIPIENT' => '👤',
            'TEMPLATE' => '📄',
            'QUEUE' => '⏳',
            'DELIVERY' => '📬',
            'BOUNCE' => '↩️',
            'OPEN' => '👁️',
            'CLICK' => '🖱️',
            'RETRY' => '🔄',
            'CONFIG' => '⚙️',
            'DATABASE' => '🗄️',
            'API' => '🔌',
        ];

        $icon = $icons[$event] ?? '📧';

        $eventData = [
            'session_id' => self::$sessionId,
            'event' => $event,
            'data' => $data,
            'timestamp' => now()->toISOString(),
        ];

        self::writeLog("$icon $event", $level, '', $eventData);
    }

    /**
     * Logger un succès d'envoi
     */
    public static function logSuccess(string $recipient, string $subject, array $details = []): void
    {
        self::logEvent('SUCCESS', 'SUCCESS', [
            'recipient' => $recipient,
            'subject' => $subject,
            'details' => $details
        ]);
    }

    /**
     * Logger une erreur d'envoi
     */
    public static function logError(string $recipient, string $error, array $context = []): void
    {
        self::logEvent('ERROR', 'ERROR', [
            'recipient' => $recipient,
            'error' => $error,
            'context' => $context
        ]);
    }

    /**
     * Logger un attachement
     */
    public static function logAttachment(string $filename, int $size, string $type = 'pdf'): void
    {
        self::logEvent('ATTACHMENT', 'INFO', [
            'filename' => $filename,
            'size' => $size,
            'type' => $type,
            'size_formatted' => self::formatBytes($size)
        ]);
    }

    /**
     * Logger une configuration d'email
     */
    public static function logConfig(array $config): void
    {
        self::logEvent('CONFIG', 'INFO', $config);
    }

    /**
     * Écrire dans le fichier de log
     */
    private static function writeLog(string $icon, string $level, string $message = '', array $data = []): void
    {
        $timestamp = now()->format('Y-m-d H:i:s');
        $logPath = storage_path('logs/' . self::LOG_FILE);

        if ($level === 'BLANK') {
            $logEntry = "\n";
        } elseif ($level === 'SEPARATOR') {
            $logEntry = "[$timestamp] $icon\n";
        } else {
            $formattedData = !empty($data) ? ' ' . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) : '';
            $logEntry = "[$timestamp] [$level] $icon";

            if ($message) {
                $logEntry .= " $message";
            }

            $logEntry .= $formattedData . "\n";
        }

        file_put_contents($logPath, $logEntry, FILE_APPEND | LOCK_EX);
    }

    /**
     * Récupérer les logs d'emails
     */
    public static function getEmailLogs(int $lines = 100): array
    {
        $logPath = storage_path('logs/' . self::LOG_FILE);

        if (!file_exists($logPath)) {
            return [];
        }

        $content = file_get_contents($logPath);
        $logLines = array_slice(array_filter(explode("\n", $content)), -$lines);

        return array_map(function($line) {
            return [
                'raw' => $line,
                'formatted' => self::formatLogLine($line),
                'level' => self::extractLevel($line),
                'timestamp' => self::extractTimestamp($line),
            ];
        }, $logLines);
    }

    /**
     * Nettoyer les anciens logs
     */
    public static function clearOldLogs(int $daysToKeep = 7): bool
    {
        $logPath = storage_path('logs/' . self::LOG_FILE);

        if (!file_exists($logPath)) {
            return true;
        }

        $cutoffDate = now()->subDays($daysToKeep);
        $content = file_get_contents($logPath);
        $lines = explode("\n", $content);

        $filteredLines = array_filter($lines, function($line) use ($cutoffDate) {
            $timestamp = self::extractTimestamp($line);
            if (!$timestamp) return true;

            try {
                return Carbon::parse($timestamp)->isAfter($cutoffDate);
            } catch (\Exception $e) {
                return true; // Garder les lignes avec timestamps invalides
            }
        });

        file_put_contents($logPath, implode("\n", $filteredLines));

        return true;
    }

    /**
     * Formater une ligne de log pour l'affichage
     */
    private static function formatLogLine(string $line): array
    {
        // Extraire les icônes pour le style
        $icons = ['🚀', '✅', '❌', '📤', '📎', '👤', '📄', '⏳', '📬', '↩️', '👁️', '🖱️', '🔄', '⚙️', '🗄️', '🔌', '📧', '⚠️'];
        $hasIcon = false;

        foreach ($icons as $icon) {
            if (strpos($line, $icon) !== false) {
                $hasIcon = true;
                break;
            }
        }

        return [
            'text' => $line,
            'hasIcon' => $hasIcon,
            'isSession' => strpos($line, 'SESSION') !== false,
            'isSeparator' => strpos($line, '─') !== false,
        ];
    }

    /**
     * Extraire le niveau d'un log
     */
    private static function extractLevel(string $line): string
    {
        if (preg_match('/\[(SUCCESS|ERROR|WARNING|INFO|SEPARATOR|BLANK)\]/', $line, $matches)) {
            return $matches[1];
        }
        return 'INFO';
    }

    /**
     * Extraire le timestamp d'un log
     */
    private static function extractTimestamp(string $line): ?string
    {
        if (preg_match('/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/', $line, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Formater les bytes
     */
    private static function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}
