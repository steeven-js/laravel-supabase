<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\EntrepriseController;
use App\Http\Controllers\DevisController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Route;

// Page d'accueil
Route::get('/', [HomeController::class, 'index'])->name('home');

// Routes protégées par authentification
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Routes pour les clients
    Route::resource('clients', ClientController::class);

    // Routes pour les entreprises
    Route::resource('entreprises', EntrepriseController::class);

    // Routes pour les devis
    Route::resource('devis', DevisController::class)->parameters(['devis' => 'devis']);

    // Actions spéciales pour les devis
    Route::patch('devis/{devis}/accepter', [DevisController::class, 'accepter'])->name('devis.accepter');
    Route::patch('devis/{devis}/refuser', [DevisController::class, 'refuser'])->name('devis.refuser');
});

// Inclusion des autres fichiers de routes
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
