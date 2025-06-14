<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            $table->foreignId('administrateur_id')->nullable()->after('client_id')->constrained('users')->onDelete('set null');
        });

        // Migrer les données existantes du champ emetteur vers administrateur_id
        $devisAvecEmetteur = DB::table('devis')
            ->whereNotNull('emetteur')
            ->where('emetteur', '!=', '')
            ->get();

        foreach ($devisAvecEmetteur as $devis) {
            $user = DB::table('users')->where('email', $devis->emetteur)->first();
            if ($user) {
                DB::table('devis')
                    ->where('id', $devis->id)
                    ->update(['administrateur_id' => $user->id]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            $table->dropForeign(['administrateur_id']);
            $table->dropColumn('administrateur_id');
        });
    }
};
