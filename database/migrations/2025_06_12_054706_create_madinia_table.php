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
        Schema::create('madinia', function (Blueprint $table) {
            $table->id();

            // Identité de l'entreprise
            $table->string('name')->default('Madin.IA');
            $table->foreignId('contact_principal_id')->nullable()->constrained('users')->onDelete('set null');

            // Coordonnées
            $table->string('telephone')->nullable();
            $table->string('email')->nullable();
            $table->string('site_web')->nullable();

            // Adresse et informations légales
            $table->string('siret')->nullable();
            $table->string('numero_nda')->nullable();
            $table->string('pays')->default('France');
            $table->text('adresse')->nullable();

            // Description
            $table->text('description')->nullable();

            // Réseaux sociaux (JSON)
            $table->json('reseaux_sociaux')->nullable();

            // Informations bancaires
            $table->string('nom_compte_bancaire')->nullable();
            $table->string('nom_banque')->nullable();
            $table->string('numero_compte')->nullable();
            $table->string('iban_bic_swift')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('madinia');
    }
};
