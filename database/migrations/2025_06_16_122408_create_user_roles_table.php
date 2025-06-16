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
        // Créer la table user_roles
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // super_admin, admin
            $table->string('display_name'); // Super Administrateur, Administrateur
            $table->text('description')->nullable();
            $table->json('permissions')->nullable(); // Permissions spécifiques au rôle
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insérer les rôles par défaut
        DB::table('user_roles')->insert([
            [
                'name' => 'super_admin',
                'display_name' => 'Super Administrateur',
                'description' => 'Accès complet à toutes les fonctionnalités du système',
                'permissions' => json_encode([
                    'manage_users', 'manage_roles', 'manage_system', 'manage_all_data',
                    'dev_tools', 'backup_restore', 'system_settings'
                ]),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'admin',
                'display_name' => 'Administrateur',
                'description' => 'Accès aux fonctionnalités de gestion des clients, devis et factures',
                'permissions' => json_encode([
                    'manage_clients', 'manage_devis', 'manage_factures', 'manage_services',
                    'view_dashboard', 'send_emails'
                ]),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Ajouter la clé étrangère user_role_id à la table users
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('user_role_id')->nullable()->after('role')->constrained('user_roles')->onDelete('set null');
        });

        // Migrer les données existantes
        $superAdmins = DB::table('users')->where('role', 'superadmin')->get();
        $admins = DB::table('users')->where('role', 'admin')->get();

        $superAdminRoleId = DB::table('user_roles')->where('name', 'super_admin')->value('id');
        $adminRoleId = DB::table('user_roles')->where('name', 'admin')->value('id');

        foreach ($superAdmins as $user) {
            DB::table('users')->where('id', $user->id)->update(['user_role_id' => $superAdminRoleId]);
        }

        foreach ($admins as $user) {
            DB::table('users')->where('id', $user->id)->update(['user_role_id' => $adminRoleId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Supprimer la clé étrangère
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['user_role_id']);
            $table->dropColumn('user_role_id');
        });

        // Supprimer la table user_roles
        Schema::dropIfExists('user_roles');
    }
};
