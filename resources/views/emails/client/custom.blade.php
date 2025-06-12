<x-mail::message>
# {{ $objet }}

Bonjour {{ $client->prenom }} {{ $client->nom }},

{!! nl2br(e($contenu)) !!}

---

## 📧 Informations de contact

<x-mail::table>
| Contact | Information |
|:--------|:------------|
| **Expéditeur** | {{ $user->name }} |
@if($madinia && $madinia->name)
| **Entreprise** | {{ $madinia->name }} |
@endif
@if($madinia && $madinia->telephone)
| **Téléphone** | {{ $madinia->telephone }} |
@endif
@if($madinia && $madinia->email)
| **Email** | {{ $madinia->email }} |
@endif
</x-mail::table>

N'hésitez pas à nous contacter pour toute question ou information complémentaire.

<x-mail::button :url="route('clients.show', $client->id)">
Voir votre profil client
</x-mail::button>

Cordialement,<br>
{{ $user->name }}<br>
@if($madinia && $madinia->name)
{{ $madinia->name }}
@endif
</x-mail::message>
