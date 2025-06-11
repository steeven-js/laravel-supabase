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
        Schema::table('devis', function (Blueprint $table) {
            $table->enum('statut_envoi', ['non_envoye', 'envoye', 'echec_envoi'])
                  ->default('non_envoye')
                  ->after('statut')
                  ->comment('Statut d\'envoi du devis au client');
            $table->datetime('date_envoi_client')->nullable()->after('statut_envoi');
            $table->datetime('date_envoi_admin')->nullable()->after('date_envoi_client');
        });

        Schema::table('factures', function (Blueprint $table) {
            $table->enum('statut_envoi', ['non_envoyee', 'envoyee', 'echec_envoi'])
                  ->default('non_envoyee')
                  ->after('statut')
                  ->comment('Statut d\'envoi de la facture au client');
            // Les champs date_envoi_client et date_envoi_admin existent déjà
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            $table->dropColumn(['statut_envoi', 'date_envoi_client', 'date_envoi_admin']);
        });

        Schema::table('factures', function (Blueprint $table) {
            $table->dropColumn('statut_envoi');
        });
    }
};
