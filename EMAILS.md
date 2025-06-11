# Système d'emails pour les factures

Ce système permet d'envoyer automatiquement des emails lors de la transformation d'un devis en facture.

## Configuration

### Variables d'environnement nécessaires

Ajoutez ces variables à votre fichier `.env` :

```env
# Configuration du mailer (exemple avec SMTP)
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host.com
MAIL_PORT=587
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@votre-entreprise.com"
MAIL_FROM_NAME="Votre Entreprise"

# Email de l'administrateur pour les notifications
MAIL_ADMIN_EMAIL="admin@votre-entreprise.com"
```

### Pour le développement

Pour le développement local, vous pouvez utiliser Mailpit (inclus dans Laravel) :

```env
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
```

Puis démarrez Mailpit :
```bash
./vendor/bin/sail artisan serve
# et dans un autre terminal :
./vendor/bin/sail mailpit
```

## Types d'emails

### Email client (`FactureClientMail`)

Envoyé au client lorsqu'une facture est créée à partir d'un devis accepté.

**Contenu :**
- Numéro de facture
- Détails de la facture (montants, dates)
- Message personnalisé (optionnel)
- Conditions de paiement
- Notes

**Template :** `resources/views/emails/facture/client.blade.php`

### Email admin (`FactureAdminMail`)

Envoyé à l'administrateur pour notification de création de facture.

**Contenu :**
- Détails de la nouvelle facture
- Informations client
- Lien vers la facture dans l'interface admin

**Template :** `resources/views/emails/facture/admin.blade.php`

## Test des emails

Utilisez la commande Artisan pour tester l'envoi des emails :

```bash
# Test email client
php artisan mail:test-facture votre-email@example.com

# Test email admin
php artisan mail:test-facture admin@example.com --admin
```

## Gestion des erreurs

Le système gère gracieusement les erreurs d'envoi d'email :
- Si l'envoi client échoue, la facture est quand même créée
- Si l'envoi admin échoue, cela n'affecte pas le processus
- Toutes les erreurs sont loggées dans `storage/logs/laravel.log`

## Mise en queue (optionnel)

Les emails implémentent `ShouldQueue` pour être traités en arrière-plan.

Pour activer les queues :

1. Configurez la queue dans `.env` :
```env
QUEUE_CONNECTION=database
```

2. Créez les tables de queue :
```bash
php artisan queue:table
php artisan migrate
```

3. Démarrez le worker :
```bash
php artisan queue:work
```

## Personnalisation

### Templates Markdown

Les templates utilisent les composants Markdown de Laravel :
- `<x-mail::message>` - Container principal
- `<x-mail::table>` - Tableaux
- `<x-mail::button>` - Boutons
- Markdown standard pour le formatage

### Ajout de pièces jointes

Pour ajouter la facture PDF en pièce jointe, décommentez et configurez dans `FactureClientMail::attachments()` :

```php
return [
    Attachment::fromPath('/path/to/facture.pdf')
        ->as("Facture_{$this->facture->numero_facture}.pdf")
        ->withMime('application/pdf'),
];
```

## Troubleshooting

### Email non reçu
1. Vérifiez les logs : `tail -f storage/logs/laravel.log`
2. Vérifiez la configuration SMTP
3. Vérifiez les spams/filtres

### Erreur de template
1. Vérifiez la syntaxe Blade
2. Assurez-vous que toutes les variables sont disponibles
3. Testez avec la commande `mail:test-facture` 
