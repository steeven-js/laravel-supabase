# 📄 Système de Sauvegarde PDF React

Ce système permet de générer des PDFs avec `react-pdf/renderer` côté client et de les sauvegarder sur le serveur Laravel + Supabase Storage.

## 🚀 Architecture

### Frontend (React)
- **Génération** : `react-pdf/renderer` génère le PDF côté client
- **Conversion** : Le PDF est converti en base64
- **Envoi** : Le PDF est envoyé vers Laravel via Inertia

### Backend (Laravel)
- **Réception** : Le PDF base64 est reçu via une route POST
- **Décodage** : Conversion du base64 vers un fichier binaire
- **Sauvegarde locale** : Stockage dans `storage/app/public/pdfs/`
- **Sauvegarde Supabase** : Upload vers le bucket `pdfs`
- **Base de données** : Mise à jour des URLs

## 📋 Utilisation

### 1. Dans votre composant React

```tsx
import React from 'react';
import PdfSaveButton from '@/components/pdf/PdfSaveButton';
import { DevisPdfPreview } from '@/components/pdf/DevisPdfPreview';

export function MonComposant({ devis, madinia }) {
    return (
        <div>
            <PdfSaveButton
                pdfComponent={<DevisPdfPreview devis={devis} madinia={madinia} />}
                saveRoute={route('devis.save-react-pdf', devis.id)}
                filename={`devis_${devis.numero_devis}.pdf`}
                type="devis"
            >
                Sauvegarder PDF
            </PdfSaveButton>
        </div>
    );
}
```

### 2. Routes disponibles

#### Pour les devis :
```php
POST /devis/{devis}/save-react-pdf
```

#### Pour les factures :
```php
POST /factures/{facture}/save-react-pdf
```

### 3. Paramètres envoyés

```javascript
{
    pdf_blob: "base64_string_du_pdf",
    filename: "nom_du_fichier.pdf",
    type: "devis" // ou "facture"
}
```

## 🔧 Configuration

### Variables d'environnement requises

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
SUPABASE_STORAGE_BUCKET=pdfs
```

### Structure des dossiers

```
storage/app/public/pdfs/
├── devis/
│   ├── devis_DV-25-001_1.pdf
│   └── devis_DV-25-002_2.pdf
└── factures/
    ├── facture_FACT-2025-0001_1.pdf
    └── facture_FACT-2025-0002_2.pdf
```

### Bucket Supabase

```
bucket: pdfs/
├── devis/
│   ├── devis_DV-25-001_1.pdf
│   └── devis_DV-25-002_2.pdf
└── factures/
    ├── facture_FACT-2025-0001_1.pdf
    └── facture_FACT-2025-0002_2.pdf
```

## ⚡ Fonctionnalités

### PdfSaveButton

Le composant `PdfSaveButton` offre deux actions :

1. **Sauvegarder** : Génère le PDF et l'envoie au serveur
2. **Télécharger** : Génère le PDF et le télécharge directement

### États de chargement

- **Génération...** : Le PDF est en cours de génération
- **Sauvegarde...** : Le PDF est en cours d'envoi vers le serveur

### Gestion d'erreurs

- Validation côté serveur du blob PDF
- Logs détaillés pour le debugging
- Messages d'erreur utilisateur via les notifications Inertia

## 🔄 Avantages vs DomPDF

| Aspect | DomPDF | React PDF |
|--------|--------|-----------|
| **Rendu** | Serveur | Client |
| **Performance** | Charge le serveur | Charge le client |
| **Consistance** | Dépend du serveur | Identique à l'aperçu |
| **Flexibilité** | Limitée par HTML/CSS | Composants React |
| **Temps réel** | Régénération requise | Aperçu instantané |

## 🛠️ Développement

### Ajouter un nouveau type de PDF

1. **Créer le composant PDF** :
```tsx
// resources/js/components/pdf/MonNouveauPdf.tsx
export function MonNouveauPdf({ data }) {
    return (
        <Document>
            <Page>
                <Text>Mon contenu</Text>
            </Page>
        </Document>
    );
}
```

2. **Ajouter la route** :
```php
// routes/web.php
Route::post('mon-type/{id}/save-react-pdf', [MonController::class, 'saveReactPdf'])
    ->name('mon-type.save-react-pdf');
```

3. **Ajouter la méthode dans le contrôleur** :
```php
// app/Http/Controllers/MonController.php
public function saveReactPdf(Request $request, MonModel $model)
{
    // Utiliser la même logique que les autres contrôleurs
}
```

### Debugging

Pour déboguer le système, vérifiez :

1. **Logs Laravel** : `storage/logs/laravel.log`
2. **Console navigateur** : Erreurs JavaScript
3. **Network tab** : Requêtes Inertia
4. **Supabase Storage** : Interface web

## 🎯 Exemples complets

### Composant avec aperçu

```tsx
import { PdfPreviewWithSave } from '@/components/pdf/PdfExample';

export function MaPage({ devis, madinia }) {
    return (
        <div>
            <PdfPreviewWithSave 
                type="devis"
                data={devis}
                madinia={madinia}
            />
        </div>
    );
}
```

### Bouton simple

```tsx
import PdfSaveButton from '@/components/pdf/PdfSaveButton';
import { DevisPdfPreview } from '@/components/pdf/DevisPdfPreview';

export function BoutonSimple({ devis, madinia }) {
    return (
        <PdfSaveButton
            pdfComponent={<DevisPdfPreview devis={devis} madinia={madinia} />}
            saveRoute={route('devis.save-react-pdf', devis.id)}
            filename={`devis_${devis.numero_devis}.pdf`}
            type="devis"
        />
    );
}
```

## 🔐 Sécurité

- Validation des données côté serveur
- Limitation de la taille des fichiers PDF
- Authentification requise pour toutes les routes
- Logs de toutes les opérations

## 📈 Performance

- Génération côté client = moins de charge serveur
- Cache des PDFs sur Supabase
- URLs publiques pour un accès rapide
- Compression automatique des PDFs

Ce système remplace complètement DomPDF tout en conservant la compatibilité avec votre architecture Laravel + Inertia + React existante. 
