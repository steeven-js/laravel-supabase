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
        // Supprimer tous les triggers liés au realtime sur la table todos
        DB::statement("DROP TRIGGER IF EXISTS todos_realtime_trigger ON todos;");
        DB::statement("DROP TRIGGER IF EXISTS todos_notify_trigger ON todos;");
        DB::statement("DROP TRIGGER IF EXISTS notify_todo_changes_trigger ON todos;");

        // Supprimer toutes les fonctions personnalisées liées au realtime
        DB::statement("DROP FUNCTION IF EXISTS notify_todo_changes();");
        DB::statement("DROP FUNCTION IF EXISTS broadcast_change(text, text, jsonb, bigint);");
        DB::statement("DROP FUNCTION IF EXISTS broadcast_change(text, text, jsonb);");

        // Supprimer la table realtime_events si elle existe encore
        DB::statement("DROP TABLE IF EXISTS realtime_events;");

        // Ne pas supprimer le schéma realtime car il appartient à Supabase
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // On ne recrée rien car nous voulons supprimer définitivement le realtime
    }
};
