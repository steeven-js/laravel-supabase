# Migration Firebase → Supabase - Version 0.3.0 ✅

Cette documentation explique comment migrer vos données Firebase vers votre application Laravel/Supabase.

## 🎉 Migration Terminée avec Succès !

**Statut :** ✅ **COMPLÉTÉE** le 13 juin 2025
- **18 lignes de devis** importées et **100% associées** aux services
- **9 services** au catalogue (valeur totale : **9 772,62€**)
- **Toutes les données Firebase** importées et structurées

## 🎯 Objectif

Importer les données Firebase exportées (utilisateurs, entreprises, clients, devis) dans votre base Supabase, tout en préservant les relations et en adaptant les structures de données.

## 📦 Ce qui est importé

- ✅ **Utilisateurs** (6 utilisateurs importés)
- ✅ **Entreprises** (3 entreprises importées)  
- ✅ **Clients** (15 clients importés)
- ✅ **Devis** (6 devis avec 18 lignes importées)
- ✅ **Services** (2 services Firebase + 7 services créés automatiquement)
- ❌ **Factures** (non importées, gestion manuelle requise)

## 🚀 Démarrage rapide

### 1. Placez vos fichiers d'export

Copiez vos exports Firebase à la racine du projet :
```
laravel-supabase/
├── users_export_2025-06-13.json
├── companies_export_2025-06-13.json
├── customers_export_2025-06-13.json
├── devis_export_2025-06-13.json
└── ...
```

### 2. Lancez l'import

```bash
# Import complet avec vidage de la base
php artisan firebase:import --fresh

# Ou import simple sans vidage
php artisan firebase:import
```

### 3. Connectez-vous

Utilisez les emails importés avec le mot de passe : `password123`

## 📋 Guide détaillé

Consultez la [documentation complète](docs/firebase-import.md) pour :
- Correspondances détaillées des champs
- Gestion des erreurs
- Options avancées
- Dépannage

## ⚡ Commandes disponibles

```bash
# Via commande dédiée (recommandé)
php artisan firebase:import [--fresh] [--force]

# Via seeder principal
php artisan db:seed

# Seeder Firebase uniquement
php artisan db:seed --class=FirebaseImportSeeder
```

## 🔧 Options de la commande

- `--fresh` : Vide la base avant l'import
- `--force` : Lance sans confirmation

## 📊 Statistiques post-import

La commande affiche automatiquement :
- Nombre d'utilisateurs importés
- Nombre d'entreprises importées  
- Nombre de clients importés
- Nombre de devis importés
- Emails des administrateurs

## ⚠️ Points d'attention

### Mots de passe
- **Tous les utilisateurs** ont le mot de passe `password123`
- **Changez immédiatement** après la première connexion

### Factures
- Les factures ne sont **pas importées automatiquement**
- Convertissez manuellement les devis acceptés en factures

### Relations
L'import respecte l'ordre des dépendances :
1. Entreprises
2. Clients (liés aux entreprises)
3. Devis (liés aux clients)

## 🔍 Vérification

Après l'import, vérifiez dans votre interface ou via :

```bash
php artisan tinker
>>> App\Models\User::count()
>>> App\Models\Devis::with('client.entreprise')->get()
```

## 📞 Support

- Documentation détaillée : [`docs/firebase-import.md`](docs/firebase-import.md)
- Logs d'erreur : `storage/logs/laravel.log`
- Structure des données : Consultez les modèles dans `app/Models/`

## 🏗️ Architecture

```
Firebase JSON → FirebaseImportSeeder → Laravel Models → Supabase
```

Le système :
1. Lit les fichiers JSON Firebase
2. Transforme les données selon les mappings définis
3. Crée les enregistrements Laravel avec les bonnes relations
4. Stocke tout dans Supabase

---

**Prêt à migrer ?** Lancez `php artisan firebase:import --fresh` ! 🚀 
