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
            font-size: 11px;
            line-height: 1.4;
            color: #374151;
            background: #fff;
        }

        .container {
            max-width: 100%;
            padding: 80px;
        }

        /* Header */
        .header {
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

        .logo-section {
            margin-bottom: 15px;
        }

        .logo-box {
            display: inline-block;
            width: 40px;
            height: 40px;
            background: #10b981;
            border-radius: 6px;
            vertical-align: middle;
            margin-right: 10px;
            position: relative;
        }

        .logo-box::after {
            content: "📄";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 18px;
        }

        .document-title {
            display: inline-block;
            vertical-align: middle;
        }

        .document-title h1 {
            font-size: 20px;
            font-weight: bold;
            color: #10b981;
            margin: 0;
        }

        .document-subtitle {
            font-size: 10px;
            color: #6b7280;
            margin: 0;
        }

        .header-right {
            text-align: right;
        }

        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .status-accepte { background: #dcfce7; color: #166534; }
        .status-envoye { background: #dbeafe; color: #1e40af; }
        .status-refuse { background: #fee2e2; color: #dc2626; }
        .status-expire { background: #fed7aa; color: #ea580c; }
        .status-brouillon { background: #f3f4f6; color: #374151; }

        .devis-number {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
        }

        /* From/To sections */
        .from-to-section {
            display: table;
            width: 100%;
            margin-bottom: 25px;
        }

        .from-section, .to-section {
            display: table-cell;
            vertical-align: top;
            width: 50%;
            padding-right: 20px;
        }

        .to-section {
            padding-right: 0;
            padding-left: 20px;
        }

        .section-header {
            font-size: 11px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
        }

        .company-name {
            font-weight: 600;
            color: #111827;
            margin-bottom: 3px;
        }

        .contact-line {
            margin-bottom: 2px;
            color: #6b7280;
            font-size: 10px;
        }

        .siret-line {
            margin-top: 6px;
            font-size: 9px;
            color: #9ca3af;
        }

        /* Date information */
        .date-info {
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 25px;
        }

        .date-grid {
            display: table;
            width: 100%;
        }

        .date-cell {
            display: table-cell;
            width: 33.33%;
            text-align: center;
        }

        .date-label {
            font-size: 9px;
            color: #6b7280;
            margin-bottom: 3px;
        }

        .date-value {
            font-weight: 600;
            color: #111827;
        }

        /* Object section */
        .object-section {
            margin-bottom: 25px;
        }

        .object-title {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 8px;
        }

        .object-content {
            background: #eff6ff;
            padding: 12px;
            border-radius: 6px;
            color: #374151;
        }

        /* Items table */
        .items-section {
            margin-bottom: 25px;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            overflow: hidden;
        }

        .items-table thead {
            background: #f9fafb;
        }

        .items-table th {
            padding: 10px 12px;
            text-align: left;
            font-size: 9px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .items-table th:nth-child(1) { width: 5%; text-align: center; }
        .items-table th:nth-child(2) { width: 50%; }
        .items-table th:nth-child(3) { width: 15%; text-align: center; }
        .items-table th:nth-child(4) { width: 15%; text-align: right; }
        .items-table th:nth-child(5) { width: 15%; text-align: right; }

        .items-table td {
            padding: 10px 12px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
        }

        .items-table tbody tr:hover {
            background: #f9fafb;
        }

        .service-name {
            font-weight: 600;
            color: #111827;
            margin-bottom: 2px;
        }

        .service-description {
            color: #6b7280;
            font-size: 9px;
        }

        /* Totals section */
        .totals-section {
            margin-bottom: 25px;
        }

        .totals-container {
            width: 60%;
            margin-left: auto;
        }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 6px 0;
            border-bottom: 1px solid #f3f4f6;
        }

        .totals-table .label-col {
            color: #6b7280;
            width: 70%;
        }

        .totals-table .amount-col {
            text-align: right;
            font-weight: 500;
            width: 30%;
        }

        .total-final {
            border-top: 2px solid #e5e7eb;
            font-weight: bold;
            font-size: 14px;
            color: #111827;
            padding-top: 8px !important;
        }

        /* Notes section */
        .notes-section {
            margin-bottom: 25px;
        }

        .notes-title {
            font-size: 11px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
        }

        .notes-content {
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            font-size: 10px;
            color: #6b7280;
        }

                 /* Banking and signature section */
         .banking-signature-section {
             margin-top: 40px;
             margin-bottom: 30px;
         }

         .banking-signature-grid {
             display: table;
             width: 100%;
         }

         .banking-cell, .signature-cell {
             display: table-cell;
             width: 50%;
             vertical-align: top;
             padding: 0 10px;
         }

         /* Banking info box */
         .banking-box {
             border: 2px solid #10b981;
             border-radius: 8px;
             padding: 15px;
             background: #f0f9ff;
         }

         .banking-title {
             font-size: 12px;
             font-weight: 600;
             color: #10b981;
             margin-bottom: 10px;
             text-align: center;
             border-bottom: 1px solid #10b981;
             padding-bottom: 5px;
         }

         .banking-item {
             margin-bottom: 6px;
             font-size: 10px;
             color: #374151;
         }

         .banking-label {
             font-weight: 600;
             color: #1f2937;
             display: inline-block;
             width: 80px;
         }

         /* Enhanced signature box */
         .signature-box {
             border: 2px solid #3b82f6;
             border-radius: 8px;
             padding: 20px;
             background: #f8fafc;
             text-align: center;
         }

         .signature-box-title {
             font-size: 12px;
             font-weight: 600;
             color: #3b82f6;
             margin-bottom: 15px;
             border-bottom: 1px solid #3b82f6;
             padding-bottom: 5px;
         }

         .signature-fields {
             margin-bottom: 20px;
         }

         .signature-field {
             margin-bottom: 15px;
             text-align: left;
         }

         .signature-field-label {
             font-size: 10px;
             font-weight: 600;
             color: #374151;
             margin-bottom: 5px;
         }

         .signature-field-line {
             border-bottom: 1px solid #d1d5db;
             height: 20px;
             background: #fff;
             border-radius: 3px;
         }

         .signature-area {
             border: 1px dashed #9ca3af;
             height: 60px;
             background: #fff;
             border-radius: 5px;
             display: flex;
             align-items: center;
             justify-content: center;
             color: #9ca3af;
             font-size: 9px;
             font-style: italic;
         }

        /* Footer */
        .footer-section {
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
            margin-top: 30px;
        }

        .footer-content {
            text-align: center;
            margin-bottom: 12px;
            font-size: 10px;
            color: #6b7280;
        }

        .footer-legal {
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
        }

        .legal-grid {
            display: table;
            width: 100%;
        }

        .legal-cell {
            display: table-cell;
            width: 33.33%;
            vertical-align: top;
            text-align: center;
        }

        .legal-title {
            font-size: 9px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
        }

        .legal-content {
            font-size: 8px;
            color: #6b7280;
            line-height: 1.3;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header section with logo and title -->
        <div class="header">
            <div class="header-content">
                <div class="header-left">
                    <div class="logo-section">
                        <div class="logo-box"></div>
                        <div class="document-title">
                            <h1>DEVIS</h1>
                            <p class="document-subtitle">Document commercial</p>
                        </div>
                    </div>
                </div>
                <div class="header-right">
                    <div class="status-badge status-{{ $devis->statut }}">
                        @switch($devis->statut)
                            @case('brouillon') Brouillon @break
                            @case('envoye') Envoyé @break
                            @case('accepte') Accepté @break
                            @case('refuse') Refusé @break
                            @case('expire') Expiré @break
                            @default {{ ucfirst($devis->statut) }}
                        @endswitch
                    </div>
                    <div class="devis-number">{{ $devis->numero_devis }}</div>
                </div>
            </div>
        </div>

        <!-- From and To sections -->
        <div class="from-to-section">
            <!-- From section -->
            <div class="from-section">
                <div class="section-header">Devis de</div>
                <div class="company-name">{{ $madinia->name ?? 'Madin.IA' }}</div>
                @if($madinia && $madinia->adresse)
                    <div class="contact-line">{{ $madinia->adresse }}</div>
                @endif
                @if($madinia && $madinia->pays)
                    <div class="contact-line">{{ $madinia->pays }}</div>
                @endif
                @if($madinia && $madinia->telephone)
                    <div class="contact-line">📞 {{ $madinia->telephone }}</div>
                @endif
                @if($madinia && $madinia->email)
                    <div class="contact-line">✉ {{ $madinia->email }}</div>
                @endif
                @if($madinia && $madinia->siret)
                    <div class="siret-line">SIRET: {{ $madinia->siret }}</div>
                @endif
            </div>

            <!-- To section -->
            <div class="to-section">
                <div class="section-header">Devis pour</div>
                <div class="company-name">{{ $client->prenom }} {{ $client->nom }}</div>
                @if($entreprise)
                    <div class="contact-line">{{ $entreprise->nom_commercial ?? $entreprise->nom }}</div>
                @endif
                @if($client->adresse)
                    <div class="contact-line">{{ $client->adresse }}</div>
                @endif
                @if($client->code_postal || $client->ville)
                    <div class="contact-line">{{ $client->code_postal }} {{ $client->ville }}</div>
                @endif
                <div class="contact-line">✉ {{ $client->email }}</div>
                @if($client->telephone)
                    <div class="contact-line">📞 {{ $client->telephone }}</div>
                @endif
            </div>
        </div>

        <!-- Date information -->
        <div class="date-info">
            <div class="date-grid">
                <div class="date-cell">
                    <div class="date-label">Date de création</div>
                    <div class="date-value">{{ $devis->date_devis->format('d/m/Y') }}</div>
                </div>
                <div class="date-cell">
                    <div class="date-label">Date d'échéance</div>
                    <div class="date-value">{{ $devis->date_validite->format('d/m/Y') }}</div>
                </div>
                @if($devis->date_envoi_client)
                <div class="date-cell">
                    <div class="date-label">Date d'envoi</div>
                    <div class="date-value">{{ $devis->date_envoi_client->format('d/m/Y') }}</div>
                </div>
                @endif
            </div>
        </div>

        <!-- Object -->
        <div class="object-section">
            <div class="object-title">Objet du devis</div>
            <div class="object-content">{{ $devis->objet }}</div>
        </div>

        <!-- Items table -->
        <div class="items-section">
            <table class="items-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Description</th>
                        <th>Qté</th>
                        <th>Prix unitaire</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($lignes as $index => $ligne)
                        <tr>
                            <td style="text-align: center;">{{ $index + 1 }}</td>
                            <td>
                                <div class="service-name">
                                    {{ $ligne->service->nom ?? 'Service personnalisé' }}
                                </div>
                                <div class="service-description">
                                    {{ $ligne->description_personnalisee ?? $ligne->service->description ?? 'Prestation de service' }}
                                </div>
                            </td>
                            <td style="text-align: center;">{{ $ligne->quantite }}</td>
                            <td style="text-align: right;">{{ number_format($ligne->prix_unitaire_ht, 2, ',', ' ') }} €</td>
                            <td style="text-align: right; font-weight: 600;">{{ number_format($ligne->montant_ht, 2, ',', ' ') }} €</td>
                        </tr>
                    @empty
                        <tr>
                            <td style="text-align: center;">1</td>
                            <td>
                                <div class="service-name">Prestation de service</div>
                                <div class="service-description">{{ $devis->description ?? 'Service personnalisé' }}</div>
                            </td>
                            <td style="text-align: center;">1</td>
                            <td style="text-align: right;">{{ number_format($devis->montant_ht, 2, ',', ' ') }} €</td>
                            <td style="text-align: right; font-weight: 600;">{{ number_format($devis->montant_ht, 2, ',', ' ') }} €</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <!-- Totals section -->
        <div class="totals-section">
            <div class="totals-container">
                <table class="totals-table">
                    <tr>
                        <td class="label-col">Sous-total HT</td>
                        <td class="amount-col">{{ number_format($devis->montant_ht, 2, ',', ' ') }} €</td>
                    </tr>
                    <tr>
                        <td class="label-col">TVA ({{ number_format($devis->taux_tva, 1, ',', ' ') }}%)</td>
                        <td class="amount-col">{{ number_format($devis->montant_ttc - $devis->montant_ht, 2, ',', ' ') }} €</td>
                    </tr>
                    <tr class="total-final">
                        <td class="label-col">Total TTC</td>
                        <td class="amount-col">{{ number_format($devis->montant_ttc, 2, ',', ' ') }} €</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Notes section -->
        @if($devis->notes)
            <div class="notes-section">
                <div class="notes-title">Notes</div>
                <div class="notes-content">
                    {!! nl2br(e($devis->notes)) !!}
                </div>
            </div>
        @endif

                 <!-- Banking and signature section -->
         <div class="banking-signature-section">
             <div class="banking-signature-grid">
                 <!-- Banking information -->
                 <div class="banking-cell">
                     <div class="banking-box">
                         <div class="banking-title">COORDONNÉES BANCAIRES</div>
                         @if($madinia && ($madinia->nom_banque || $madinia->nom_compte_bancaire || $madinia->numero_compte || $madinia->iban_bic_swift))
                             @if($madinia->nom_compte_bancaire)
                                 <div class="banking-item">
                                     <span class="banking-label">Titulaire :</span>
                                     {{ $madinia->nom_compte_bancaire }}
                                 </div>
                             @endif
                             @if($madinia->nom_banque)
                                 <div class="banking-item">
                                     <span class="banking-label">Banque :</span>
                                     {{ $madinia->nom_banque }}
                                 </div>
                             @endif
                             @if($madinia->numero_compte)
                                 <div class="banking-item">
                                     <span class="banking-label">Compte :</span>
                                     {{ $madinia->numero_compte }}
                                 </div>
                             @endif
                             @if($madinia->iban_bic_swift)
                                 <div class="banking-item">
                                     <span class="banking-label">IBAN/BIC :</span>
                                     {{ $madinia->iban_bic_swift }}
                                 </div>
                             @endif
                         @else
                             <div class="banking-item" style="text-align: center; color: #9ca3af; font-style: italic;">
                                 Coordonnées bancaires non configurées
                             </div>
                         @endif
                     </div>
                 </div>

                 <!-- Enhanced client signature -->
                 <div class="signature-cell">
                     <div class="signature-box">
                         <div class="signature-box-title">ACCEPTATION DU DEVIS</div>

                         <div class="signature-fields">
                             <div class="signature-field">
                                 <div class="signature-field-label">Nom et prénom :</div>
                                 <div class="signature-field-line"></div>
                             </div>

                             <div class="signature-field">
                                 <div class="signature-field-label">Date d'acceptation :</div>
                                 <div class="signature-field-line"></div>
                             </div>
                         </div>

                         <div class="signature-field">
                             <div class="signature-field-label">Signature :</div>
                             <div class="signature-area">
                                 Signature manuscrite
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
         </div>

        <!-- Footer with support and legal info -->
        <div class="footer-section">
            <div class="footer-content">
                <p>Nous apprécions votre collaboration. Si vous avez besoin de nous ajouter la TVA ou des notes supplémentaires, faites-le nous savoir !</p>
                <p>Vous avez une question ? {{ $madinia->email ?? 'support@madinia.com' }}</p>
            </div>

            <!-- Legal information -->
            <div class="footer-legal">
                <div class="legal-grid">
                    <div class="legal-cell">
                        <div class="legal-title">Informations légales</div>
                        <div class="legal-content">
                            @if($madinia && $madinia->siret)
                                SIRET : {{ $madinia->siret }}<br>
                            @endif
                            @if($madinia && $madinia->numero_nda)
                                N° DA : {{ $madinia->numero_nda }}
                            @endif
                        </div>
                    </div>
                    <div class="legal-cell">
                        <div class="legal-title">Coordonnées bancaires</div>
                        <div class="legal-content">
                            @if($madinia && $madinia->nom_banque)
                                {{ $madinia->nom_banque }}<br>
                            @endif
                            @if($madinia && $madinia->iban_bic_swift)
                                IBAN/BIC : {{ $madinia->iban_bic_swift }}
                            @endif
                        </div>
                    </div>
                    <div class="legal-cell">
                        <div class="legal-title">Contact</div>
                        <div class="legal-content">
                            {{ $madinia->name ?? 'Madin.IA' }}<br>
                            @if($madinia && $madinia->site_web)
                                {{ $madinia->site_web }}
                            @endif
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
