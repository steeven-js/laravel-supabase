# 🏷️ Système de codes de services

## Vue d'ensemble

Le système de génération de codes de services utilise un **format standardisé automatique** pour identifier de manière unique chaque service.

## Format des codes

### Structure : `SRV-25-001`

- **SRV** : Préfixe fixe pour "Service"
- **25** : Année en cours sur 2 digits (2025 → 25)
- **001** : ID du service sur 3 digits avec zéros devant

### Exemples
```
SRV-25-001 → Service ID 1 créé en 2025
SRV-25-002 → Service ID 2 créé en 2025
SRV-25-010 → Service ID 10 créé en 2025
SRV-25-150 → Service ID 150 créé en 2025
```

## Génération automatique

### ✅ Nouveaux services
- **Code généré automatiquement** lors de la création
- **Pas besoin de saisir manuellement** le code
- **Format garanti uniforme** pour tous les services

### ✅ Services existants
- **Commande de mise à jour** disponible
- **Préservation de l'ID** original du service
- **Migration sécurisée** avec vérification des conflits

## Commandes disponibles

### Mettre à jour les codes existants

```bash
# Simulation (voir les changements sans les appliquer)
php artisan services:update-codes --dry-run

# Appliquer les changements
php artisan services:update-codes
```

### Vérifier les services
```bash
# Lister tous les services avec leurs codes
php artisan check:services
```

## Avantages du nouveau système

### 🎯 **Standardisation**
- Format uniforme pour tous les services
- Identification visuelle immédiate (SRV)
- Cohérence avec les autres entités du système

### 📅 **Traçabilité temporelle**
- Année de création visible dans le code
- Facilite les audits et rapports annuels
- Permet le suivi historique

### 🔢 **Ordre logique**
- Codes séquentiels basés sur l'ID
- Tri naturel dans les listes
- Pas de conflit possible

### 🚀 **Automatisation**
- Génération automatique = zéro erreur
- Pas de saisie manuelle requise
- Intégration transparente

## Intégration technique

### Modèle Service
```php
// Génération automatique dans le boot()
static::created(function ($service) {
    $annee = date('y');
    $id = str_pad($service->id, 3, '0', STR_PAD_LEFT);
    $nouveauCode = "SRV-{$annee}-{$id}";
    
    if ($service->code !== $nouveauCode) {
        $service->update(['code' => $nouveauCode]);
    }
});
```

### Création de service
```php
// Pas besoin de code dans la validation
$validated = $request->validate([
    'nom' => 'required|string|max:255',
    'code' => 'nullable|string|max:50|unique:services,code', // Nullable !
    // ... autres champs
]);
```

### Interface utilisateur
- **Champ code masqué** dans le formulaire de création
- **Message informatif** sur la génération automatique
- **Affichage du code** uniquement après création

## Migration des données

### Avant la migration
```
SRV-25-0001, FORPARSE, SOLAUTFI, etc.
```

### Après la migration
```
SRV-25-001, SRV-25-002, SRV-25-003, etc.
```

### Sécurité
- ✅ **Vérification des conflits** avant mise à jour
- ✅ **Mode simulation** pour tester les changements
- ✅ **Préservation de l'ID** original
- ✅ **Logs détaillés** de chaque modification

## Utilisation en développement

### Créer un nouveau service
```typescript
// L'interface n'affiche plus le champ code
const serviceData = {
    nom: "Nouvelle prestation",
    description: "Description du service",
    prix_ht: 1500.00,
    qte_defaut: 1,
    actif: true
    // code sera généré automatiquement
};
```

### Affichage des codes
```typescript
// Les codes apparaissent dans les listes
<code className="font-mono">{service.code}</code> // SRV-25-001
```

## Évolution future

### Flexibilité
- **Format adaptable** si besoins changent
- **Migration possible** vers d'autres formats
- **Commandes de maintenance** disponibles

### Extensions possibles
- Codes par catégorie : `SRV-DEV-25-001`, `SRV-FORM-25-001`
- Préfixes personnalisés par client
- Intégration avec système de facturation externe

## Dépannage

### Problèmes courants

**Code dupliqué** 
```bash
# Vérifier les doublons
SELECT code, COUNT(*) FROM services GROUP BY code HAVING COUNT(*) > 1;
```

**Service sans code**
```bash
# Régénérer les codes manquants
php artisan services:update-codes
```

**Format incorrect**
```bash
# Mettre à jour tous les codes
php artisan services:update-codes --dry-run
```

## Conclusion

Le nouveau système de codes SRV-25-XXX offre :
- 🎯 **Standardisation** complète
- 🚀 **Automatisation** totale
- 📊 **Traçabilité** améliorée
- 🔧 **Maintenance** simplifiée

**Aucune action manuelle requise** pour les nouveaux services ! 🎉 
