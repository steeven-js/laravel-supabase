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
        Schema::table('users', function (Blueprint $table) {
            $table->string('telephone')->nullable()->after('email');
            $table->string('ville')->nullable()->after('telephone');
            $table->string('adresse')->nullable()->after('ville');
            $table->string('code_postal')->nullable()->after('adresse');
            $table->string('pays')->nullable()->after('code_postal');
            $table->string('avatar')->nullable()->after('pays'); // URL de l'avatar
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'telephone',
                'ville',
                'adresse',
                'code_postal',
                'pays',
                'avatar'
            ]);
        });
    }
};
