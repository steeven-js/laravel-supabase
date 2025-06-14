# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-01-23

### Ajouté
- **Amélioration du composant PDF des devis** :
  - Rendu PDF avec fond transparent pour l'aperçu
  - Affichage de l'email de l'administrateur assigné au lieu de l'email Madinia
  - Informations légales complètes de Madinia dans le pied de page (SIRET, N° DA, coordonnées bancaires)
  - Gestion robuste des types de données numériques (correction erreur toFixed)

- **Interface utilisateur harmonisée** :
  - Refonte complète de la section d'actions du devis avec Card container
  - Statuts organisés avec padding uniforme et style cohérent
  - Indicateur visuel d'assignation administrateur avec point coloré
  - Actions groupées logiquement avec hauteurs et espacements uniformes
  - Design responsive optimisé mobile/desktop

### Corrigé
- **Erreurs de rendu PDF** : Correction du bug `toFixed is not a function` avec conversion explicite des types
- **Données PDF sécurisées** : Amélioration de `getSafeDevisData()` avec conversion Number() robuste
- **Interface TypeScript** : Ajout des propriétés manquantes dans l'interface Madinia (nom_compte_bancaire, numero_compte)

### Technique
- **Optimisation des conversions de données** : Remplacement de parseFloat() par Number() pour plus de robustesse
- **Amélioration du composant DevisPdfPreview** : Meilleure gestion des données nulles/undefined
- **Code plus maintenable** : Structure UI/UX harmonisée avec classes Tailwind cohérentes

## [0.2.8] - 2025-06-13

### Ajouté
- **Migration Firebase vers Supabase** : Import complet des données Firebase
  - Import des entreprises (companies) avec gestion des doublons
  - Import des clients (customers) avec associations entreprises
  - Import des utilisateurs (users) avec gestion des rôles
  - Import des devis (devis) avec leurs lignes détaillées
  - Import des services Firebase vers catalogue Supabase
  
- **Gestion intelligente des services** :
  - Création automatique de 7 nouveaux services spécialisés
  - Association automatique des lignes de devis aux services
  - Algorithme d'association sémantique avec correspondance par mots-clés
  - Gestion des doublons de codes services avec suffixes automatiques
  
- **Nouvelles commandes Artisan** :
  - `php artisan db:seed --class=FirebaseImportSeeder` : Import complet des données Firebase
  - `php artisan check:services` : Vérification du catalogue de services
  
- **Services créés automatiquement** :
  - Formation IA par sessions (800€)
  - Formation IA pour séniors (120€)
  - Solution automatisation fidélisation client (574,80€)
  - Solution automatisation acquisition client (1 438,80€)
  - Optimisation capture de leads (1 438,80€)
  - Solution automatisation création contenu (3 636€)
  - Solution automatisation prospection B2B (1 308€)

### Modifié
- **Structure de base de données** :
  - Migration services : tous les champs sauf `nom` sont maintenant nullable
  - Migration lignes_devis : `service_id` est maintenant nullable
  - Migration lignes_factures : `service_id` est maintenant nullable
  
- **Modèles Laravel** :
  - Correction des relations dans le modèle `Devis`
  - Amélioration du modèle `Service` avec nouvelles relations
  - Ajout de scopes de recherche dans les modèles

### Technique
- **FirebaseImportSeeder amélioré** :
  - Gestion des erreurs et validation des données
  - Mapping intelligent des champs Firebase → Supabase
  - Statistiques détaillées d'import
  - Gestion des relations complexes entre entités
  
- **Algorithme d'association services** :
  - Correspondance exacte par nom
  - Correspondance partielle par inclusion de chaînes
  - Recherche sémantique avec mots-clés spécifiques
  - Seuil de similarité de 70% basé sur la distance de Levenshtein

### Résultats
- **18 lignes de devis** importées et associées à 100%
- **9 services** au catalogue (2 importés + 7 créés)
- **Valeur totale du catalogue : 9 772,62€**
- **Migration réussie de 3 entreprises, 15 clients, 6 utilisateurs, 6 devis**

## [0.2.0] - Date précédente
### Ajouté
- Fonctionnalités existantes...

## [0.1.0] - Date initiale
### Ajouté
- Version initiale du projet Laravel-Supabase 
