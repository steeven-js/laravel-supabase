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
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nom du modèle
            $table->enum('category', [
                'envoi_initial',
                'rappel',
                'relance',
                'confirmation'
            ]); // Catégorie du modèle
            $table->enum('sub_category', [
                // Pour envoi_initial
                'promotionnel',
                'concis_direct',
                'standard_professionnel',
                'detaille_etapes',
                'personnalise_chaleureux',
                // Pour rappel
                'rappel_offre_speciale',
                'rappel_date_expiration',
                'rappel_standard',
                // Pour relance
                'suivi_standard',
                'suivi_ajustements',
                'suivi_feedback',
                // Pour confirmation
                'confirmation_infos',
                'confirmation_etapes',
                'confirmation_standard'
            ]); // Sous-catégorie spécifique
            $table->string('subject'); // Sujet de l'email
            $table->text('body'); // Corps de l'email avec variables
            $table->boolean('is_default')->default(false); // Si c'est le modèle par défaut pour sa catégorie
            $table->boolean('is_active')->default(true); // Si le modèle est actif
            $table->json('variables')->nullable(); // Variables disponibles dans le template
            $table->text('description')->nullable(); // Description du modèle
            $table->timestamps();

            // Index pour optimiser les requêtes
            $table->index(['category', 'is_default']);
            $table->index(['category', 'sub_category']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
