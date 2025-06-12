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
        Schema::create('opportunities', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->text('description')->nullable();
            $table->enum('etape', ['prospection', 'qualification', 'proposition', 'negociation', 'fermeture', 'gagnee', 'perdue'])->default('prospection');
            $table->integer('probabilite')->default(0)->comment('Probabilité en pourcentage (0-100)');
            $table->decimal('montant', 15, 2)->nullable()->comment('Montant estimé');
            $table->date('date_cloture_prevue')->nullable();
            $table->date('date_cloture_reelle')->nullable();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->comment('Administrateur responsable');
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('opportunities');
    }
};
