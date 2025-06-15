<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\DevisController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EntrepriseController;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\Settings\MadiniaController;
use App\Http\Controllers\Settings\ProfileController;

// Page d'accueil
Route::get('/', function () {
    return Inertia::render('welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('home');

// Routes protégées par authentification
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Routes pour les clients
    Route::resource('clients', ClientController::class);
    Route::post('clients/{client}/send-email', [ClientController::class, 'sendEmail'])->name('clients.send-email');

    // Routes pour les opportunités
    Route::post('clients/{client}/opportunities', [App\Http\Controllers\OpportunityController::class, 'store'])->name('opportunities.store');
    Route::patch('opportunities/{opportunity}', [App\Http\Controllers\OpportunityController::class, 'update'])->name('opportunities.update');
    Route::delete('opportunities/{opportunity}', [App\Http\Controllers\OpportunityController::class, 'destroy'])->name('opportunities.destroy');

    // Routes pour les tickets
    Route::post('clients/{client}/tickets', [App\Http\Controllers\TicketController::class, 'store'])->name('tickets.store');
    Route::patch('tickets/{ticket}', [App\Http\Controllers\TicketController::class, 'update'])->name('tickets.update');
    Route::delete('tickets/{ticket}', [App\Http\Controllers\TicketController::class, 'destroy'])->name('tickets.destroy');
    Route::patch('tickets/{ticket}/resoudre', [App\Http\Controllers\TicketController::class, 'resoudre'])->name('tickets.resoudre');
    Route::patch('tickets/{ticket}/fermer', [App\Http\Controllers\TicketController::class, 'fermer'])->name('tickets.fermer');
    Route::patch('tickets/{ticket}/reouvrir', [App\Http\Controllers\TicketController::class, 'reouvrir'])->name('tickets.reouvrir');
    Route::patch('tickets/{ticket}/assigner', [App\Http\Controllers\TicketController::class, 'assigner'])->name('tickets.assigner');
    Route::get('api/users', [App\Http\Controllers\TicketController::class, 'getUsers'])->name('api.users');

    // Routes pour les todos
    Route::post('clients/{client}/todos', [App\Http\Controllers\TodoController::class, 'store'])->name('todos.store');
    Route::put('clients/{client}/todos/{todo}', [App\Http\Controllers\TodoController::class, 'update'])->name('todos.update');
    Route::delete('clients/{client}/todos/{todo}', [App\Http\Controllers\TodoController::class, 'destroy'])->name('todos.destroy');
    Route::patch('clients/{client}/todos/{todo}/toggle', [App\Http\Controllers\TodoController::class, 'toggle'])->name('todos.toggle');
    Route::patch('clients/{client}/todos/reorder', [App\Http\Controllers\TodoController::class, 'reorder'])->name('todos.reorder');

    // Routes pour les entreprises
    Route::resource('entreprises', EntrepriseController::class);

    // Routes pour les services
    Route::prefix('services')->name('services.')->group(function () {
        Route::get('/', [ServiceController::class, 'index'])->name('index');
        Route::get('/create', [ServiceController::class, 'create'])->name('create');
        Route::post('/', [ServiceController::class, 'store'])->name('store');
        Route::get('/{service}', [ServiceController::class, 'show'])->name('show');
        Route::get('/{service}/edit', [ServiceController::class, 'edit'])->name('edit');
        Route::patch('/{service}', [ServiceController::class, 'update'])->name('update');
        Route::delete('/{service}', [ServiceController::class, 'destroy'])->name('destroy');

        // Actions spéciales pour les services
        Route::patch('/{service}/toggle', [ServiceController::class, 'toggle'])->name('toggle');
        Route::post('/{service}/duplicate', [ServiceController::class, 'duplicate'])->name('duplicate');

        // Nouvelles routes pour améliorer la navigation
        Route::get('/catalogue', [ServiceController::class, 'catalogue'])->name('catalogue');
        Route::get('/actifs', [ServiceController::class, 'actifs'])->name('actifs');
        Route::get('/statistiques', [ServiceController::class, 'statistiques'])->name('statistiques');
    });

    // Routes pour les devis
    Route::resource('devis', DevisController::class)->parameters(['devis' => 'devis']);

    // Actions spéciales pour les devis
    Route::patch('devis/{devis}/accepter', [DevisController::class, 'accepter'])->name('devis.accepter');
    Route::patch('devis/{devis}/refuser', [DevisController::class, 'refuser'])->name('devis.refuser');
    Route::patch('devis/{devis}/changer-statut', [DevisController::class, 'changerStatut'])->name('devis.changer-statut');
    Route::get('devis/{devis}/envoyer-email', [DevisController::class, 'afficherEnvoiEmail'])->name('devis.afficher-envoi-email');
    Route::post('devis/{devis}/envoyer-email', [DevisController::class, 'envoyerEmail'])->name('devis.envoyer-email');

    // Transformation devis en facture
    Route::get('devis/{devis}/transformer-facture', [DevisController::class, 'transformerEnFacture'])->name('devis.transformer-facture');
    Route::post('devis/{devis}/confirmer-transformation', [DevisController::class, 'confirmerTransformationFacture'])->name('devis.confirmer-transformation');

    // PDF devis
    Route::get('devis/{devis}/pdf', [DevisController::class, 'voirPdf'])->name('devis.pdf');
    Route::get('devis/{devis}/telecharger-pdf', [DevisController::class, 'telechargerPdf'])->name('devis.telecharger-pdf');
    Route::post('devis/{devis}/regenerer-pdf', [DevisController::class, 'regenererPdf'])->name('devis.regenerer-pdf');
    Route::post('devis/{devis}/update-pdf-react', [DevisController::class, 'updatePdfFromReact'])->name('devis.update-pdf-react');
    Route::post('devis/{devis}/save-react-pdf', [DevisController::class, 'saveReactPdf'])->name('devis.save-react-pdf');
    Route::get('devis/{devis}/generate-react-pdf', [DevisController::class, 'generateReactPdf'])->name('devis.generate-react-pdf');
    // Nouveaux endpoints pour gestion intelligente
    Route::post('devis/{devis}/ensure-pdf', [DevisController::class, 'ensurePdf'])->name('devis.ensure-pdf');
    Route::get('devis/{devis}/pdf-status', [DevisController::class, 'getPdfStatus'])->name('devis.pdf-status');

    // Routes pour les factures
    Route::resource('factures', FactureController::class)->parameters(['factures' => 'facture']);

    // Actions spéciales pour les factures
    Route::get('factures/{facture}/envoyer-email', [FactureController::class, 'envoyerEmailForm'])->name('factures.envoyer-email-form');
    Route::patch('factures/{facture}/changer-statut', [FactureController::class, 'changerStatut'])->name('factures.changer-statut');
    Route::patch('factures/{facture}/marquer-payee', [FactureController::class, 'marquerPayee'])->name('factures.marquer-payee');
    Route::post('factures/{facture}/envoyer-email', [FactureController::class, 'envoyerEmail'])->name('factures.envoyer-email');
    Route::patch('factures/{facture}/envoyer', [FactureController::class, 'envoyer'])->name('factures.envoyer');

    // PDF factures
    Route::get('factures/{facture}/pdf', [FactureController::class, 'voirPdf'])->name('factures.pdf');
    Route::get('factures/{facture}/telecharger-pdf', [FactureController::class, 'telechargerPdf'])->name('factures.telecharger-pdf');
    Route::post('factures/{facture}/regenerer-pdf', [FactureController::class, 'regenererPdf'])->name('factures.regenerer-pdf');
    Route::get('factures/{facture}/sync-pdf', [FactureController::class, 'syncSupabase'])->name('factures.sync-pdf');
    Route::get('factures/{facture}/sync-supabase', [FactureController::class, 'syncSupabase'])->name('factures.sync-supabase');
    Route::post('factures/{facture}/save-react-pdf', [FactureController::class, 'saveReactPdf'])->name('factures.save-react-pdf');

    // Routes pour le profil utilisateur
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Routes pour la gestion des avatars
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
    Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar'])->name('profile.avatar.delete');

    // Routes pour les services
    Route::resource('services', ServiceController::class);
    Route::patch('/services/{service}/toggle', [ServiceController::class, 'toggle'])->name('services.toggle');
    Route::post('/services/{service}/duplicate', [ServiceController::class, 'duplicate'])->name('services.duplicate');

    // Routes pour l'entreprise Madinia
    Route::get('/madinia', [MadiniaController::class, 'show'])->name('madinia.show');
    Route::patch('/madinia', [MadiniaController::class, 'update'])->name('madinia.update');
    Route::get('/api/madinia', [MadiniaController::class, 'api'])->name('madinia.api');

    // Routes pour les modèles d'email
    Route::prefix('email-templates')->name('email-templates.')->group(function () {
        Route::get('/', [App\Http\Controllers\EmailTemplateController::class, 'index'])->name('index');
        Route::get('/create', [App\Http\Controllers\EmailTemplateController::class, 'create'])->name('create');
        Route::post('/', [App\Http\Controllers\EmailTemplateController::class, 'store'])->name('store');
        Route::get('/{emailTemplate}', [App\Http\Controllers\EmailTemplateController::class, 'show'])->name('show');
        Route::get('/{emailTemplate}/edit', [App\Http\Controllers\EmailTemplateController::class, 'edit'])->name('edit');
        Route::patch('/{emailTemplate}', [App\Http\Controllers\EmailTemplateController::class, 'update'])->name('update');
        Route::delete('/{emailTemplate}', [App\Http\Controllers\EmailTemplateController::class, 'destroy'])->name('destroy');
        Route::post('/{emailTemplate}/duplicate', [App\Http\Controllers\EmailTemplateController::class, 'duplicate'])->name('duplicate');
        Route::patch('/{emailTemplate}/set-default', [App\Http\Controllers\EmailTemplateController::class, 'setDefault'])->name('set-default');
        Route::get('/{emailTemplate}/preview', [App\Http\Controllers\EmailTemplateController::class, 'preview'])->name('preview');
    });

    // Routes API pour les modèles d'email (utilisées pour récupérer les templates lors de l'envoi d'emails)
    Route::prefix('api/email-templates')->name('api.email-templates.')->group(function () {
        Route::get('/by-category', [App\Http\Controllers\EmailTemplateController::class, 'getByCategory'])->name('by-category');
        Route::get('/default', [App\Http\Controllers\EmailTemplateController::class, 'getDefault'])->name('default');
    });

    // Routes pour l'historique des entités
    Route::prefix('historique')->name('historique.')->group(function () {
        Route::get('/', [App\Http\Controllers\HistoriqueController::class, 'index'])->name('index');
        Route::get('/statistiques', [App\Http\Controllers\HistoriqueController::class, 'statistiques'])->name('statistiques');

        // Historique spécifique par entité
        Route::get('/client/{client}', [App\Http\Controllers\HistoriqueController::class, 'client'])->name('client');
        Route::get('/entreprise/{entreprise}', [App\Http\Controllers\HistoriqueController::class, 'entreprise'])->name('entreprise');
        Route::get('/devis/{devis}', [App\Http\Controllers\HistoriqueController::class, 'devis'])->name('devis');
        Route::get('/facture/{facture}', [App\Http\Controllers\HistoriqueController::class, 'facture'])->name('facture');
    });

    // API pour l'historique (pour les widgets et composants React)
    Route::prefix('api/historique')->name('api.historique.')->group(function () {
        Route::get('/{type}/{id}', [App\Http\Controllers\HistoriqueController::class, 'apiHistoriqueEntite'])->name('entite');
    });
});

// Routes de développement (seulement en mode local)
if (app()->environment('local')) {
    Route::middleware(['auth', 'verified'])->prefix('dev')->name('dev.')->group(function () {
        Route::post('reset-keep-user', [App\Http\Controllers\DevDataController::class, 'resetKeepUser'])->name('reset-keep-user');
        Route::post('reset-all', [App\Http\Controllers\DevDataController::class, 'resetAll'])->name('reset-all');
        Route::post('generate-more', [App\Http\Controllers\DevDataController::class, 'generateMore'])->name('generate-more');
        Route::get('stats', [App\Http\Controllers\DevDataController::class, 'stats'])->name('stats');
    });

    // Routes de monitoring (seulement en mode local)
    Route::middleware(['auth', 'verified'])->prefix('monitoring')->name('monitoring.')->group(function () {
        Route::get('/', [MonitoringController::class, 'index'])->name('index');
        Route::post('test-email', [MonitoringController::class, 'testEmail'])->name('test-email');
        Route::post('test-database', [MonitoringController::class, 'testDatabase'])->name('test-database');
        Route::post('clear-cache', [MonitoringController::class, 'clearCache'])->name('clear-cache');
        Route::post('reset-test-tables', [MonitoringController::class, 'resetTestTables'])->name('reset-test-tables');
        Route::get('tables-stats', [MonitoringController::class, 'getTablesStats'])->name('tables-stats');
        Route::post('switch-to-test', [MonitoringController::class, 'switchToTestMode'])->name('switch-to-test');
        Route::post('switch-to-production', [MonitoringController::class, 'switchToProductionMode'])->name('switch-to-production');
        Route::get('current-mode', [MonitoringController::class, 'getCurrentMode'])->name('current-mode');
        Route::get('test-tables', [MonitoringController::class, 'testTables'])->name('test-tables');
    });

    // Route pour prévisualiser l'email Markdown (développement uniquement)
    Route::get('preview-email', function () {
        $monitoringController = new MonitoringController();
        $diagnostics = $monitoringController->getDiagnostics();
        return new \App\Mail\TestEmailMark($diagnostics, 'preview@example.com');
    })->middleware(['auth', 'verified']);
}



// Inclusion des autres fichiers de routes
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
