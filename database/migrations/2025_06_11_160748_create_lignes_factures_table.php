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
        Schema::create('lignes_factures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained('factures')->onDelete('cascade');
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade');
            $table->integer('quantite')->default(1);
            $table->decimal('prix_unitaire_ht', 10, 2)->comment('Prix unitaire HT au moment de la facture');
            $table->decimal('taux_tva', 5, 2)->default(20.00)->comment('Taux TVA applicable');
            $table->decimal('montant_ht', 10, 2)->comment('Montant total HT de la ligne (quantite * prix_unitaire_ht)');
            $table->decimal('montant_tva', 10, 2)->comment('Montant TVA de la ligne');
            $table->decimal('montant_ttc', 10, 2)->comment('Montant total TTC de la ligne');
            $table->integer('ordre')->default(1)->comment('Ordre d\'affichage de la ligne');
            $table->text('description_personnalisee')->nullable()->comment('Description spécifique pour cette ligne');
            $table->timestamps();

            // Index pour optimiser les performances
            $table->index(['facture_id', 'ordre']);
            $table->index('service_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lignes_factures');
    }
};
