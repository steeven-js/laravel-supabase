<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('historique', function (Blueprint $table) {
            $table->id();

            // Référence polymorphe pour associer à n'importe quelle entité
            $table->string('entite_type'); // 'App\Models\Client', 'App\Models\Devis', etc.
            $table->unsignedBigInteger('entite_id'); // ID de l'entité concernée

            // Informations sur l'action
            $table->enum('action', [
                'creation',
                'modification',
                'changement_statut',
                'envoi_email',
                'suppression',
                'archivage',
                'restauration',
                'transformation' // Pour devis -> facture
            ]);

            // Détails de l'action
            $table->string('titre'); // ex: "Création du client", "Modification du devis", "Envoi email client"
            $table->text('description')->nullable(); // Description détaillée

            // Données avant/après pour les modifications
            $table->json('donnees_avant')->nullable(); // État avant modification
            $table->json('donnees_apres')->nullable(); // État après modification
            $table->json('donnees_supplementaires')->nullable(); // Infos additionnelles (email envoyé, etc.)

            // Utilisateur qui a effectué l'action
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('user_nom'); // Nom de l'utilisateur au moment de l'action (dénormalisé)
            $table->string('user_email'); // Email de l'utilisateur au moment de l'action (dénormalisé)

            // Informations techniques
            $table->string('ip_address')->nullable(); // Adresse IP
            $table->text('user_agent')->nullable(); // User agent

            $table->timestamp('created_at'); // Date/heure de l'action

            // Index pour optimiser les requêtes
            $table->index(['entite_type', 'entite_id']);
            $table->index(['user_id', 'created_at']);
            $table->index(['action', 'created_at']);
            $table->index('created_at'); // Pour tri chronologique
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historique');
    }
};
