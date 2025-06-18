@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) === 'Laravel' || trim($slot) === 'Madin.IA-Dashboard' || trim($slot) === 'Madin.IA')
<img src="https://rrgxotnrwmjqnaugllks.supabase.co/storage/v1/object/public/img/logo/notification-logo.png" class="logo" alt="Madini.IA Dashboard Logo">
@else
{!! $slot !!}
@endif
</a>
</td>
</tr>
