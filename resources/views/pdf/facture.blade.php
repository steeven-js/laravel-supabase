<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture {{ $facture->numero_facture }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
        }

        .header {
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }

        .header h1 {
            color: #2563eb;
            font-size: 28pt;
            margin: 0;
            font-weight: bold;
        }

        .company-info {
            margin-top: 10px;
            font-size: 9pt;
            color: #666;
        }

        .document-info {
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }

        .document-info h2 {
            color: #2563eb;
            font-size: 18pt;
            margin: 0 0 10px 0;
            font-weight: bold;
        }

        .info-grid {
            display: table;
            width: 100%;
            margin-top: 20px;
        }

        .info-column {
            display: table-cell;
            vertical-align: top;
            width: 50%;
            padding-right: 20px;
        }

        .info-box {
            background-color: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
        }

        .info-box h3 {
            color: #374151;
            font-size: 11pt;
            font-weight: bold;
            margin: 0 0 10px 0;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }

        .info-box p {
            margin: 3px 0;
            font-size: 9pt;
        }

        .details-section {
            margin: 30px 0;
        }

        .details-section h3 {
            color: #2563eb;
            font-size: 14pt;
            font-weight: bold;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin: 0 0 15px 0;
        }

        .description-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            font-size: 9pt;
            line-height: 1.5;
        }

        .amounts-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
            background-color: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }

        .amounts-table thead {
            background-color: #2563eb;
            color: white;
        }

        .amounts-table th,
        .amounts-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }

        .amounts-table th {
            font-weight: bold;
            font-size: 10pt;
        }

        .amounts-table td {
            font-size: 10pt;
        }

        .amounts-table .amount {
            text-align: right;
            font-weight: bold;
        }

        .total-row {
            background-color: #f8fafc;
            font-weight: bold;
            font-size: 11pt;
        }

        .total-row .amount {
            color: #2563eb;
            font-size: 12pt;
        }

        .payment-info {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }

        .payment-info h4 {
            color: #92400e;
            font-size: 11pt;
            font-weight: bold;
            margin: 0 0 8px 0;
        }

        .payment-info p {
            margin: 3px 0;
            font-size: 9pt;
            color: #451a03;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 8pt;
            color: #6b7280;
            text-align: center;
        }

        .notes-section {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }

        .notes-section h4 {
            color: #0c4a6e;
            font-size: 11pt;
            font-weight: bold;
            margin: 0 0 8px 0;
        }

        .notes-section p {
            margin: 3px 0;
            font-size: 9pt;
            color: #0c4a6e;
            line-height: 1.4;
        }

        .urgent-banner {
            background-color: #fee2e2;
            border: 2px solid #ef4444;
            border-radius: 6px;
            padding: 10px;
            margin: 15px 0;
            text-align: center;
        }

        .urgent-banner p {
            color: #dc2626;
            font-weight: bold;
            margin: 0;
            font-size: 10pt;
        }
    </style>
</head>
<body>
    <!-- En-tête -->
    <div class="header">
        <h1>{{ config('app.name', 'Mon Entreprise') }}</h1>
        <div class="company-info">
            <p><strong>Adresse :</strong> 123 Rue de l'Exemple, 75001 Paris</p>
            <p><strong>Téléphone :</strong> 01 23 45 67 89 | <strong>Email :</strong> contact@monentreprise.fr</p>
            <p><strong>SIRET :</strong> 123 456 789 00012 | <strong>TVA :</strong> FR12345678901</p>
        </div>
    </div>

    <!-- Informations de la facture -->
    <div class="document-info">
        <h2>FACTURE N° {{ $facture->numero_facture }}</h2>
        @if($facture->devis)
        <p><strong>Devis d'origine :</strong> {{ $facture->devis->numero_devis }}</p>
        @endif
    </div>

    <!-- Informations client et facture -->
    <div class="info-grid">
        <div class="info-column">
            <div class="info-box">
                <h3>Facturer à</h3>
                @if($entreprise)
                    <p><strong>{{ $entreprise->nom_commercial ?? $entreprise->nom }}</strong></p>
                    @if($entreprise->nom_commercial && $entreprise->nom !== $entreprise->nom_commercial)
                        <p>{{ $entreprise->nom }}</p>
                    @endif
                @endif
                <p>{{ $client->prenom }} {{ $client->nom }}</p>
                @if($client->email)
                    <p>{{ $client->email }}</p>
                @endif
                @if($client->telephone)
                    <p>{{ $client->telephone }}</p>
                @endif
                @if($entreprise && $entreprise->adresse)
                    <p>{{ $entreprise->adresse }}</p>
                    @if($entreprise->code_postal && $entreprise->ville)
                        <p>{{ $entreprise->code_postal }} {{ $entreprise->ville }}</p>
                    @endif
                @endif
                @if($entreprise && $entreprise->siret)
                    <p><strong>SIRET :</strong> {{ $entreprise->siret }}</p>
                @endif
                @if($entreprise && $entreprise->numero_tva)
                    <p><strong>TVA :</strong> {{ $entreprise->numero_tva }}</p>
                @endif
            </div>
        </div>

        <div class="info-column">
            <div class="info-box">
                <h3>Informations de facturation</h3>
                <p><strong>Date d'émission :</strong> {{ \Carbon\Carbon::parse($facture->date_facture)->format('d/m/Y') }}</p>
                <p><strong>Date d'échéance :</strong> {{ \Carbon\Carbon::parse($facture->date_echeance)->format('d/m/Y') }}</p>
                <p><strong>Statut :</strong> {{ ucfirst($facture->statut) }}</p>
                @if($facture->date_paiement)
                    <p><strong>Date de paiement :</strong> {{ \Carbon\Carbon::parse($facture->date_paiement)->format('d/m/Y') }}</p>
                @endif
                @if($facture->mode_paiement)
                    <p><strong>Mode de paiement :</strong> {{ $facture->mode_paiement }}</p>
                @endif
                @if($facture->reference_paiement)
                    <p><strong>Référence :</strong> {{ $facture->reference_paiement }}</p>
                @endif
            </div>
        </div>
    </div>

    <!-- Vérifier si la facture est en retard -->
    @if($facture->date_echeance < now() && $facture->statut !== 'payee')
    <div class="urgent-banner">
        <p>⚠️ FACTURE EN RETARD - Paiement requis immédiatement</p>
    </div>
    @endif

    <!-- Objet de la facture -->
    <div class="details-section">
        <h3>Objet</h3>
        <p><strong>{{ $facture->objet }}</strong></p>
    </div>

    <!-- Description -->
    @if($facture->description)
    <div class="details-section">
        <h3>Description des prestations</h3>
        <div class="description-box">
            {!! nl2br(e($facture->description)) !!}
        </div>
    </div>
    @endif

    <!-- Tableau des montants -->
    <table class="amounts-table">
        <thead>
            <tr>
                <th style="width: 60%;">Description</th>
                <th style="width: 20%;">Taux TVA</th>
                <th style="width: 20%;" class="amount">Montant</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $facture->objet }}</td>
                <td>{{ number_format($facture->taux_tva, 2) }}%</td>
                <td class="amount">{{ number_format($facture->montant_ht, 2, ',', ' ') }}€</td>
            </tr>
            <tr>
                <td><strong>Sous-total HT</strong></td>
                <td></td>
                <td class="amount"><strong>{{ number_format($facture->montant_ht, 2, ',', ' ') }}€</strong></td>
            </tr>
            <tr>
                <td><strong>TVA ({{ number_format($facture->taux_tva, 2) }}%)</strong></td>
                <td></td>
                <td class="amount"><strong>{{ number_format($facture->montant_ttc - $facture->montant_ht, 2, ',', ' ') }}€</strong></td>
            </tr>
            <tr class="total-row">
                <td><strong>TOTAL TTC</strong></td>
                <td></td>
                <td class="amount">{{ number_format($facture->montant_ttc, 2, ',', ' ') }}€</td>
            </tr>
        </tbody>
    </table>

    <!-- Informations de paiement -->
    @if($facture->conditions_paiement)
    <div class="payment-info">
        <h4>Conditions de paiement</h4>
        <p>{{ $facture->conditions_paiement }}</p>
    </div>
    @endif

    <!-- Notes -->
    @if($facture->notes)
    <div class="notes-section">
        <h4>Notes</h4>
        <p>{!! nl2br(e($facture->notes)) !!}</p>
    </div>
    @endif

    <!-- Pied de page -->
    <div class="footer">
        <p>Facture générée le {{ now()->format('d/m/Y à H:i') }}</p>
        <p>En cas de retard de paiement, des pénalités de 3 fois le taux d'intérêt légal pourront être appliquées.</p>
        <p>Une indemnité forfaitaire pour frais de recouvrement de 40€ sera due en cas de retard de paiement.</p>
    </div>
</body>
</html>
