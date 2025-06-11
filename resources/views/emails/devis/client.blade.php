<x-mail::message>
# Votre devis {{ $devis->numero_devis }}

Bonjour {{ $client->prenom }} {{ $client->nom }},

@if($messagePersonnalise)
{!! nl2br(e($messagePersonnalise)) !!}

---
@endif

Nous avons le plaisir de vous faire parvenir votre devis pour le projet : **{{ $devis->objet }}**.

## Détails du devis

<x-mail::table>
| Détail | Information |
|:-------|:------------|
| **Numéro de devis** | {{ $devis->numero_devis }} |
| **Date d'émission** | {{ \Carbon\Carbon::parse($devis->date_devis)->format('d/m/Y') }} |
| **Date de validité** | {{ \Carbon\Carbon::parse($devis->date_validite)->format('d/m/Y') }} |
| **Objet** | {{ $devis->objet }} |
| **Montant HT** | {{ number_format($devis->montant_ht, 2, ',', ' ') }}€ |
| **TVA ({{ $devis->taux_tva }}%)** | {{ number_format($devis->montant_ttc - $devis->montant_ht, 2, ',', ' ') }}€ |
| **Montant TTC** | **{{ number_format($devis->montant_ttc, 2, ',', ' ') }}€** |
</x-mail::table>

@if($devis->description)
## Description du projet

{{ $devis->description }}
@endif

@if($devis->conditions)
## Conditions

{{ $devis->conditions }}
@endif

@if($devis->notes)
## Notes

{{ $devis->notes }}
@endif

Ce devis est valable jusqu'au **{{ \Carbon\Carbon::parse($devis->date_validite)->format('d/m/Y') }}**.

Le devis est disponible en pièce jointe de cet email.

Pour accepter ce devis ou pour toute question, n'hésitez pas à nous contacter.

<x-mail::button :url="route('devis.show', $devis->id)">
Voir le devis
</x-mail::button>

Cordialement,<br>
{{ config('app.name') }}
</x-mail::message>
