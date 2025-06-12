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
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->text('description');
            $table->enum('priorite', ['faible', 'normale', 'haute', 'critique'])->default('normale');
            $table->enum('statut', ['ouvert', 'en_cours', 'resolu', 'ferme'])->default('ouvert');
            $table->enum('type', ['bug', 'demande', 'incident', 'question', 'autre'])->default('incident');
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->comment('Utilisateur assigné');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade')->comment('Créé par');
            $table->text('notes_internes')->nullable();
            $table->text('solution')->nullable()->comment('Description de la solution apportée');
            $table->timestamp('date_resolution')->nullable();
            $table->timestamp('date_echeance')->nullable()->comment('Date limite de résolution');
            $table->integer('temps_estime')->nullable()->comment('Temps estimé en heures');
            $table->integer('temps_passe')->default(0)->comment('Temps passé en heures');
            $table->boolean('visible_client')->default(true)->comment('Visible par le client');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
