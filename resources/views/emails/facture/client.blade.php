<x-mail::message>
# Votre facture {{ $facture->numero_facture }}

@if($messagePersonnalise)
{!! nl2br(e($messagePersonnalise)) !!}
@else
Bonjour {{ $client->prenom }} {{ $client->nom }},

Nous avons le plaisir de vous faire parvenir votre facture pour : **{{ $facture->objet }}**.

Merci de procéder au règlement dans les délais indiqués.
@endif

## 📄 Accès au document PDF

La facture est disponible :
- **En pièce jointe** de cet email au format PDF
@if($urlPdfSupabase)
- **En ligne** : [Télécharger le PDF]({{ $urlPdfSupabase }})
@endif

@if($urlPdfSupabase)
<x-mail::button :url="$urlPdfSupabase" color="success">
📄 Télécharger le PDF
</x-mail::button>
@endif

Pour toute question concernant cette facture, n'hésitez pas à nous contacter.

Cordialement,<br>
{{ config('app.name') }}
</x-mail::message>
