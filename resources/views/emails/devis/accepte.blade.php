<x-mail::message>
# ✅ Confirmation d'acceptation de votre devis

Bonjour {{ $client->prenom }} {{ $client->nom }},

Nous avons le plaisir de vous confirmer que vous avez **accepté le devis {{ $devis->numero_devis }}**.

Votre acceptation a été enregistrée le **{{ \Carbon\Carbon::parse($devis->date_acceptation)->format('d/m/Y à H:i') }}**.

## 📋 Récapitulatif de votre commande

<x-mail::table>
| Détail | Information |
|:-------|:------------|
| **Numéro de devis** | {{ $devis->numero_devis }} |
| **Date d'acceptation** | {{ \Carbon\Carbon::parse($devis->date_acceptation)->format('d/m/Y à H:i') }} |
| **Objet** | {{ $devis->objet }} |
| **Montant HT** | {{ number_format($devis->montant_ht, 2, ',', ' ') }}€ |
| **TVA ({{ $devis->taux_tva }}%)** | {{ number_format($devis->montant_ttc - $devis->montant_ht, 2, ',', ' ') }}€ |
| **Montant TTC** | **{{ number_format($devis->montant_ttc, 2, ',', ' ') }}€** |
</x-mail::table>

@if($devis->description)
## 📝 Description du projet

{{ $devis->description }}
@endif

@if($devis->conditions)
## 📋 Conditions

{{ $devis->conditions }}
@endif

## 🚀 Prochaines étapes

Votre commande a été enregistrée et nous allons maintenant procéder aux étapes suivantes :

- **Planification** : Notre équipe va vous contacter pour planifier le démarrage
- **Facturation** : Une facture sera établie selon les conditions convenues
- **Réalisation** : Nous commencerons les travaux selon le planning établi

<x-mail::panel>
🎉 **Merci pour votre confiance !**

Nous sommes ravis de pouvoir travailler avec vous sur ce projet. Notre équipe se tient à votre disposition pour toute question.
</x-mail::panel>

<x-mail::button :url="route('devis.show', $devis->id)">
📄 Voir le devis accepté
</x-mail::button>

## 📞 Contact

Pour toute question concernant votre commande, n'hésitez pas à nous contacter :

- **Email** : {{ config('mail.from.address') }}
- **Téléphone** : {{ config('app.phone', 'Non configuré') }}

---

Nous vous remercions pour votre confiance et nous réjouissons de cette collaboration.

Cordialement,<br>
L'équipe {{ config('app.name') }}

<small>
📧 Email envoyé automatiquement le {{ now()->format('d/m/Y à H:i:s') }}<br>
🏷️ Référence : {{ $devis->numero_devis }}
</small>
</x-mail::message>
