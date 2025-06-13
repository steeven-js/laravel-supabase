<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Service;

class CheckServices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:services';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Vérifier les services importés depuis Firebase';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $services = Service::all();

        $this->info("Nombre de services importés : " . $services->count());
        $this->line('');

        foreach ($services as $service) {
            $this->line("ID: " . $service->id);
            $this->line("Nom: " . $service->nom);
            $this->line("Code: " . ($service->code ?: 'Non défini'));
            $this->line("Prix HT: " . ($service->prix_ht ?: 'Non défini'));
            $this->line("Actif: " . ($service->actif ? 'Oui' : 'Non'));
            $this->line("Description: " . ($service->description ?: 'Aucune description'));
            $this->line("Créé le: " . $service->created_at);
            $this->line('-------------------');
        }

        return 0;
    }
}
