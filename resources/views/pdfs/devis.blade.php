<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Devis {{ $devis->numero_devis }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: #fff;
        }

        .container {
            max-width: 100%;
            padding: 20px;
        }

        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .header-content {
            display: table;
            width: 100%;
        }

        .header-left, .header-right {
            display: table-cell;
            vertical-align: top;
            width: 50%;
        }

        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }

        .document-type {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            text-align: right;
        }

        .document-number {
            font-size: 16px;
            color: #6b7280;
            text-align: right;
            margin-top: 5px;
        }

        .client-section {
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }

        .client-info {
            background: #f9fafb;
            padding: 15px;
            border-radius: 5px;
        }

        .info-row {
            margin-bottom: 5px;
        }

        .label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
        }

        .details-section {
            margin-bottom: 30px;
        }

        .details-grid {
            display: table;
            width: 100%;
        }

        .details-left, .details-right {
            display: table-cell;
            vertical-align: top;
            width: 50%;
            padding-right: 20px;
        }

        .details-right {
            padding-right: 0;
            padding-left: 20px;
        }

        .details-item {
            margin-bottom: 10px;
            padding: 8px;
            background: #f8fafc;
            border-radius: 3px;
        }

        .content-section {
            margin-bottom: 30px;
        }

        .description-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 5px;
            border-left: 4px solid #2563eb;
            margin-bottom: 20px;
        }

        .amounts-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
        }

        .amounts-table {
            width: 100%;
            border-collapse: collapse;
        }

        .amounts-table td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
        }

        .amounts-table .label-col {
            width: 70%;
            font-weight: bold;
        }

        .amounts-table .amount-col {
            width: 30%;
            text-align: right;
            font-size: 14px;
        }

        .total-row {
            background: #2563eb;
            color: white;
            font-weight: bold;
            font-size: 16px;
        }

        .total-row td {
            border-bottom: none;
            padding: 12px 8px;
        }

        .conditions-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }

        .conditions-text {
            background: #fffbeb;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #f59e0b;
            font-size: 11px;
            line-height: 1.5;
        }

        .notes-section {
            margin-top: 20px;
        }

        .notes-text {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #06b6d4;
            font-size: 11px;
            line-height: 1.5;
        }

        .footer {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }

        .page-break {
            page-break-after: always;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .mt-10 {
            margin-top: 10px;
        }

        .mt-20 {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- En-tête -->
        <div class="header">
            <div class="header-content">
                <div class="header-left">
                    <div class="company-name">{{ config('app.name', 'Mon Entreprise') }}</div>
                    <div>123 Rue de l'Exemple</div>
                    <div>75001 Paris, France</div>
                    <div>Tel: 01 23 45 67 89</div>
                    <div>Email: contact@monentreprise.fr</div>
                </div>
                <div class="header-right">
                    <div class="document-type">DEVIS</div>
                    <div class="document-number">N° {{ $devis->numero_devis }}</div>
                    <div class="mt-10">
                        <strong>Date :</strong> {{ $devis->date_devis->format('d/m/Y') }}<br>
                        <strong>Validité :</strong> {{ $devis->date_validite->format('d/m/Y') }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Informations client -->
        <div class="client-section">
            <div class="section-title">INFORMATIONS CLIENT</div>
            <div class="client-info">
                @if($entreprise)
                    <div class="info-row">
                        <span class="label">Entreprise :</span>
                        {{ $entreprise->nom }}
                        @if($entreprise->nom_commercial && $entreprise->nom_commercial !== $entreprise->nom)
                            ({{ $entreprise->nom_commercial }})
                        @endif
                    </div>
                @endif
                <div class="info-row">
                    <span class="label">Contact :</span>
                    {{ $client->prenom }} {{ $client->nom }}
                </div>
                <div class="info-row">
                    <span class="label">Email :</span>
                    {{ $client->email }}
                </div>
                @if($client->telephone)
                    <div class="info-row">
                        <span class="label">Téléphone :</span>
                        {{ $client->telephone }}
                    </div>
                @endif
            </div>
        </div>

        <!-- Détails du devis -->
        <div class="details-section">
            <div class="section-title">DÉTAILS DU DEVIS</div>
            <div class="details-grid">
                <div class="details-left">
                    <div class="details-item">
                        <div class="label">Objet :</div>
                        <div>{{ $devis->objet }}</div>
                    </div>
                    <div class="details-item">
                        <div class="label">Statut :</div>
                        <div>
                            @switch($devis->statut)
                                @case('brouillon') Brouillon @break
                                @case('envoye') Envoyé @break
                                @case('accepte') Accepté @break
                                @case('refuse') Refusé @break
                                @case('expire') Expiré @break
                                @default {{ ucfirst($devis->statut) }}
                            @endswitch
                        </div>
                    </div>
                </div>
                <div class="details-right">
                    <div class="details-item">
                        <div class="label">Créé le :</div>
                        <div>{{ $devis->created_at->format('d/m/Y à H:i') }}</div>
                    </div>
                    @if($devis->updated_at->ne($devis->created_at))
                        <div class="details-item">
                            <div class="label">Modifié le :</div>
                            <div>{{ $devis->updated_at->format('d/m/Y à H:i') }}</div>
                        </div>
                    @endif
                </div>
            </div>
        </div>

        <!-- Description -->
        @if($devis->description)
            <div class="content-section">
                <div class="section-title">DESCRIPTION</div>
                <div class="description-box">
                    {!! nl2br(e($devis->description)) !!}
                </div>
            </div>
        @endif

        <!-- Montants -->
        <div class="amounts-section">
            <div class="section-title">RÉCAPITULATIF FINANCIER</div>
            <table class="amounts-table">
                <tr>
                    <td class="label-col">Montant Hors Taxes (HT)</td>
                    <td class="amount-col">{{ number_format($devis->montant_ht, 2, ',', ' ') }} €</td>
                </tr>
                <tr>
                    <td class="label-col">Taux de TVA</td>
                    <td class="amount-col">{{ number_format($devis->taux_tva, 2, ',', ' ') }} %</td>
                </tr>
                <tr>
                    <td class="label-col">Montant TVA</td>
                    <td class="amount-col">{{ number_format($devis->montant_ht * $devis->taux_tva / 100, 2, ',', ' ') }} €</td>
                </tr>
                <tr class="total-row">
                    <td class="label-col">TOTAL TTC</td>
                    <td class="amount-col">{{ number_format($devis->montant_ttc, 2, ',', ' ') }} €</td>
                </tr>
            </table>
        </div>

        <!-- Conditions -->
        @if($devis->conditions)
            <div class="conditions-section">
                <div class="section-title">CONDITIONS PARTICULIÈRES</div>
                <div class="conditions-text">
                    {!! nl2br(e($devis->conditions)) !!}
                </div>
            </div>
        @endif

        <!-- Notes -->
        @if($devis->notes)
            <div class="notes-section">
                <div class="section-title">NOTES</div>
                <div class="notes-text">
                    {!! nl2br(e($devis->notes)) !!}
                </div>
            </div>
        @endif
    </div>

    <!-- Pied de page -->
    <div class="footer">
        <div>
            Ce devis est valable jusqu'au {{ $devis->date_validite->format('d/m/Y') }} •
            Généré le {{ now()->format('d/m/Y à H:i') }}
        </div>
        <div class="mt-10">
            {{ config('app.name') }} - Tous droits réservés
        </div>
    </div>
</body>
</html>
