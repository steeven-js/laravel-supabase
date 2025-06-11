# 📄 Commandes de Gestion des PDFs

Ce document présente toutes les commandes disponibles pour gérer les PDFs de devis et factures dans l'application.

## 🎯 Commandes Principales

### 📋 Devis

#### Génération des PDFs de devis
```bash
php artisan devis:generate-pdfs [options]
```

**Options disponibles :**
- `--force` : Régénérer les PDFs même s'ils existent déjà
- `--sync-supabase` : Synchroniser tous les PDFs existants vers Supabase Storage
- `--only-supabase` : Uniquement synchroniser vers Supabase sans générer de nouveaux PDFs

**Exemples :**
```bash
# Générer tous les PDFs manquants
php artisan devis:generate-pdfs

# Régénérer tous les PDFs
php artisan devis:generate-pdfs --force

# Générer les PDFs manquants ET synchroniser vers Supabase
php artisan devis:generate-pdfs --sync-supabase

# Uniquement synchroniser les PDFs existants vers Supabase
php artisan devis:generate-pdfs --only-supabase
```

---

### 🧾 Factures

#### Génération des PDFs de factures
```bash
php artisan factures:generate-pdfs [options]
```

**Options disponibles :**
- `--force` : Régénérer les PDFs même s'ils existent déjà
- `--sync-supabase` : Synchroniser tous les PDFs existants vers Supabase Storage
- `--only-supabase` : Uniquement synchroniser vers Supabase sans générer de nouveaux PDFs

**Exemples :**
```bash
# Générer tous les PDFs manquants
php artisan factures:generate-pdfs

# Régénérer tous les PDFs
php artisan factures:generate-pdfs --force

# Générer les PDFs manquants ET synchroniser vers Supabase
php artisan factures:generate-pdfs --sync-supabase

# Uniquement synchroniser les PDFs existants vers Supabase
php artisan factures:generate-pdfs --only-supabase
```

---

### 🌐 Synchronisation Globale

#### Synchroniser tous les PDFs vers Supabase
```bash
php artisan pdfs:sync-supabase [options]
```

**Options disponibles :**
- `--force` : Forcer la synchronisation même si les fichiers existent déjà
- `--generate` : Générer les PDFs manquants avant la synchronisation

**Exemples :**
```bash
# Synchroniser tous les PDFs existants vers Supabase
php artisan pdfs:sync-supabase

# Générer les PDFs manquants puis synchroniser
php artisan pdfs:sync-supabase --generate

# Forcer la synchronisation même si les fichiers existent
php artisan pdfs:sync-supabase --force
```

---

## 📂 Structure de Stockage

### Stockage Local
```
storage/app/public/pdfs/
├── devis/
│   ├── devis_DEV-2025-0001_1.pdf
│   ├── devis_DEV-2025-0002_2.pdf
│   └── ...
└── factures/
    ├── facture_FACT-2025-0001_1.pdf
    ├── facture_FACT-2025-0002_2.pdf
    └── ...
```

### Stockage Supabase
```
bucket: pdfs/
├── devis/
│   ├── devis_DEV-2025-0001_1.pdf
│   ├── devis_DEV-2025-0002_2.pdf
│   └── ...
└── factures/
    ├── facture_FACT-2025-0001_1.pdf
    ├── facture_FACT-2025-0002_2.pdf
    └── ...
```

---

## 🔄 Flux de Travail Recommandé

### 1. Configuration Initiale
Après avoir créé le bucket `pdfs` sur Supabase :
```bash
# Générer tous les PDFs manquants et les synchroniser
php artisan pdfs:sync-supabase --generate
```

### 2. Maintenance Régulière
Pour synchroniser les nouveaux PDFs :
```bash
# Synchroniser uniquement les nouveaux PDFs
php artisan pdfs:sync-supabase
```

### 3. Régénération Complète
En cas de mise à jour du template PDF :
```bash
# Régénérer tous les PDFs et les synchroniser
php artisan devis:generate-pdfs --force --sync-supabase
php artisan factures:generate-pdfs --force --sync-supabase
```

---

## ⚙️ Configuration Supabase

Assurez-vous d'avoir configuré le bucket `pdfs` sur Supabase Storage :

1. **Nom du bucket :** `pdfs`
2. **Public :** `true` (pour l'accès public aux PDFs)
3. **Politique d'accès :** Lecture publique autorisée

Les sous-dossiers `devis/` et `factures/` seront créés automatiquement lors de la première synchronisation.

---

## 🚨 Messages d'Erreur Courants

### "PDF local introuvable"
- **Cause :** Le fichier PDF n'existe pas en local
- **Solution :** Générer d'abord le PDF avec `--generate` ou sans `--only-supabase`

### "Erreur synchronisation PDF vers Supabase"
- **Cause :** Problème de configuration Supabase ou de réseau
- **Solution :** Vérifier la configuration du bucket et les permissions

### "Configuration Supabase manquante"
- **Cause :** Variables d'environnement Supabase mal configurées
- **Solution :** Vérifier les variables dans `.env`

---

## 📊 Interprétation des Résultats

### Génération de PDFs
- **✅ Succès :** PDF généré avec succès
- **❌ Erreurs :** Erreur lors de la génération (vérifier les logs)
- **📊 Total :** Nombre total de documents traités

### Synchronisation Supabase
- **📤 Synchronisés :** Nouveaux fichiers envoyés vers Supabase
- **✅ Déjà sur Supabase :** Fichiers déjà présents (non synchronisés)
- **❌ Erreurs :** Erreurs de synchronisation
- **📊 Total :** Nombre total de documents traités

Ces commandes permettent une gestion complète et flexible des PDFs dans votre application Laravel avec Supabase ! 🎉 
