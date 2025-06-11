<x-mail::message>
# Nouvelle facture créée : {{ $facture->numero_facture }}

Bonjour,

Une nouvelle facture a été automatiquement générée suite à la transformation du devis **{{ $devis->numero_devis }}**.

## Détails de la facture

<x-mail::table>
| Détail | Information |
|:-------|:------------|
| **Numéro de facture** | {{ $facture->numero_facture }} |
| **Devis d'origine** | {{ $devis->numero_devis }} |
| **Date d'émission** | {{ \Carbon\Carbon::parse($facture->date_facture)->format('d/m/Y') }} |
| **Date d'échéance** | {{ \Carbon\Carbon::parse($facture->date_echeance)->format('d/m/Y') }} |
| **Statut** | {{ ucfirst($facture->statut) }} |
| **Montant TTC** | **{{ number_format($facture->montant_ttc, 2, ',', ' ') }}€** |
</x-mail::table>

## Informations client

<x-mail::table>
| Détail | Information |
|:-------|:------------|
| **Nom** | {{ $client->prenom }} {{ $client->nom }} |
| **Email** | {{ $client->email }} |
@if($client->telephone)
| **Téléphone** | {{ $client->telephone }} |
@endif
@if($client->entreprise)
| **Entreprise** | {{ $client->entreprise->nom_commercial ?? $client->entreprise->nom }} |
@endif
</x-mail::table>

## Objet

{{ $devis->objet }}

@if($facture->description)
## Description

{{ $facture->description }}
@endif

<x-mail::button :url="route('factures.show', $facture->id)">
Voir la facture
</x-mail::button>

Cordialement,<br>
Système automatique {{ config('app.name') }}
</x-mail::message>
