<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Créer la fonction pour broadcaster les changements
        DB::statement("
            CREATE OR REPLACE FUNCTION broadcast_change(
                p_table text,
                p_event text,
                p_data jsonb,
                p_user_id integer DEFAULT NULL
            )
            RETURNS void
            LANGUAGE plpgsql
            AS $$
            BEGIN
                -- Publier le changement via pg_notify
                PERFORM pg_notify(
                    'realtime_changes',
                    json_build_object(
                        'table', p_table,
                        'event', p_event,
                        'data', p_data,
                        'user_id', p_user_id,
                        'timestamp', extract(epoch from now())
                    )::text
                );
            END;
            $$;
        ");

        // Créer une table pour stocker les événements real-time (optionnel, pour debug)
        DB::statement("
            CREATE TABLE IF NOT EXISTS realtime_events (
                id SERIAL PRIMARY KEY,
                table_name TEXT NOT NULL,
                event_type TEXT NOT NULL,
                data JSONB NOT NULL,
                user_id INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        ");

        // Créer un trigger pour les todos
        DB::statement("
            CREATE OR REPLACE FUNCTION notify_todo_changes()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    PERFORM broadcast_change('todos', 'created', to_jsonb(NEW), NEW.user_id);
                    RETURN NEW;
                ELSIF TG_OP = 'UPDATE' THEN
                    PERFORM broadcast_change('todos', 'updated', to_jsonb(NEW), NEW.user_id);
                    RETURN NEW;
                ELSIF TG_OP = 'DELETE' THEN
                    PERFORM broadcast_change('todos', 'deleted', to_jsonb(OLD), OLD.user_id);
                    RETURN OLD;
                END IF;
                RETURN NULL;
            END;
            $$;
        ");

        // Attacher le trigger à la table todos
        DB::statement("DROP TRIGGER IF EXISTS todos_realtime_trigger ON todos;");
        DB::statement("
            CREATE TRIGGER todos_realtime_trigger
                AFTER INSERT OR UPDATE OR DELETE ON todos
                FOR EACH ROW EXECUTE FUNCTION notify_todo_changes();
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP TRIGGER IF EXISTS todos_realtime_trigger ON todos;");
        DB::statement("DROP FUNCTION IF EXISTS notify_todo_changes();");
        DB::statement("DROP FUNCTION IF EXISTS broadcast_change(text, text, jsonb, integer);");
        DB::statement("DROP TABLE IF EXISTS realtime_events;");
    }
};
