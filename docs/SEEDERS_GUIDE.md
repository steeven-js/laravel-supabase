# Guide des Seeders et Données de Test

Ce système crée automatiquement des données réalistes pour le développement et les tests.

## 🎯 Données créées

### ✅ Utilisateur principal
- **Email** : `jacques.steeven@gmail.com`
- **Mot de passe** : `password`

### 📊 Statistiques générées
- **20 entreprises** avec des données réalistes (secteurs variés, SIRET, etc.)
- **50 clients** (60% rattachés à des entreprises, 40% particuliers)
- **~51 devis** avec différents statuts et prestations variées
- **~35 factures** (certaines issues de devis, d'autres indépendantes)
- **Montant total** : ~158 000€ de chiffre d'affaires

## 🚀 Commandes utiles

### Créer toutes les données
```bash
php artisan migrate:fresh --seed
```

### Créer seulement les données (sans migrations)
```bash
php artisan db:seed
```

### Créer des types spécifiques de données
```bash
php artisan db:seed --class=EntrepriseSeeder
php artisan db:seed --class=ClientSeeder
php artisan db:seed --class=DevisSeeder
php artisan db:seed --class=FactureSeeder
```

## 🛠 Fonctionnalités en mode développement (APP_ENV=local)

Dans le **Dashboard**, vous avez accès à des boutons spéciaux :

### 🔄 Reset données (garder utilisateur)
- Supprime toutes les données business (entreprises, clients, devis, factures)
- **Conserve** l'utilisateur principal
- Recrée toutes les données de test

### 🗑 Reset complet
- Supprime **TOUT** (y compris l'utilisateur)
- Recrée tout de zéro
- ⚠️ **Attention** : action irréversible !

## 📈 Types de données créées

### Entreprises
- **5 types spécifiques** : Tech Solutions, Digital Innovation, Consulting, Marketing, Web Dev
- **15 entreprises aléatoires** avec secteurs variés
- Données complètes : SIRET, secteur d'activité, chiffre d'affaires, etc.

### Clients
- **3 clients de test** prédéfinis
- **40 clients aléatoires** avec profils variés
- **7 profils particuliers** : Freelances, consultants, artisans, etc.

### Devis
- **7 types de prestations** réalistes :
  - Développement web vitrine (2 500€ - 5 000€)
  - Application mobile (8 000€ - 15 000€)
  - Identité visuelle (1 500€ - 3 500€)
  - Formation marketing digital (3 000€ - 6 000€)
  - Audit cybersécurité (4 000€ - 8 000€)
  - E-commerce sur mesure (6 000€ - 12 000€)
  - Consultation stratégique (2 000€ - 5 000€)

### Factures
- **Factures automatiques** issues des devis acceptés
- **Factures indépendantes** pour prestations ponctuelles
- **Différents statuts** : brouillon, envoyée, payée, en retard
- **Données de paiement** réalistes (mode, référence)

## 🎲 Répartition intelligente des statuts

### Devis
- **Brouillon** : Quelques nouveaux
- **Envoyé** : Majorité
- **Accepté** : ~35% (génèrent des factures)
- **Refusé** : ~30%
- **Expiré** : Anciens devis

### Factures
- **Brouillon** : ~10%
- **Envoyée** : ~30%
- **Payée** : ~60%
- **En retard** : ~20% des échues

## 🧪 Tests et développement

### Tester les emails
```bash
php artisan mail:test-facture test@example.com
php artisan mail:test-facture admin@example.com --admin
```

### Générer plus de données
```bash
php artisan db:seed --class=ClientSeeder
php artisan db:seed --class=DevisSeeder
```

## 🔧 Personnalisation

### Modifier les types d'entreprises
Éditez `database/seeders/EntrepriseSeeder.php` ligne 16

### Ajouter des prestations
Éditez `database/seeders/DevisSeeder.php` ligne 25

### Modifier les montants
Ajustez les fourchettes dans `$prestations['montant_base']`

## 📱 Interface utilisateur

Le **Dashboard** affiche en temps réel :
- Statistiques globales
- Répartition par statut
- Chiffre d'affaires total
- Alertes (factures en retard)
- Actions rapides (créer nouveau...)

## 🔒 Sécurité

- Les boutons de reset ne sont visibles qu'en mode `local`
- Protection par confirmation avant destruction
- Messages d'alerte explicites

## 💡 Bonnes pratiques

1. **Développement** : Utilisez "Reset données" pour garder votre session
2. **Tests** : Utilisez "Reset complet" pour partir sur de nouvelles bases
3. **Démonstration** : Les données sont réalistes et variées
4. **Production** : Ces fonctions sont automatiquement désactivées

## 🐛 Dépannage

### Erreur de contrainte unique
```bash
php artisan migrate:fresh --seed
```

### Données incohérentes
Les seeders utilisent des compteurs internes pour éviter les doublons.

### Performances lentes
Normal : Faker génère beaucoup de données réalistes (~1 minute)

---

**Bon développement ! 🚀** 
