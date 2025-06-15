<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🧪 Génération des données de test...');
        $this->command->newLine();

        // Appeler les seeders de test dans l'ordre
        $this->call([
            TestDevisSeeder::class,
            TestFacturesSeeder::class,
        ]);

        $this->command->newLine();
        $this->command->info('🎉 Données de test générées avec succès !');
        $this->command->info('📊 Résumé :');
        $this->command->info('   - 10 devis de test avec leurs lignes');
        $this->command->info('   - 8 factures de test avec leurs lignes');
        $this->command->info('   - Statuts variés pour tester toutes les fonctionnalités');
    }
}
