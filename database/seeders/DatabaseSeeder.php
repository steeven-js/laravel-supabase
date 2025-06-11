<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Créer l'utilisateur principal
        $this->createMainUser();

        // Créer les données de test en ordre de dépendance
        $this->call([
            EntrepriseSeeder::class,
            ClientSeeder::class,
            DevisSeeder::class,
            FactureSeeder::class,
        ]);

        $this->command->info('🎉 Toutes les données ont été créées avec succès !');
        $this->command->info('📧 Utilisateur principal : jacques.steeven@gmail.com');
        $this->command->info('🔑 Mot de passe : password');

        // Afficher les statistiques
        $this->afficherStatistiques();
    }

    /**
     * Créer l'utilisateur principal
     */
    private function createMainUser(): void
    {
        // Supprimer l'utilisateur s'il existe déjà
        User::where('email', 'jacques.steeven@gmail.com')->delete();

        $user = User::create([
            'name' => 'Jacques Steeven',
            'email' => 'jacques.steeven@gmail.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
        ]);

        $this->command->info("✅ Utilisateur principal créé : {$user->email}");
    }

    /**
     * Afficher les statistiques des données créées
     */
    private function afficherStatistiques(): void
    {
        $stats = [
            'Utilisateurs' => User::count(),
            'Entreprises' => \App\Models\Entreprise::count(),
            'Clients' => \App\Models\Client::count(),
            'Devis' => \App\Models\Devis::count(),
            'Factures' => \App\Models\Facture::count(),
        ];

        $this->command->info('');
        $this->command->info('📊 Statistiques des données créées :');
        $this->command->info('─────────────────────────────────────');

        foreach ($stats as $type => $count) {
            $this->command->info("  {$type}: {$count}");
        }

        // Statistiques détaillées pour les devis
        $devisStats = [
            'Brouillon' => \App\Models\Devis::where('statut', 'brouillon')->count(),
            'Envoyé' => \App\Models\Devis::where('statut', 'envoye')->count(),
            'Accepté' => \App\Models\Devis::where('statut', 'accepte')->count(),
            'Refusé' => \App\Models\Devis::where('statut', 'refuse')->count(),
            'Expiré' => \App\Models\Devis::where('statut', 'expire')->count(),
        ];

        $this->command->info('');
        $this->command->info('📋 Répartition des devis par statut :');
        foreach ($devisStats as $statut => $count) {
            $this->command->info("  {$statut}: {$count}");
        }

        // Statistiques détaillées pour les factures
        $factureStats = [
            'Brouillon' => \App\Models\Facture::where('statut', 'brouillon')->count(),
            'Envoyée' => \App\Models\Facture::where('statut', 'envoyee')->count(),
            'Payée' => \App\Models\Facture::where('statut', 'payee')->count(),
            'En retard' => \App\Models\Facture::where('statut', 'en_retard')->count(),
            'Annulée' => \App\Models\Facture::where('statut', 'annulee')->count(),
        ];

        $this->command->info('');
        $this->command->info('💰 Répartition des factures par statut :');
        foreach ($factureStats as $statut => $count) {
            $this->command->info("  {$statut}: {$count}");
        }

        // Montant total des factures
        $montantTotal = \App\Models\Facture::sum('montant_ttc');
        $this->command->info('');
        $this->command->info("💰 Montant total des factures : " . number_format($montantTotal, 2, ',', ' ') . "€");
    }

    /**
     * Reset toutes les données sauf l'utilisateur principal
     */
    public static function resetDataKeepUser(): void
    {
        // Supprimer les données dans l'ordre inverse des dépendances
        \App\Models\Facture::query()->delete();
        \App\Models\Devis::query()->delete();
        \App\Models\Client::query()->delete();
        \App\Models\Entreprise::query()->delete();

        // Garder seulement l'utilisateur principal
        User::where('email', '!=', 'jacques.steeven@gmail.com')->delete();

        // Recréer les données
        (new self())->call([
            EntrepriseSeeder::class,
            ClientSeeder::class,
            DevisSeeder::class,
            FactureSeeder::class,
        ]);
    }

    /**
     * Reset toutes les données y compris l'utilisateur
     */
    public static function resetAllData(): void
    {
        // Supprimer toutes les données
        \App\Models\Facture::query()->delete();
        \App\Models\Devis::query()->delete();
        \App\Models\Client::query()->delete();
        \App\Models\Entreprise::query()->delete();
        User::query()->delete();

        // Recréer toutes les données
        (new self())->run();
    }
}
