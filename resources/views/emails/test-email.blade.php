<x-mail::message>
# 🧪 Test d'Email Markdown

Ceci est un **email de test** généré depuis votre application Laravel avec les templates Markdown natifs !

<x-mail::panel>
**📧 Email envoyé à :** {{ $testEmail }}<br>
**📅 Date d'envoi :** {{ $timestamp }}<br>
**🌐 Environnement :** {{ $diagnostics['laravel']['environment'] }}
</x-mail::panel>

## 📊 Informations Système

### 🐘 PHP
- **Version :** {{ $diagnostics['php']['version'] }}
- **Extensions :**
  @if($diagnostics['php']['extensions']['pdo']) ✅ PDO @else ❌ PDO @endif
  @if($diagnostics['php']['extensions']['pdo_pgsql']) ✅ PostgreSQL @else ❌ PostgreSQL @endif
  @if($diagnostics['php']['extensions']['curl']) ✅ cURL @else ❌ cURL @endif

### 🚀 Laravel
- **Version :** {{ $diagnostics['laravel']['version'] }}
- **Debug :** @if($diagnostics['laravel']['debug_mode']) 🟢 Activé @else 🔴 Désactivé @endif
- **Timezone :** {{ $diagnostics['laravel']['timezone'] }}

## 🗄️ Base de Données

<x-mail::table>
| Paramètre | Valeur |
|-----------|--------|
| Statut | @if($diagnostics['database']['status'] === 'connected') ✅ Connecté @else ❌ Erreur @endif |
| Driver | {{ $diagnostics['database']['driver'] ?? 'N/A' }} |
| Host | {{ $diagnostics['database']['host'] ?? 'N/A' }} |
| Database | {{ $diagnostics['database']['database'] ?? 'N/A' }} |
</x-mail::table>

## 📧 Configuration Email

<x-mail::table>
| Paramètre | Valeur |
|-----------|--------|
| Driver | {{ $diagnostics['mail']['driver'] }} |
| Host | {{ $diagnostics['mail']['host'] }} |
| Port | {{ $diagnostics['mail']['port'] }} |
| From | {{ $diagnostics['mail']['from_address'] }} |
</x-mail::table>

## 💾 Stockage

- **Logs :** @if($diagnostics['storage']['logs_writable']) ✅ Accessible en écriture @else ❌ Non accessible @endif
- **Cache :** @if($diagnostics['storage']['cache_writable']) ✅ Accessible en écriture @else ❌ Non accessible @endif
- **Espace libre :** {{ number_format($diagnostics['storage']['disk_space']['free'] / 1024 / 1024 / 1024, 2) }} GB

## 🌍 Environnement

- **URL App :** {{ $diagnostics['environment']['app_url'] }}
- **Supabase :** @if($diagnostics['environment']['supabase_url']) ✅ Configuré @else ❌ Non configuré @endif

<x-mail::button :url="$appUrl" color="primary">
🏠 Accéder à l'application
</x-mail::button>

---

## ✨ Test des Composants Markdown

### Exemple de Panel Important
<x-mail::panel>
🎉 **Félicitations !** Votre système d'email fonctionne parfaitement. Cette notification démontre que Laravel peut envoyer des emails formatés en Markdown avec succès.
</x-mail::panel>

### Boutons de Test
<x-mail::button :url="$appUrl . '/monitoring'" color="success">
📊 Monitoring & Tests
</x-mail::button>

<x-mail::button :url="$appUrl . '/dashboard'" color="primary">
🏪 Dashboard
</x-mail::button>

---

Merci d'utiliser notre système de monitoring !<br>
**{{ config('app.name') }}**

<small>Email généré automatiquement le {{ $timestamp }}</small>
</x-mail::message>
