# Système de Profil Étendu

## Vue d'ensemble

Le système de profil a été étendu pour inclure des informations additionnelles sur l'utilisateur telles que le téléphone, l'adresse, la ville, le code postal, le pays et un avatar.

## Architecture

### Base de données

Les champs additionnels ont été ajoutés directement à la table `users` existante :

```sql
- telephone (nullable)
- ville (nullable) 
- adresse (nullable)
- code_postal (nullable)
- pays (nullable)
- avatar (nullable) - Stocke le chemin vers l'image d'avatar
```

### Modèle User

Le modèle `User` a été étendu avec :

**Champs fillable :**
- telephone, ville, adresse, code_postal, pays, avatar

**Accesseurs :**
- `getInitialsAttribute()` : Génère les initiales de l'utilisateur pour l'avatar de fallback
- `getFullAddressAttribute()` : Concatène tous les champs d'adresse en une chaîne
- `getAvatarUrlAttribute()` : Retourne l'URL complète de l'avatar

### Contrôleur

Le contrôleur `Settings\ProfileController` a été étendu avec :

**Méthodes existantes modifiées :**
- `edit()` : Passe maintenant l'utilisateur complet à la vue
- `update()` : Gère maintenant tous les champs de profil

**Nouvelles méthodes :**
- `updateAvatar()` : Gère l'upload d'avatar avec suppression de l'ancien
- `deleteAvatar()` : Supprime l'avatar de l'utilisateur

### Validation

La `ProfileUpdateRequest` a été étendue pour valider :
- telephone (nullable, string, max:255)
- ville (nullable, string, max:255)
- adresse (nullable, string, max:500)
- code_postal (nullable, string, max:10)
- pays (nullable, string, max:255)

### Interface utilisateur

La page `resources/js/pages/settings/profile.tsx` inclut maintenant :

**Section Avatar :**
- Affichage de l'avatar avec fallback sur les initiales
- Upload d'avatar avec prévisualisation
- Suppression d'avatar

**Section Profil étendu :**
- Champs nom et email (existants)
- Téléphone
- Adresse complète (textarea)
- Ville et code postal (en ligne)
- Pays

## Routes

```php
// Profil utilisateur
Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

// Gestion des avatars
Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar'])->name('profile.avatar.delete');
```

## Fonctions Supabase

### update_user_profile()

Fonction pour mettre à jour les champs de profil dans Supabase :

```sql
SELECT public.update_user_profile(
  p_user_id := 'uuid-here',
  p_telephone := '+33 1 23 45 67 89',
  p_ville := 'Paris',
  p_adresse := '123 Rue Example',
  p_code_postal := '75001',
  p_pays := 'France',
  p_avatar := 'avatars/filename.jpg'
);
```

### get_user_profile()

Fonction pour récupérer un profil utilisateur complet :

```sql
SELECT public.get_user_profile('uuid-here');
```

## Gestion des fichiers

Les avatars sont stockés dans `storage/app/public/avatars/` et sont accessibles via l'URL `/storage/avatars/filename.jpg`.

**Configuration requise :**
```bash
php artisan storage:link
```

## Synchronisation avec Supabase

Lors de l'inscription d'un utilisateur via Supabase :

1. L'utilisateur est créé dans `auth.users`
2. Les champs de profil étendu sont initialement vides
3. L'utilisateur peut les remplir via la page de profil
4. Les données sont synchronisées avec les métadonnées utilisateur Supabase

## Sécurité

- Validation côté serveur de tous les champs
- Upload d'avatar limité à 2MB et formats image uniquement
- Suppression automatique des anciens avatars lors du remplacement
- Authentification requise pour toutes les opérations de profil

## Migration

La migration `2025_06_12_050519_add_profile_fields_to_users_table` ajoute les nouveaux champs à la table users existante sans affecter les données existantes. 
