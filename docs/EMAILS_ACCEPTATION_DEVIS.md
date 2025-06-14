# 📧 Emails d'acceptation de devis

Cette fonctionnalité permet d'envoyer automatiquement des emails de confirmation lorsqu'un devis est accepté.

## 🎯 Fonctionnalités

Quand un devis est accepté (statut passé à `accepte`), le système envoie automatiquement :

1. **Email de confirmation au client** - Confirmation de l'acceptation avec récapitulatif
2. **Email de notification à l'admin** - Notification pour informer l'équipe de l'acceptation

## 📋 Configuration

### Variables d'environnement requises

Assurez-vous que ces variables sont configurées dans votre `.env` :

```env
# Configuration SMTP (Mailtrap pour les tests)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@votre-entreprise.com"
MAIL_FROM_NAME="Votre Entreprise"

# Email de l'administrateur pour les notifications
MAIL_ADMIN_EMAIL="admin@votre-entreprise.com"
```

### Pour Mailtrap (recommandé pour les tests)

1. Créez un compte sur [Mailtrap.io](https://mailtrap.io/)
2. Créez une nouvelle inbox
3. Copiez les paramètres SMTP dans votre `.env`

## 🚀 Comment ça fonctionne

### Déclenchement automatique

L'envoi se déclenche automatiquement quand :
- La méthode `accepter()` est appelée sur un modèle `Devis`
- Le statut du devis passe à `accepte`
- La date d'acceptation est enregistrée

### Code d'exemple

```php
// Dans votre contrôleur ou ailleurs
$devis = Devis::find(1);
$devis->accepter(); // ← Déclenche automatiquement l'envoi des emails
```

### Que contiennent les emails ?

#### Email client (`DevisAccepteMail`)
- Confirmation de l'acceptation
- Récapitulatif du devis (numéro, montant, dates)
- Prochaines étapes
- Informations de contact
- PDF du devis en pièce jointe (si disponible)

#### Email admin (`DevisAccepteAdminMail`)
- Notification de l'acceptation
- Détails du devis et du client
- Actions recommandées
- Liens rapides vers le devis et la transformation en facture

## 🧪 Tests

### Test en ligne de commande

```bash
# Test email client
php artisan mail:test-devis-accepte votre@email.com

# Test email admin
php artisan mail:test-devis-accepte admin@email.com --admin
```

### Test avec un vrai devis

```bash
# Accepter un devis existant pour tester
php artisan tinker
>>> $devis = App\Models\Devis::first()
>>> $devis->accepter() // Enverra les emails automatiquement
```

### Vérifier les logs

Les logs d'envoi sont enregistrés dans `storage/logs/laravel.log` :

```bash
# Suivre les logs en temps réel
tail -f storage/logs/laravel.log | grep "acceptation"
```

## 📄 Templates d'email

### Templates Blade (par défaut)

- **Client** : `resources/views/emails/devis/accepte.blade.php`
- **Admin** : `resources/views/emails/devis/accepte-admin.blade.php`

### Templates en base de données

Des templates personnalisables sont disponibles dans la table `email_templates` :

- Catégorie : `acceptation_devis`
- Types : `confirmation`

Pour utiliser les templates de la base de données, modifiez la classe `DevisAccepteMail` pour utiliser `DevisClientMail` avec le système de templates existant.

## 🔧 Personnalisation

### Modifier les emails

1. **Via les templates Blade** : Éditez directement les fichiers `.blade.php`
2. **Via la base de données** : Créez/modifiez les templates dans l'interface admin
3. **Via le code** : Modifiez les classes `DevisAccepteMail` et `DevisAccepteAdminMail`

### Variables disponibles

Dans les templates, vous avez accès à :

- `$devis` : Le modèle Devis complet
- `$client` : Le modèle Client complet
- Toutes les propriétés des modèles (montants, dates, etc.)

### Ajouter des destinataires

Pour envoyer à plusieurs personnes, modifiez la méthode `envoyerEmailsAcceptation()` dans `app/Models/Devis.php`.

## 🚨 Gestion des erreurs

- Les erreurs d'envoi sont loggées mais n'empêchent pas l'acceptation du devis
- L'acceptation reste valide même si l'email échoue
- Vérifiez les logs pour diagnostiquer les problèmes

## 🔍 Dépannage

### Email non reçu ?

1. Vérifiez la configuration SMTP dans `.env`
2. Vérifiez les logs : `tail -f storage/logs/laravel.log`
3. Testez avec la commande : `php artisan mail:test-devis-accepte votre@email.com`
4. Si vous utilisez Mailtrap, vérifiez votre inbox Mailtrap

### Erreurs courantes

- **"Connection refused"** → Vérifiez MAIL_HOST et MAIL_PORT
- **"Authentication failed"** → Vérifiez MAIL_USERNAME et MAIL_PASSWORD
- **"Admin email non configuré"** → Ajoutez MAIL_ADMIN_EMAIL dans .env

### Test de configuration complète

```bash
# Diagnostic complet de la configuration mail
php artisan mail:diagnose votre@email.com
```

## 📊 Monitoring

### Logs à surveiller

- `Email de confirmation d'acceptation envoyé au client`
- `Email de notification d'acceptation envoyé à l'admin`
- `Erreur lors de l'envoi des emails d'acceptation`

### Métriques utiles

- Nombre de devis acceptés par jour/semaine
- Taux de succès d'envoi des emails
- Temps de réponse du serveur SMTP

## 🎛️ Configuration avancée

### Utiliser les queues (recommandé en production)

Modifiez les classes Mail pour implémenter `ShouldQueue` :

```php
class DevisAccepteMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;
    // ...
}
```

### Notifications Slack/Discord

Ajoutez des notifications dans la méthode `envoyerEmailsAcceptation()` pour notifier votre équipe via Slack ou Discord.

### Webhook de confirmation

Ajoutez un webhook pour notifier d'autres systèmes de l'acceptation du devis.

---

## 🚀 Mise en production

Avant de mettre en production :

1. ✅ Testez avec Mailtrap
2. ✅ Configurez le vrai serveur SMTP
3. ✅ Testez avec de vrais emails
4. ✅ Configurez les queues si nécessaire
5. ✅ Vérifiez les permissions des fichiers de logs
6. ✅ Documentez la configuration pour votre équipe

---

Créé le {{ now()->format('d/m/Y') }} - Documentation technique 
