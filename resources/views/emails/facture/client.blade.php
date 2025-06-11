<x-mail::message>
# Votre facture {{ $facture->numero_facture }}

Bonjour {{ $client->prenom }} {{ $client->nom }},

@if($messagePersonnalise)
{!! nl2br(e($messagePersonnalise)) !!}

---
@endif

Nous vous informons que votre facture a été générée suite à l'acceptation de votre devis **{{ $devis->numero_devis }}**.

## Détails de la facture

<x-mail::table>
| Détail | Information |
|:-------|:------------|
| **Numéro de facture** | {{ $facture->numero_facture }} |
| **Date d'émission** | {{ \Carbon\Carbon::parse($facture->date_facture)->format('d/m/Y') }} |
| **Date d'échéance** | {{ \Carbon\Carbon::parse($facture->date_echeance)->format('d/m/Y') }} |
| **Objet** | {{ $devis->objet }} |
| **Montant HT** | {{ number_format($facture->montant_ht, 2, ',', ' ') }}€ |
| **TVA ({{ $facture->taux_tva }}%)** | {{ number_format($facture->montant_ttc - $facture->montant_ht, 2, ',', ' ') }}€ |
| **Montant TTC** | **{{ number_format($facture->montant_ttc, 2, ',', ' ') }}€** |
</x-mail::table>

@if($facture->conditions_paiement)
## Conditions de paiement

{{ $facture->conditions_paiement }}
@endif

@if($facture->notes)
## Notes

{{ $facture->notes }}
@endif

La facture est disponible en pièce jointe de cet email.

Pour toute question concernant cette facture, n'hésitez pas à nous contacter.

Cordialement,<br>
{{ config('app.name') }}
</x-mail::message>
