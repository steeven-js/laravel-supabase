<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\ServiceUnite;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->enum('unite', [
                'heure',
                'journee',
                'semaine',
                'mois',
                'unite',
                'forfait',
                'licence'
            ])->default('heure')->after('qte_defaut')->comment('Unité de mesure du service');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('unite');
        });
    }
};
