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
        Schema::table('client_emails', function (Blueprint $table) {
            $table->json('attachments')->nullable()->after('cc')->comment('Informations des pièces jointes en JSON');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('client_emails', function (Blueprint $table) {
            $table->dropColumn('attachments');
        });
    }
};
