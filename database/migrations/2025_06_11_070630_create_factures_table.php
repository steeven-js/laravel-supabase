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
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->string('numero_facture')->unique();
            $table->foreignId('devis_id')->nullable()->constrained('devis')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->date('date_facture');
            $table->date('date_echeance');
            $table->enum('statut', ['brouillon', 'envoyee', 'payee', 'en_retard', 'annulee'])->default('brouillon');
            $table->enum('statut_envoi', ['non_envoyee', 'envoyee', 'echec_envoi'])
                  ->default('non_envoyee')
                  ->comment('Statut d\'envoi de la facture au client');
            $table->string('pdf_file')->nullable();
            $table->string('pdf_url')->nullable()->comment('URL publique Supabase du PDF');
            $table->string('objet');
            $table->text('description')->nullable();
            $table->decimal('montant_ht', 10, 2)->default(0);
            $table->decimal('taux_tva', 5, 2)->default(20.00);
            $table->decimal('montant_tva', 10, 2)->default(0);
            $table->decimal('montant_ttc', 10, 2)->default(0);
            $table->text('conditions_paiement')->nullable();
            $table->text('notes')->nullable();
            $table->date('date_paiement')->nullable();
            $table->string('mode_paiement')->nullable();
            $table->text('reference_paiement')->nullable();
            $table->boolean('archive')->default(false);
            $table->timestamp('date_envoi_client')->nullable();
            $table->timestamp('date_envoi_admin')->nullable();
            $table->timestamps();

            // Index pour optimiser les recherches
            $table->index(['statut', 'date_facture']);
            $table->index(['client_id', 'statut']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
