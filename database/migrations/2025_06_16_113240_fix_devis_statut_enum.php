<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Supprimer l'ancienne contrainte CHECK
        DB::statement('ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_statut_check');

        // Ajouter la nouvelle contrainte CHECK avec 'en_attente'
        DB::statement("ALTER TABLE devis ADD CONSTRAINT devis_statut_check CHECK (statut IN ('brouillon', 'en_attente', 'envoye', 'accepte', 'refuse', 'expire'))");

        // Changer la valeur par défaut du statut vers 'en_attente'
        Schema::table('devis', function (Blueprint $table) {
            $table->string('statut')->default('en_attente')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remettre la valeur par défaut à 'brouillon'
        Schema::table('devis', function (Blueprint $table) {
            $table->string('statut')->default('brouillon')->change();
        });

        // Remettre l'ancienne contrainte CHECK sans 'en_attente'
        DB::statement('ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_statut_check');
        DB::statement("ALTER TABLE devis ADD CONSTRAINT devis_statut_check CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'refuse', 'expire'))");
    }
};
