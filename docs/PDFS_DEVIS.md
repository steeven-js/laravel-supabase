# 📄 Système de génération de PDFs pour les devis

## Vue d'ensemble

Le système de génération de PDFs pour les devis offre une **double sauvegarde** :
- **Sauvegarde locale** : dans `storage/app/public/pdfs/devis/`
- **Sauvegarde Supabase** : dans le bucket Storage de Supabase

## Fonctionnalités

### ✅ Génération automatique
- **Création d'un devis** : PDF généré automatiquement
- **Modification d'un devis** : PDF mis à jour automatiquement
- **Suppression d'un devis** : PDF supprimé des deux emplacements

### ✅ Envoi par email
- PDF inclus en **pièce jointe**
- Lien vers le PDF Supabase dans l'email
- URL publique directe

### ✅ Accès aux PDFs
- **Voir en ligne** : `/devis/{id}/pdf`
- **Télécharger** : `/devis/{id}/telecharger-pdf`
- **Régénérer** : `/devis/{id}/regenerer-pdf` (POST)

## Architecture technique

### Service `DevisPdfService`
Classe principale qui gère :
- Génération via DomPDF
- Sauvegarde locale (Laravel Storage)
- Sauvegarde Supabase (API REST)
- Suppression coordonnée

### Méthodes principales
```php
// Générer et sauvegarder (double sauvegarde)
$nomFichier = $pdfService->genererEtSauvegarder($devis);

// Mettre à jour un PDF existant
$nomFichier = $pdfService->mettreAJour($devis);

// Supprimer un PDF (local + Supabase)
$success = $pdfService->supprimer($devis);

// Obtenir les URLs
$urlLocal = $pdfService->getUrlPdf($devis);
$urlSupabase = $pdfService->getUrlSupabasePdf($devis);
```

### Template PDF
- Fichier : `resources/views/pdfs/devis.blade.php`
- Design professionnel avec CSS intégré
- Format A4 portrait
- Informations complètes du devis

## Configuration Supabase

Le système utilise la configuration existante de votre base de données :
- **URL du projet** : extraite de `DB_HOST`
- **Clé d'authentification** : utilise `DB_PASSWORD` (service key)
- **Bucket** : `pdfs` (créé automatiquement)

### Structure dans Supabase Storage
```
pdfs/
└── devis/
    ├── devis_DEV-2025-01-001_1.pdf
    ├── devis_DEV-2025-01-002_2.pdf
    └── ...
```

## Commandes Artisan

### Générer tous les PDFs
```bash
# Générer les PDFs manquants
php artisan devis:generate-pdfs

# Forcer la régénération de tous les PDFs
php artisan devis:generate-pdfs --force
```

## Email avec PDFs

### Pièce jointe automatique
- PDF attaché automatiquement à l'email
- Nom du fichier : `Devis_NUMERO.pdf`

### Liens dans l'email
- Lien vers le PDF Supabase (public)
- Bouton de téléchargement direct

### Template email
Fichier : `resources/views/emails/devis/client.blade.php`
- Inclut les URLs des PDFs
- Design responsive
- Informations complètes du devis

## Gestion des erreurs

### Logs automatiques
Tous les événements sont loggés :
- Génération réussie
- Erreurs de sauvegarde
- Problèmes de configuration

### Récupération automatique
- PDF régénéré automatiquement si manquant
- Sauvegarde de secours sur Supabase
- Messages d'erreur explicites

## Avantages de la double sauvegarde

### ✅ Sécurité
- Redondance des données
- Pas de perte en cas de problème local

### ✅ Performance
- Accès local rapide pour l'application
- CDN Supabase pour les liens publics

### ✅ Accessibilité
- Liens publics permanents
- Partage facile via email

## Maintenance

### Vérifier l'espace de stockage
```bash
# Taille du dossier local
du -sh storage/app/public/pdfs/

# Nombre de fichiers
ls storage/app/public/pdfs/devis/ | wc -l
```

### Nettoyage si nécessaire
```bash
# Supprimer les PDFs orphelins (sans devis associé)
php artisan devis:clean-orphan-pdfs
```

## Dépendances

- `barryvdh/laravel-dompdf` : Génération PDF
- `illuminate/http` : Client HTTP pour Supabase
- Configuration Supabase existante

## Sécurité

### Accès aux PDFs
- Routes protégées par authentification
- Validation des permissions par devis
- URLs Supabase publiques (avec obscurité par nom de fichier)

### Données sensibles
- PDFs stockés hors de `public/`
- Accès contrôlé via routes Laravel
- Logging des accès et modifications 
