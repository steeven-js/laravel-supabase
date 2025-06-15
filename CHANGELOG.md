# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-01-23

### Ajouté
- **Implémentation complète de l'aperçu PDF pour les factures** :
  - Nouveau composant `FacturePdfPreview` avec design professionnel
  - Modal d'aperçu PDF intégré avec PDFViewer
  - Bouton de téléchargement PDF avec état de chargement
  - Gestion sécurisée des données facture pour le rendu PDF

- **Gestion des administrateurs assignés aux factures** :
  - Ajout du champ `administrateur_id` dans la table factures 
  - Affichage du nom et email de l'administrateur assigné dans "Facture de"
  - Remplacement automatique de l'email Madinia par celui de l'admin assigné
  - Encadré bleu de mise en évidence de l'administrateur responsable

- **Amélioration de l'interface factures** :
  - Réorganisation des dates : date de facture à gauche, date d'échéance à droite
  - Layout à 2 colonnes pour un affichage équilibré des dates principales
  - Date de paiement dans un encadré vert séparé (quand applicable)
  - Harmonisation du style avec celui des devis

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

- **Migration complète vers React PDF** :
  - Nouvelles routes de génération PDF : `/devis/{id}/generate-react-pdf` et `/factures/{id}/save-react-pdf`
  - Pages dédiées génération PDF : `devis/generate-pdf.tsx` et `factures/sync-pdf.tsx`
  - Système de sauvegarde double : local + Supabase Storage
  - Composant `PdfSaveButton` avec génération côté client et envoi en base64
  - Méthodes contrôleur `saveReactPdf()` pour devis et factures
  - Documentation complète de migration et d'utilisation

- **Commandes de test et synchronisation** :
  - Nouvelle commande `TestEmailFacture` pour tests d'envoi d'emails
  - Fonctionnalité de synchronisation PDF vers Supabase
  - Génération automatique des PDFs depuis les pages React

### Modifié
- **Structure PDF factures** :
  - Simplification du footer PDF avec informations essentielles
  - Suppression de la section "Objet de la facture" du PDF pour plus de clarté
  - Réorganisation des coordonnées bancaires dans le footer

- **Affichage des informations administrateur** :
  - Email de l'admin prioritaire sur l'email Madinia dans les contacts principaux
  - Fallback vers l'email Madinia si aucun administrateur assigné

- **Services PDF (dépréciation progressive)** :
  - `DevisPdfService::genererEtSauvegarder()` marquée DEPRECATED avec logs d'avertissement
  - `FacturePdfService::genererEtSauvegarder()` marquée DEPRECATED avec logs d'avertissement
  - Méthodes `regenererPdf()` redirigent maintenant vers les pages React PDF
  - Conservation des méthodes utilitaires pour compatibilité

### Supprimé
- **Suppression complète de DomPDF** :
  - Package `barryvdh/laravel-dompdf` et toutes ses dépendances désinstallées
  - Fichier de configuration `config/dompdf.php` supprimé
  - Templates Blade `resources/views/pdfs/devis.blade.php` et `facture.blade.php` supprimés
  - Imports DomPDF supprimés de tous les services
  - Méthodes `genererPdf()` supprimées des services PDF

### Corrigé
- **Erreurs de rendu PDF** : Correction du bug `toFixed is not a function` avec conversion explicite des types
- **Données PDF sécurisées** : Amélioration de `getSafeFactureData()` et `getSafeDevisData()` avec conversion Number() robuste
- **Interface TypeScript** : Ajout des propriétés manquantes dans l'interface Madinia et Facture
- **Compatibilité Laravel** : Maintien du démarrage propre après suppression DomPDF
- **Logs détaillés** : Ajout de logs pour le suivi des générations et sauvegardes PDF

### Technique
- **Nouveaux composants React** :
  - `FacturePdfPreview` : Composant PDF dédié aux factures
  - `PdfSaveButton` : Composant universel de génération et sauvegarde PDF
  - `TestRenderComparison` : Composant de test et comparaison des rendus
  - Modal d'aperçu PDF réutilisable avec contrôles utilisateur
  - Fonctions de sécurisation des données pour le rendu PDF

- **Architecture de sauvegarde robuste** :
  - Système de double sauvegarde : local (Laravel Storage) + cloud (Supabase)
  - Conversion base64 → binaire pour transfert PDF côté serveur
  - Gestion d'erreurs granulaire avec logs détaillés
  - URLs publiques Supabase pour accès externe aux PDFs

- **Optimisation des conversions de données** : Remplacement de parseFloat() par Number() pour plus de robustesse
- **Amélioration des composants PDF** : Meilleure gestion des données nulles/undefined
- **Code plus maintenable** : Structure UI/UX harmonisée avec classes Tailwind cohérentes
- **Documentation complète** : Guides de migration, utilisation et architecture
- **Tests et comparaisons** : Outils de validation des rendus PDF

### Résultats
- **Migration DomPDF → React PDF réussie à 100%** avec suppression complète des dépendances
- **Génération PDF côté client** : Performance améliorée et charge serveur réduite
- **Rendu identique** : PDFs générés identiques à l'aperçu web grâce à React
- **Double sauvegarde fiable** : Local + Supabase pour redondance maximale
- **Rétrocompatibilité préservée** : Anciens PDFs et URLs restent fonctionnels
- **Architecture moderne** : Composants React réutilisables et maintenables

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
