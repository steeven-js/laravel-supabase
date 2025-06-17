# Système de Design - Madinia Dashboard

Ce document présente le système de design complet centralisé dans `app.css` pour remplacer toutes les classes Tailwind hardcodées.

## 🎯 Objectifs

- **Cohérence** : Un seul endroit pour tous les styles
- **Maintenabilité** : Modifications centralisées
- **Réutilisabilité** : Classes sémantiques partout
- **Accessibilité** : Support dark/light automatique

## 📝 Typographie

### Tailles de texte
```css
.text-display    /* text-4xl font-bold tracking-tight */
.text-headline   /* text-3xl font-bold tracking-tight */
.text-title      /* text-2xl font-semibold tracking-tight */
.text-subtitle   /* text-xl font-semibold */
.text-body-lg    /* text-lg */
.text-body       /* text-base */
.text-body-sm    /* text-sm */
.text-caption    /* text-xs */
```

### Couleurs de texte
```css
.text-muted      /* text-muted-foreground */
.text-accent     /* text-accent-foreground */
.text-success    /* text-green-600 dark:text-green-400 */
.text-warning    /* text-orange-600 dark:text-orange-400 */
.text-error      /* text-red-600 dark:text-red-400 */
.text-info       /* text-blue-600 dark:text-blue-400 */
```

**Usage :**
```tsx
<h1 className="text-headline">Titre principal</h1>
<p className="text-body text-muted">Description</p>
```

## 📏 Espacements

### Système unifié
```css
.p-xs    .p-sm    .p-md    .p-lg    .p-xl     /* Padding */
.m-xs    .m-sm    .m-md    .m-lg    .m-xl     /* Margin */
.gap-xs  .gap-sm  .gap-md  .gap-lg  .gap-xl   /* Gap */
```

**Échelle :** xs=1, sm=2, md=4, lg=6, xl=8

**Usage :**
```tsx
<div className="p-md gap-sm">
  <div className="m-lg">Contenu</div>
</div>
```

## 🔧 Layout et Flex

### Flex helpers
```css
.flex-center         /* flex items-center justify-center */
.flex-between        /* flex items-center justify-between */
.flex-start          /* flex items-center justify-start */
.flex-end            /* flex items-center justify-end */
.flex-col-center     /* flex flex-col items-center justify-center */
.flex-col-start      /* flex flex-col items-start */
.flex-wrap-center    /* flex flex-wrap items-center gap-sm */
```

### Grilles responsives
```css
.grid-auto          /* grid grid-cols-1 gap-md */
.grid-2-cols        /* grid grid-cols-1 md:grid-cols-2 gap-md */
.grid-3-cols        /* grid grid-cols-1 md:grid-cols-3 gap-md */
.grid-4-cols        /* grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md */
.grid-responsive    /* grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md */
```

**Usage :**
```tsx
<div className="grid-3-cols">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>
```

## 🔘 Boutons

### Tailles
```css
.btn-xs    /* px-2 py-1 text-xs */
.btn-sm    /* px-3 py-1.5 text-sm */
.btn-md    /* px-4 py-2 text-sm */
.btn-lg    /* px-6 py-3 text-base */
```

### Variantes
```css
.btn-primary      /* bg-primary text-primary-foreground */
.btn-secondary    /* bg-secondary text-secondary-foreground */
.btn-outline      /* border hover:bg-accent */
.btn-ghost        /* hover:bg-accent */
.btn-destructive  /* bg-destructive text-destructive-foreground */
.btn-success      /* bg-green-600 text-white */
.btn-warning      /* bg-orange-600 text-white */
.btn-info         /* bg-blue-600 text-white */
```

### Avec icônes
```css
.btn-icon         /* inline-flex items-center gap-2 */
.btn-icon-only    /* flex items-center justify-center aspect-square */
```

**Usage :**
```tsx
<Button className="btn-md btn-primary btn-icon">
  <Save className="h-4 w-4" />
  Sauvegarder
</Button>
```

## 🃏 Cartes

### Variantes
```css
.card-elevated     /* shadow-lg border-0 */
.card-flat         /* shadow-none border */
.card-interactive  /* hover:shadow-md hover:scale-[1.02] cursor-pointer */
.card-bordered     /* border-2 */
```

### États colorés
```css
.card-success      /* border-green-200 bg-green-50 */
.card-warning      /* border-orange-200 bg-orange-50 */
.card-error        /* border-red-200 bg-red-50 */
.card-info         /* border-blue-200 bg-blue-50 */
```

**Usage :**
```tsx
<Card className="card-elevated">
  <CardHeader className="card-header">
    <CardTitle>Titre</CardTitle>
  </CardHeader>
  <CardContent className="card-content">
    Contenu
  </CardContent>
</Card>
```

## 📝 Formulaires

### Structure
```css
.form-group           /* space-y-2 */
.form-section         /* space-y-md */
.form-grid           /* grid-2-cols */
.form-row            /* flex flex-col sm:flex-row sm:items-center gap-md */
.form-actions        /* flex items-center gap-sm */
.form-actions-end    /* flex items-center justify-end gap-sm */
.form-actions-between /* flex items-center justify-between gap-sm */
```

### Labels
```css
.label-base          /* text-sm font-medium */
.label-required      /* label-base + étoile rouge */
.label-with-icon     /* label-base flex items-center gap-2 */
```

### Inputs
```css
.input-base          /* hauteur, border, padding de base */
.input-focus         /* focus-visible styles */
.input-error         /* border-destructive */
.input-success       /* border-green-500 */
.input-disabled      /* opacity-50 cursor-not-allowed */
```

### Inputs avec icônes
```css
.input-with-icon     /* relative container */
.input-icon-left     /* position absolue icône gauche */
.input-icon-right    /* position absolue icône droite */
.input-with-left-icon  /* padding-left pour l'icône */
.input-with-right-icon /* padding-right pour l'icône */
```

**Usage :**
```tsx
<div className="form-group">
  <Label className="label-required">Email</Label>
  <div className="input-with-icon">
    <Mail className="input-icon-left" />
    <Input 
      type="email" 
      className="input-with-left-icon" 
      placeholder="email@example.com" 
    />
  </div>
  {error && <p className="error-message">{error}</p>}
</div>
```

## 🏷️ Badges

### Variantes
```css
.badge-base          /* base styles */
.badge-primary       /* bg-primary text-primary-foreground */
.badge-secondary     /* bg-secondary text-secondary-foreground */
.badge-success       /* vert */
.badge-warning       /* orange */
.badge-error         /* rouge */
.badge-info          /* bleu */
.badge-neutral       /* gris */
.badge-outline       /* transparent avec bordure */
```

**Usage :**
```tsx
<Badge className="badge-success">Actif</Badge>
<Badge className="badge-warning">En attente</Badge>
```

## 📊 Tableaux

```css
.table-container     /* overflow-x-auto */
.table-base          /* w-full caption-bottom text-sm */
.table-header        /* border-b */
.table-header-cell   /* h-12 px-4 text-left font-medium */
.table-row           /* border-b hover:bg-muted/50 */
.table-cell          /* p-4 align-middle */
.table-actions       /* opacity-0 group-hover:opacity-100 */
```

## 🎨 Pages spécialisées

### Structure de page
```css
.page-container      /* flex h-full flex-1 flex-col gap-lg p-md */
.page-header         /* relative avec gradient */
.page-header-card    /* relative border-0 shadow-sm */
```

### Titres avec icônes
```css
.page-title          /* text-headline */
.page-title-icon     /* h-8 w-8 text-primary */
.section-title       /* title-with-icon text-title */
.section-icon        /* h-5 w-5 text-muted-foreground */
.title-with-icon     /* flex items-center gap-sm */
```

### Cartes d'information
```css
.info-card           /* flex items-center gap-sm p-sm hover:bg-muted/50 */
.info-icon-email     /* h-5 w-5 text-blue-600 */
.info-icon-phone     /* h-5 w-5 text-green-600 */
.info-icon-web       /* h-5 w-5 text-purple-600 */
.info-icon-location  /* h-5 w-5 text-orange-600 */
.info-icon-document  /* h-5 w-5 text-indigo-600 */
```

**Usage :**
```tsx
<div className="page-container">
  <div className="page-header">
    <Card className="page-header-card">
      <CardContent className="p-lg">
        <h1 className="page-title">
          <Building2 className="page-title-icon" />
          Mon titre
        </h1>
      </CardContent>
    </Card>
  </div>
  
  <Card>
    <CardHeader>
      <CardTitle className="section-title">
        <User className="section-icon" />
        Informations client
      </CardTitle>
    </CardHeader>
    <CardContent className="grid-2-cols">
      <div className="info-card">
        <Mail className="info-icon-email" />
        <div>
          <p className="text-body-sm font-medium">Email</p>
          <p className="text-caption text-muted">contact@example.com</p>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
```

## 🔄 États et Interactions

### Chargement
```css
.skeleton           /* animate-pulse bg-muted */
.skeleton-text      /* skeleton h-4 w-full */
.skeleton-avatar    /* skeleton h-10 w-10 rounded-full */
.skeleton-button    /* skeleton h-10 w-24 */
.loading-spinner    /* animate-spin h-4 w-4 */
```

### Transitions
```css
.transition-smooth  /* transition-all duration-200 */
.transition-fast    /* transition-all duration-100 */
.transition-slow    /* transition-all duration-300 */
.hover-lift         /* hover:scale-105 */
.hover-shadow       /* hover:shadow-lg */
```

### Focus et accessibilité
```css
.focus-ring         /* focus-visible:ring-2 */
.focus-within-ring  /* focus-within:ring-2 */
```

## 🗂️ Navigation et Tabs

### Tabs
```css
.tabs-list          /* flex space-x-1 bg-muted p-1 rounded-lg */
.tab-trigger        /* px-md py-sm text-body-sm font-medium */
.tab-trigger-active /* tab-trigger bg-background shadow-sm */
.tab-trigger-inactive /* tab-trigger text-muted hover:bg-background/50 */
```

### Breadcrumbs
```css
.breadcrumb         /* flex items-center space-x-1 text-sm */
.breadcrumb-item    /* hover:text-foreground transition-colors */
.breadcrumb-separator /* mx-2 */
```

## 📱 Responsive

### Utilitaires
```css
.hide-mobile        /* hidden sm:block */
.hide-desktop       /* block sm:hidden */
.mobile-only        /* sm:hidden */
.desktop-only       /* hidden sm:block */
```

### Responsive automatique
```css
.responsive-text    /* text-body-sm sm:text-body md:text-body-lg */
.responsive-padding /* p-sm sm:p-md lg:p-lg */
.responsive-margin  /* m-sm sm:m-md lg:m-lg */
.responsive-gap     /* gap-sm sm:gap-md lg:gap-lg */
```

## 🎯 Bonnes pratiques

### 1. Utilisez les classes sémantiques
```tsx
// ❌ Avant
<div className="flex items-center justify-between gap-4 p-6">

// ✅ Après  
<div className="flex-between gap-md p-lg">
```

### 2. Combinez les classes
```tsx
// ✅ Structure + Style + État
<Button className="btn-md btn-primary btn-icon">
  <Save className="h-4 w-4" />
  Sauvegarder
</Button>
```

### 3. Utilisez les grilles responsive
```tsx
// ❌ Avant
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

// ✅ Après
<div className="grid-3-cols">
```

### 4. Espacements cohérents
```tsx
// ✅ Utilisez l'échelle
<div className="p-md gap-sm">      <!-- md=16px, sm=8px -->
<div className="m-lg gap-md">      <!-- lg=24px, md=16px -->
```

## 🔧 Migration d'une page existante

### Étapes :
1. **Container principal** : `page-container`
2. **En-tête** : `page-header` + `page-header-card`
3. **Titres** : `page-title`, `section-title`
4. **Grilles** : `grid-2-cols`, `grid-3-cols`, etc.
5. **Formulaires** : `form-actions`, `form-group`, etc.
6. **Espacements** : `p-md`, `gap-sm`, etc.

### Exemple complet :
```tsx
// ❌ Avant
<div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
  <div className="relative">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg" />
    <Card className="relative border-0 shadow-sm">
      <CardContent className="p-6">
        <h1 className="text-3xl font-bold tracking-tight">Mon titre</h1>
      </CardContent>
    </Card>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Section
        </CardTitle>
      </CardHeader>
    </Card>
  </div>
</div>

// ✅ Après
<div className="page-container">
  <div className="page-header">
    <Card className="page-header-card">
      <CardContent className="p-lg">
        <h1 className="page-title">Mon titre</h1>
      </CardContent>
    </Card>
  </div>
  
  <div className="grid-2-cols">
    <Card>
      <CardHeader>
        <CardTitle className="section-title">
          <User className="section-icon" />
          Section
        </CardTitle>
      </CardHeader>
    </Card>
  </div>
</div>
```

Ce système de design permet une maintenance centralisée et une cohérence parfaite à travers toute l'application ! 🎨✨ 
