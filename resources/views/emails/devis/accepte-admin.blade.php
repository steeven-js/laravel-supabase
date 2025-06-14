<x-mail::message>
# 🎉 Devis accepté : {{ $devis->numero_devis }}

Bonjour,

**Excellente nouvelle !** Le devis {{ $devis->numero_devis }} a été accepté par le client.

## 📋 Détails du devis accepté

<x-mail::table>
| Détail | Information |
|:-------|:------------|
| **Numéro de devis** | {{ $devis->numero_devis }} |
| **Date d'acceptation** | {{ \Carbon\Carbon::parse($devis->date_acceptation)->format('d/m/Y à H:i') }} |
| **Objet** | {{ $devis->objet }} |
| **Montant HT** | {{ number_format($devis->montant_ht, 2, ',', ' ') }}€ |
| **TVA ({{ $devis->taux_tva }}%)** | {{ number_format($devis->montant_ttc - $devis->montant_ht, 2, ',', ' ') }}€ |
| **Montant TTC** | **{{ number_format($devis->montant_ttc, 2, ',', ' ') }}€** |
| **Statut** | ✅ Accepté |
</x-mail::table>

## 👤 Informations client

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
## 📝 Description du projet

{{ $devis->description }}
@endif

@if($devis->conditions)
## 📋 Conditions

{{ $devis->conditions }}
@endif

@if($devis->notes)
## 📝 Notes

{{ $devis->notes }}
@endif

## 🚀 Actions recommandées

<x-mail::panel>
**Prochaines étapes suggérées :**

1. **Contacter le client** pour planifier le démarrage du projet
2. **Créer une facture** à partir de ce devis accepté
3. **Planifier les ressources** nécessaires pour le projet
4. **Mettre à jour le planning** des projets en cours
</x-mail::panel>

<x-mail::button :url="route('devis.show', $devis->id)" color="success">
📄 Voir le devis accepté
</x-mail::button>

<x-mail::button :url="route('devis.transformer-facture', $devis->id)" color="primary">
🧾 Transformer en facture
</x-mail::button>

---

📧 **Email envoyé automatiquement** le {{ now()->format('d/m/Y à H:i:s') }}<br>
🔔 **Système de notifications** {{ config('app.name') }}

Cordialement,<br>
Système automatique {{ config('app.name') }}
</x-mail::message>
