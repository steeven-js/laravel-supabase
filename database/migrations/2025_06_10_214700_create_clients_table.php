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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('nom'); // Obligatoire
            $table->string('prenom')->nullable(); // Rendu nullable pour plus de flexibilité
            $table->string('email')->nullable()->unique(); // Nullable mais unique si renseigné
            $table->string('telephone')->nullable();
            $table->text('adresse')->nullable();
            $table->string('ville')->nullable();
            $table->string('code_postal')->nullable();
            $table->string('pays')->nullable()->default('France');
            $table->boolean('actif')->default(true);
            $table->text('notes')->nullable();
            $table->foreignId('entreprise_id')->nullable()->constrained('entreprises')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
