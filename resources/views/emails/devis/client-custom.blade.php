<x-mail::message>
{!! nl2br(e($contenuPersonnalise)) !!}

## 📄 Accès au document PDF

Le devis est disponible :
- **En pièce jointe** de cet email au format PDF
@if($urlPdfSupabase)
- **En ligne** : [Télécharger le PDF]({{ $urlPdfSupabase }})
@endif

<x-mail::button :url="route('devis.show', $devis->id)">
Voir le devis en ligne
</x-mail::button>

@if($urlPdfSupabase)
<x-mail::button :url="$urlPdfSupabase" color="success">
📄 Télécharger le PDF
</x-mail::button>
@endif

Cordialement,<br>
{{ config('app.name') }}
</x-mail::message>