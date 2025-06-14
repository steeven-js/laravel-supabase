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
            $table->string('emetteur')->nullable()->after('numero_devis')->comment('Email de l\'administrateur responsable du devis');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            $table->dropColumn('emetteur');
        });
    }
};
