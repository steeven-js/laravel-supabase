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
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('code')->unique()->nullable()->comment('Code unique du service');
            $table->text('description')->nullable();
            $table->decimal('prix_ht', 10, 2)->nullable()->comment('Prix unitaire hors taxes');
            $table->integer('qte_defaut')->default(1)->nullable()->comment('Quantité par défaut');
            $table->boolean('actif')->default(true)->nullable()->comment('Service disponible');
            $table->timestamps();

            // Index pour optimiser les recherches
            $table->index(['actif', 'nom']);
            $table->index('code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
