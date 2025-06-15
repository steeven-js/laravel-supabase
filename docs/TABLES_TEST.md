# 🧪 Système de Tables de Test

Ce document explique le système de tables de test parallèles aux tables de production pour faciliter les tests et le développement.

## 🎯 Vue d'ensemble

Le système comprend des tables de test qui dupliquent la structure exacte des tables de production :

### Tables créées
- `test_devis` (identique à `devis`)
- `test_factures` (identique à `factures`) 
- `test_lignes_devis` (identique à `lignes_devis`)
- `test_lignes_factures` (identique à `lignes_factures`)

### Contraintes
- Les contraintes étrangères pointent vers les bonnes tables (`test_devis` ↔ `test_lignes_devis`)
- Les relations avec les tables communes restent vers production (`clients`, `services`)

## 📋 Migrations

### Fichiers de migration
```
database/migrations/
├── 2025_06_15_001817_create_test_devis_table.php
├── 2025_06_15_001828_create_test_factures_table.php  
├── 2025_06_15_001959_create_test_lignes_devis_table.php
└── 2025_06_15_002011_create_test_lignes_factures_table.php
```

### Exécution
```bash
php artisan migrate
```

## 🌱 Seeders

### Seeders disponibles
- `TestDevisSeeder` : Génère 10 devis de test avec statuts variés
- `TestFacturesSeeder` : Génère 8 factures de test avec liens devis parfois
- `TestDataSeeder` : Orchestrateur qui appelle les autres seeders

### Données générées
- **Devis** : 10 devis avec statuts variés (brouillon, envoyé, accepté, refusé, expiré)
- **Factures** : 8 factures avec statuts variés (brouillon, envoyée, payée, en retard, annulée)
- **Lignes** : 2-4 lignes par devis, 1-3 lignes par facture
- **Montants** : Calculés automatiquement avec TVA 20%

### Exécution
```bash
# Seeder principal (recommandé)
php artisan db:seed --class=TestDataSeeder

# Seeders individuels
php artisan db:seed --class=TestDevisSeeder
php artisan db:seed --class=TestFacturesSeeder
```

## 🖥️ Interface de Monitoring

### Accès
Naviguer vers `/monitoring` (uniquement en mode local)

### Fonctionnalités disponibles

#### 📊 Statistiques des tables
- Comparaison production vs test
- Nombre d'enregistrements par table
- Répartition par statut
- Mise à jour en temps réel

#### 🔄 Réinitialisation
- Vider toutes les tables de test
- Relancer automatiquement les seeders
- Logs détaillés de l'opération
- Confirmation avec avertissement

#### 🎛️ Interface utilisateur
- Section dédiée "Tables de Test"
- Badges de distinction production/test
- Statistiques visuelles en cartes
- Messages de statut détaillés

## 🚀 Utilisation

### Via l'interface web
1. Aller sur `/monitoring`
2. Section "Tables de Test"
3. Cliquer sur "Afficher les statistiques"
4. Utiliser "Vider et régénérer" au besoin

### Via les commandes
```bash
# Statistiques rapides
php artisan tinker --execute="
echo 'Devis test: ' . DB::table('test_devis')->count() . PHP_EOL;
echo 'Factures test: ' . DB::table('test_factures')->count() . PHP_EOL;
"

# Vider et régénérer
php artisan db:seed --class=TestDataSeeder
```

## 🔧 Structure des données

### Préfixes des numéros
- Devis test : `TEST-DV-0001` à `TEST-DV-0010`
- Factures test : `TEST-FACT-0001` à `TEST-FACT-0008`

### Statuts distribués
- **Devis** : Répartition équilibrée entre tous les statuts
- **Factures** : Idem avec dates de paiement réalistes
- **Dates** : Échelonnées sur 30-60 derniers jours

### Montants réalistes
- Prix unitaires : 100€ - 2000€ pour devis, 200€ - 1500€ pour factures
- TVA : 20% appliquée systématiquement
- Totaux calculés automatiquement

## ⚙️ Configuration backend

### Routes ajoutées
```php
// routes/web.php (monitoring section)
Route::post('reset-test-tables', [MonitoringController::class, 'resetTestTables'])
     ->name('reset-test-tables');
Route::get('tables-stats', [MonitoringController::class, 'getTablesStats'])
     ->name('tables-stats');
```

### Méthodes contrôleur
- `resetTestTables()` : Vide et régénère les données
- `getTablesStats()` : Retourne les statistiques comparatives

## 🛡️ Sécurité

### Restrictions
- Fonctionnalités uniquement en mode `local`
- Vérification `app()->environment('local')` sur toutes les routes
- Aucun accès possible en production

### Logs
- Toutes les opérations sont loggées
- Détails des erreurs avec stack trace
- Suivi des statistiques d'opérations

## 🎯 Cas d'usage

### Développement
- Tester les nouvelles fonctionnalités sans affecter la production
- Données cohérentes et prévisibles
- Reset rapide pour recommencer

### Tests automatisés
- Base de données de test stable
- Données connues à l'avance
- Isolation complète de la production

### Démonstrations
- Données exemple avec statuts variés
- Montants réalistes
- Historique crédible

## 📈 Statistiques actuelles

Après exécution du seeder :
- ✅ **10 devis de test** avec leurs lignes (28 au total)
- ✅ **8 factures de test** avec leurs lignes (15 au total)
- ✅ **Tous les statuts** représentés
- ✅ **Données cohérentes** avec relations correctes

## 🔮 Extensions futures

### Switch automatique
- Middleware pour basculer automatiquement vers tables test
- Variable d'environnement ou session pour le mode
- Interface pour activer/désactiver le mode test

### Tests automatisés
- Suite de tests utilisant les tables test
- Validation de la cohérence des données
- Tests de performance comparatifs

### Outils de comparaison
- Diff entre données production/test
- Migration de données spécifiques
- Synchronisation sélective 
