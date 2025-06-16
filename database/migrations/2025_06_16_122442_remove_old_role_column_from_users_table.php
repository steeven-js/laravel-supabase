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
        // Supprimer l'ancien champ role de la table users
        // Cette migration doit être exécutée APRÈS la migration create_user_roles_table
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remettre le champ role pour le rollback
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'superadmin'])->default('admin')->after('user_role_id');
        });
    }
};
