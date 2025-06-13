# Import des données Firebase vers Supabase

Ce guide explique comment importer vos données Firebase dans votre application Laravel/Supabase.

## 📋 Prérequis

1. Avoir exporté les données Firebase au format JSON
2. Placer les fichiers d'export à la racine du projet Laravel
3. Fichiers requis :
   - `users_export_2025-06-13.json` - Utilisateurs/Administrateurs
   - `companies_export_2025-06-13.json` - Entreprises
   - `customers_export_2025-06-13.json` - Clients
   - `devis_export_2025-06-13.json` - Devis

## 🚀 Méthodes d'importation

### Méthode 1 : Commande artisan (Recommandée)

```bash
# Import simple
php artisan firebase:import

# Import avec vidage de la base (fresh)
php artisan firebase:import --fresh

# Import forcé sans confirmation
php artisan firebase:import --force

# Import complet fresh + force
php artisan firebase:import --fresh --force
```

### Méthode 2 : Via le seeder principal

```bash
php artisan db:seed
# Puis répondre "Oui" à la question sur l'import Firebase
```

### Méthode 3 : Seeder Firebase uniquement

```bash
php artisan db:seed --class=FirebaseImportSeeder
```

## 📊 Correspondances des données

### Utilisateurs Firebase → Users Laravel
- `displayName` → `name`
- `email` → `email` 
- `phoneNumber` → `telephone`
- `city` → `ville`
- `address` → `adresse`
- `zipCode` → `code_postal`
- `country` → `pays`
- Mot de passe par défaut : `password123`

### Companies Firebase → Entreprises Laravel
- `name` → `nom`
- `businessNumber` → `siret`
- `sector` → `secteur_activite`
- `address` → `adresse`
- `city` → `ville`
- `country` → `pays` (normalisé)
- `phone` → `telephone`
- `email` → `email`
- `website` → `site_web`
- `status` → `active` (booléen)
- `description` → `notes`

### Customers Firebase → Clients Laravel
- `name` → `nom` + `prenom` (séparation automatique)
- `email` → `email`
- `phoneNumber` → `telephone`
- `address` → `adresse`
- `city` → `ville`
- `zipCode` → `code_postal`
- `country` → `pays` (normalisé)
- `status` → `actif` (booléen)
- `companyId` → `entreprise_id` (relation)

### Devis Firebase → Devis Laravel
- `devisNumber` → `numero_devis`
- `createDate` → `date_devis`
- `validUntil` → `date_validite`
- `status` → `statut` (mapping spécial)
- `subtotal` → `montant_ht`
- `taxes` → `taux_tva`
- `totalAmount` → `montant_ttc`
- `items` → lignes de devis (table séparée)

## 🔄 Mapping des statuts

### Statuts de devis
- `pending` → `brouillon`
- `sent` → `envoye`
- `accepted` → `accepte`
- `rejected` → `refuse`
- `expired` → `expire`
- `followed_up` → `envoye`

### Statuts d'envoi
- Présence d'`emailHistory` ou `lastEmailSentDate` → `envoye`
- Sinon → `non_envoye`

### Pays normalisés
- `martinique` → `Martinique`
- `guadeloupe` → `Guadeloupe`
- `french guiana` → `Guyane`
- `saint martin (french part)` → `Saint-Martin`

## ⚠️ Points importants

### Gestion des relations
1. **Entreprises** importées en premier
2. **Clients** liés aux entreprises via `companyId`
3. **Devis** liés aux clients via `devisTo.id`

### Gestion des erreurs
- Les erreurs sont loggées dans `storage/logs/laravel.log`
- L'import continue même si certains enregistrements échouent
- Les doublons d'emails utilisateurs sont évités

### Services
- Les services Firebase ne sont pas importés directement
- Les lignes de devis sont créées sans `service_id`
- Les services Laravel standard sont créés via `ServiceSeeder`

## 🔧 Dépannage

### Fichiers manquants
```
❌ Fichiers manquants détectés !
Veuillez placer les fichiers d'export Firebase à la racine du projet.
```
**Solution :** Vérifiez que tous les fichiers JSON sont à la racine du projet.

### Erreurs de contraintes
```
SQLSTATE[23503]: Foreign key violation
```
**Solution :** Utilisez l'option `--fresh` pour vider la base avant l'import.

### Mémoire insuffisante
```
Fatal error: Allowed memory size exhausted
```
**Solution :** Augmentez la limite mémoire PHP ou traitez les fichiers par lots.

### Erreurs de date
```
Carbon\Exceptions\InvalidFormatException
```
**Solution :** Vérifiez le format des dates dans les fichiers Firebase.

## 📝 Logs

Les logs détaillés sont disponibles dans :
- `storage/logs/laravel.log` - Erreurs d'import
- Console - Progression et statistiques

## 🔐 Sécurité

### Mots de passe
- Tous les utilisateurs importés ont le mot de passe `password123`
- **Changez immédiatement** tous les mots de passe après l'import
- Forcez la réinitialisation au premier login

### Données sensibles
- Les emails sont préservés pour la connexion
- Les données personnelles sont importées telles quelles
- Vérifiez la conformité RGPD après l'import

## 📊 Vérification post-import

Après l'import, vérifiez :

```bash
# Statistiques générales
php artisan firebase:import --force

# Vérification manuelle
php artisan tinker
>>> App\Models\User::count()
>>> App\Models\Entreprise::count()
>>> App\Models\Client::count()
>>> App\Models\Devis::count()
```

## 💡 Conseils

1. **Sauvegardez** votre base avant l'import
2. **Testez** sur un environnement de développement d'abord
3. **Documentez** les modifications spécifiques à votre cas
4. **Planifiez** la migration des factures manuellement
5. **Formez** les utilisateurs aux nouveaux mots de passe

## 🆘 Support

En cas de problème :
1. Consultez les logs dans `storage/logs/laravel.log`
2. Vérifiez la structure des fichiers JSON
3. Testez avec un échantillon réduit de données
4. Contactez l'équipe de développement avec les logs d'erreur 
