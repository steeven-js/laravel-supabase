<x-mail::message>
# Nouveau devis créé : {{ $devis->numero_devis }}

Bonjour,

Un nouveau devis a été créé dans le système.

## Détails du devis

<x-mail::table>
| Détail | Information |
|:-------|:------------|
| **Numéro de devis** | {{ $devis->numero_devis }} |
| **Date d'émission** | {{ \Carbon\Carbon::parse($devis->date_devis)->format('d/m/Y') }} |
| **Date de validité** | {{ \Carbon\Carbon::parse($devis->date_validite)->format('d/m/Y') }} |
| **Statut** | {{ ucfirst($devis->statut) }} |
| **Objet** | {{ $devis->objet }} |
| **Montant TTC** | **{{ number_format($devis->montant_ttc, 2, ',', ' ') }}€** |
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

@if($devis->description)
## Description

{{ $devis->description }}
@endif

@if($devis->notes)
## Notes

{{ $devis->notes }}
@endif

<x-mail::button :url="$urlDevis">
Voir le devis
</x-mail::button>

@if($urlPdfSupabase)
<x-mail::button :url="$urlPdfSupabase" color="success">
Télécharger le PDF
</x-mail::button>
@endif

Cordialement,<br>
Système automatique {{ config('app.name') }}
</x-mail::message>
