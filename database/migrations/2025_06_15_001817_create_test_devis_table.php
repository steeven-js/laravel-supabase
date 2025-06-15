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
        Schema::create('test_devis', function (Blueprint $table) {
            $table->id();
            $table->string('numero_devis')->unique(); // Obligatoire - auto-généré
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade'); // Obligatoire
            $table->date('date_devis')->nullable(); // Nullable - peut être complété plus tard
            $table->date('date_validite')->nullable(); // Nullable - peut être calculée automatiquement
            $table->enum('statut', ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'])->default('brouillon');
            $table->enum('statut_envoi', ['non_envoye', 'envoye', 'echec_envoi'])
                ->default('non_envoye')
                ->comment('Statut d\'envoi du devis au client');
            $table->datetime('date_envoi_client')->nullable();
            $table->datetime('date_envoi_admin')->nullable();
            $table->string('pdf_file')->nullable();
            $table->string('pdf_url')->nullable()->comment('URL publique Supabase du PDF');
            $table->string('objet')->nullable(); // Nullable - peut être généré depuis les lignes
            $table->text('description')->nullable();
            $table->decimal('montant_ht', 10, 2)->default(0);
            $table->decimal('taux_tva', 5, 2)->default(20.00);
            $table->decimal('montant_tva', 10, 2)->default(0);
            $table->decimal('montant_ttc', 10, 2)->default(0);
            $table->text('conditions')->nullable();
            $table->text('notes')->nullable();
            $table->date('date_acceptation')->nullable();
            $table->boolean('archive')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('test_devis');
    }
};
