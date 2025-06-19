<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\EmailLogService;

class TestEmailLogs extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'email:test-logs {--scenario=all : Scénario à tester (success|error|complex|all)}';

    /**
     * The console command description.
     */
    protected $description = 'Tester le système de logs d\'emails avec différents scénarios';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $scenario = $this->option('scenario');

        $this->info('🧪 Test du système de logs d\'emails');
        $this->newLine();

        switch ($scenario) {
            case 'success':
                $this->testSuccessScenario();
                break;
            case 'error':
                $this->testErrorScenario();
                break;
            case 'complex':
                $this->testComplexScenario();
                break;
            default:
                $this->testSuccessScenario();
                $this->newLine();
                $this->testErrorScenario();
                $this->newLine();
                $this->testComplexScenario();
                break;
        }

        $this->newLine();
        $this->info('✅ Tests terminés ! Consultez les logs dans la page monitoring.');
    }

    private function testSuccessScenario()
    {
        $this->info('📤 Test : Envoi réussi simple');

        $sessionId = EmailLogService::startEmailSession('test_success', [
            'user' => 'admin',
            'scenario' => 'success_test'
        ]);

        EmailLogService::logConfig([
            'driver' => 'smtp',
            'host' => 'smtp.gmail.com',
            'port' => 587,
        ]);

        EmailLogService::logEvent('RECIPIENT', 'INFO', [
            'email' => 'test@example.com',
            'name' => 'Test User'
        ]);

        EmailLogService::logEvent('TEMPLATE', 'INFO', [
            'template' => 'emails.welcome',
            'type' => 'markdown'
        ]);

        EmailLogService::logEvent('SENDING', 'INFO', [
            'subject' => 'Email de bienvenue',
            'size' => '2.3 KB'
        ]);

        sleep(1); // Simuler du temps de traitement

        EmailLogService::logSuccess('test@example.com', 'Email de bienvenue', [
            'message_id' => 'msg_' . uniqid(),
            'delivery_time' => '1.2s'
        ]);

        EmailLogService::endEmailSession(true, [
            'emails_sent' => 1,
            'total_time' => '1.2s',
            'status' => 'success'
        ]);

        $this->info('✅ Scénario de succès terminé');
    }

    private function testErrorScenario()
    {
        $this->info('❌ Test : Échec d\'envoi');

        $sessionId = EmailLogService::startEmailSession('test_error', [
            'user' => 'admin',
            'scenario' => 'error_test'
        ]);

        EmailLogService::logConfig([
            'driver' => 'smtp',
            'host' => 'smtp.invalid.com',
            'port' => 587,
        ]);

        EmailLogService::logEvent('RECIPIENT', 'INFO', [
            'email' => 'invalid@domain.invalid',
            'name' => 'Invalid User'
        ]);

        EmailLogService::logEvent('TEMPLATE', 'INFO', [
            'template' => 'emails.notification',
            'type' => 'blade'
        ]);

        EmailLogService::logEvent('SENDING', 'INFO', [
            'subject' => 'Notification importante',
            'size' => '1.8 KB'
        ]);

        sleep(1); // Simuler du temps avant l'erreur

        EmailLogService::logError('invalid@domain.invalid', 'Connection timeout: could not connect to SMTP server', [
            'error_code' => 'SMTP_TIMEOUT',
            'attempted_host' => 'smtp.invalid.com',
            'timeout' => '30s'
        ]);

        EmailLogService::logEvent('RETRY', 'WARNING', [
            'attempt' => 1,
            'max_attempts' => 3,
            'next_retry' => '30s'
        ]);

        EmailLogService::logError('invalid@domain.invalid', 'Max retry attempts reached', [
            'attempts' => 3,
            'final_error' => 'SMTP connection failed'
        ]);

        EmailLogService::endEmailSession(false, [
            'emails_sent' => 0,
            'errors' => 1,
            'attempts' => 3,
            'final_status' => 'failed'
        ]);

        $this->info('❌ Scénario d\'erreur terminé');
    }

    private function testComplexScenario()
    {
        $this->info('📊 Test : Envoi multiple avec attachements');

        $sessionId = EmailLogService::startEmailSession('test_complex', [
            'user' => 'admin',
            'scenario' => 'bulk_email_with_attachments',
            'total_recipients' => 3
        ]);

        EmailLogService::logConfig([
            'driver' => 'smtp',
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls'
        ]);

        EmailLogService::logEvent('TEMPLATE', 'INFO', [
            'template' => 'emails.invoice',
            'type' => 'react_pdf'
        ]);

        // Simulation d'envoi à plusieurs destinataires
        $recipients = [
            ['email' => 'client1@example.com', 'name' => 'Client Un'],
            ['email' => 'client2@example.com', 'name' => 'Client Deux'],
            ['email' => 'client3@example.com', 'name' => 'Client Trois']
        ];

                 foreach ($recipients as $index => $recipient) {
             EmailLogService::logEvent('RECIPIENT', 'INFO', $recipient);

             // Attachement pour chaque email
             EmailLogService::logAttachment("facture_client_{$index}.pdf", 245760, 'pdf');

             $invoiceNumber = $index + 1001;
             EmailLogService::logEvent('SENDING', 'INFO', [
                 'subject' => "Facture #{$invoiceNumber}",
                 'recipient' => $recipient['email'],
                 'size' => '3.2 KB + attachment'
             ]);

             sleep(1); // Simuler le temps d'envoi

             if ($index === 1) {
                 // Simuler une erreur sur le deuxième envoi
                 EmailLogService::logError($recipient['email'], 'Mailbox full', [
                     'smtp_code' => 552,
                     'message' => 'Requested mail action aborted: exceeded storage allocation'
                 ]);
             } else {
                 EmailLogService::logSuccess($recipient['email'], "Facture #{$invoiceNumber}", [
                     'message_id' => 'msg_' . uniqid(),
                     'delivery_time' => '0.8s',
                     'attachment_sent' => true
                 ]);
             }
         }

        EmailLogService::logEvent('DATABASE', 'INFO', [
            'action' => 'update_delivery_status',
            'records_updated' => 2,
            'failed_records' => 1
        ]);

        EmailLogService::endEmailSession(true, [
            'emails_sent' => 2,
            'emails_failed' => 1,
            'total_attachments' => 3,
            'total_size' => '735 KB',
            'duration' => '3.4s',
            'success_rate' => '66.7%'
        ]);

        $this->info('📊 Scénario complexe terminé');
    }
}
