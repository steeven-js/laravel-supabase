# 🍞 Système de Toasts avec Sonner

## Installation et Configuration

### 1. Installation de Sonner
```bash
npm install sonner
```

### 2. Architecture mise en place

#### Composant `SessionToasts` 
Situé dans `resources/js/components/session-toasts.tsx`, ce composant gère automatiquement l'affichage des toasts basés sur les messages de session Laravel.

#### Partage des données flash avec Inertia
Dans `app/Http/Middleware/HandleInertiaRequests.php`, les messages flash sont partagés :
```php
'flash' => [
    'success' => $request->session()->get('success'),
    'error' => $request->session()->get('error'),
    'warning' => $request->session()->get('warning'),
    'info' => $request->session()->get('info'),
],
```

#### Intégration dans les layouts
Le système de toasts a été intégré dans tous les layouts principaux :
- `resources/js/layouts/app/app-sidebar-layout.tsx`
- `resources/js/layouts/app/app-header-layout.tsx`
- `resources/js/layouts/auth/auth-simple-layout.tsx`

## Utilisation

### 1. Toasts de session (automatiques)
Dans vos contrôleurs Laravel, utilisez les messages flash :

```php
// Succès
return redirect()->route('clients.index')
    ->with('success', '✅ Client créé avec succès !');

// Erreur
return redirect()->route('clients.index')
    ->with('error', '❌ Une erreur est survenue.');

// Avertissement
return redirect()->route('clients.index')
    ->with('warning', '⚠️ Attention, action sensible effectuée.');

// Information
return redirect()->route('clients.index')
    ->with('info', 'ℹ️ Information importante.');
```

### 2. Toasts manuels (dans le frontend)
Dans vos composants React, importez et utilisez `toast` de Sonner :

```tsx
import { toast } from 'sonner';

// Toast de succès
toast.success('🎉 Opération réussie !', {
    description: 'Description optionnelle',
    duration: 4000,
});

// Toast d'erreur
toast.error('❌ Erreur détectée !', {
    description: 'Détails de l\'erreur',
    duration: 5000,
});

// Toast avec promesse
const promise = fetch('/api/data');
toast.promise(promise, {
    loading: '⏳ Chargement...',
    success: '✅ Données chargées !',
    error: '❌ Échec du chargement',
});
```

## Configuration Sonner

Le Toaster est configuré avec les options suivantes :
- Position : `top-right`
- Couleurs riches : `richColors={true}`
- Expansion : `expand={true}`
- Bouton de fermeture : `closeButton={true}`

## Exemple d'implémentation - ClientController

Le `ClientController` a été amélioré pour utiliser différents types de messages :

```php
public function update(Request $request, Client $client)
{
    try {
        // Logique de validation et mise à jour...
        
        if ($hasChanges) {
            return redirect()->route('clients.index')
                ->with('success', '🎉 Client mis à jour avec succès !');
        } else {
            return redirect()->route('clients.index')
                ->with('info', 'ℹ️ Aucune modification détectée');
        }
    } catch (ValidationException $e) {
        return back()
            ->with('error', '❌ Erreur de validation.');
    }
}
```

## Démonstration

Un composant `ToastDemo` a été ajouté au dashboard (`/dashboard`) pour tester facilement tous les types de toasts.

## Personnalisation

Pour personnaliser l'apparence ou le comportement des toasts, modifiez :
1. Le composant `SessionToasts` pour les toasts de session
2. Les paramètres du `Toaster` dans les layouts
3. Les options par défaut lors des appels `toast.*()` manuels

## Avantages de cette implémentation

✅ **Intégration native** avec les sessions Laravel  
✅ **Toasts automatiques** pour toutes les actions CRUD  
✅ **Toasts manuels** pour les actions frontend  
✅ **Types multiples** : success, error, warning, info, promise  
✅ **Interface moderne** et accessible  
✅ **Configuration centralisée** dans les layouts  

## Tests

1. Naviguez vers `/dashboard` pour tester les toasts manuels
2. Modifiez un client pour voir les toasts de session automatiques
3. Testez les différents scénarios (succès, erreur, aucune modification) 
