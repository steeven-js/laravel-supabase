<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Mail\Message;

class TestEmailSimple extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:test-simple {email : Email de destination}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test d\'envoi d\'email simple sans pièce jointe';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        $this->info("📧 Test d'envoi d'email simple vers: {$email}");
        $this->newLine();

        try {
            $this->info("📤 Envoi en cours...");

            Mail::raw('Ceci est un test d\'email simple envoyé depuis Laravel. 🧪', function (Message $message) use ($email) {
                $message->to($email)
                        ->subject('Test Email Simple - Laravel')
                        ->from(config('mail.from.address'), config('mail.from.name'));
            });

            $this->info("🎉 Email simple envoyé avec succès !");

        } catch (\Exception $e) {
            $this->error("❌ Erreur lors de l'envoi:");
            $this->error("Type: " . get_class($e));
            $this->error("Message: " . $e->getMessage());
            $this->error("Fichier: " . $e->getFile() . ":" . $e->getLine());
            return 1;
        }

        return 0;
    }
}
