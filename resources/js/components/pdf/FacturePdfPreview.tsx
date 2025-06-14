import { useMemo } from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Fonction utilitaire pour formater la devise dans le PDF avec espaces pour les milliers
const fCurrencyPDF = (value: number | string | null | undefined) => {
    if (value == null || value === '') return '0 €';

    // Convertir en nombre pour être sûr
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (Number.isNaN(num)) return '0 €';

    // Formater le nombre manuellement avec des espaces pour les milliers
    return `${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`;
};

// Fonction utilitaire pour formater les dates
const fDateSimple = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

// Configuration des polices - Utilisation des polices par défaut
// Font.register supprimé pour éviter les erreurs de chargement

const useStyles = () =>
    useMemo(
        () =>
            StyleSheet.create({
                // Layout
                page: {
                    fontSize: 9,
                    lineHeight: 1.4,
                    fontFamily: 'Helvetica',
                    backgroundColor: 'transparent',
                    padding: '30px 30px 80px 30px',
                },
                // Header
                header: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: '#000000',
                    paddingBottom: 10,
                },
                logoSection: {
                    flex: 1,
                },
                companyTitle: {
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 2,
                },
                logoSubtitle: {
                    fontSize: 10,
                    color: '#666666',
                },
                statusSection: {
                    alignItems: 'flex-end',
                },
                statusBadge: {
                    backgroundColor: '#D1FAE5',
                    color: '#065F46',
                    padding: '4px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                    marginBottom: 4,
                    textAlign: 'center',
                    minWidth: 80,
                },
                factureNumber: {
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#000000',
                },
                // Info sections
                infoSection: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                },
                infoBox: {
                    width: '48%',
                    backgroundColor: '#F8F9FA',
                    padding: 10,
                    borderRadius: 4,
                },
                infoTitle: {
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                },
                infoText: {
                    fontSize: 9,
                    color: '#333333',
                    marginBottom: 2,
                },
                infoName: {
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 2,
                },
                // Dates
                dateSection: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                },
                dateBox: {
                    width: '32%',
                    backgroundColor: '#F8F9FA',
                    padding: 10,
                    borderRadius: 4,
                },
                dateTitle: {
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 4,
                },
                dateText: {
                    fontSize: 9,
                    color: '#333333',
                },

                // Table
                tableSection: {
                    marginBottom: 20,
                },
                tableTitle: {
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 10,
                },
                table: {
                    borderWidth: 1,
                    borderColor: '#E9ECEF',
                    borderRadius: 4,
                },
                tableHeader: {
                    flexDirection: 'row',
                    backgroundColor: '#F8F9FA',
                    padding: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: '#E9ECEF',
                },
                tableRow: {
                    flexDirection: 'row',
                    padding: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: '#E9ECEF',
                    minHeight: 40,
                },
                tableRowLast: {
                    borderBottomWidth: 0,
                },
                cellNum: {
                    width: '5%',
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#000000',
                },
                cellDescription: {
                    width: '50%',
                    paddingRight: 10,
                },
                cellQuantity: {
                    width: '15%',
                    textAlign: 'center',
                    fontSize: 9,
                    color: '#000000',
                },
                cellPrice: {
                    width: '15%',
                    textAlign: 'right',
                    fontSize: 9,
                    color: '#000000',
                },
                cellTotal: {
                    width: '15%',
                    textAlign: 'right',
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#000000',
                },
                descriptionTitle: {
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 2,
                },
                descriptionDetail: {
                    fontSize: 8,
                    color: '#666666',
                    lineHeight: 1.3,
                },
                // Summary
                summarySection: {
                    alignItems: 'flex-end',
                    marginTop: 20,
                },
                summaryTable: {
                    width: '40%',
                    borderWidth: 1,
                    borderColor: '#E9ECEF',
                    borderRadius: 4,
                },
                summaryRow: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    padding: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: '#E9ECEF',
                },
                summaryRowLast: {
                    borderBottomWidth: 0,
                    backgroundColor: '#F8F9FA',
                },
                summaryLabel: {
                    fontSize: 9,
                    color: '#333333',
                },
                summaryValue: {
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#000000',
                },
                summaryTotal: {
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#000000',
                },
                // Payment and Notes sections
                paymentNotesSection: {
                    marginBottom: 20,
                },
                sectionBox: {
                    backgroundColor: '#EFF6FF',
                    padding: 10,
                    borderRadius: 4,
                    marginBottom: 10,
                },
                sectionTitle: {
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#1E40AF',
                    marginBottom: 4,
                },
                sectionText: {
                    fontSize: 8,
                    color: '#1E40AF',
                    lineHeight: 1.4,
                },
                // Footer
                footer: {
                    position: 'absolute',
                    bottom: 30,
                    left: 30,
                    right: 30,
                    borderTopWidth: 1,
                    borderTopColor: '#E9ECEF',
                    paddingTop: 15,
                },
                footerContent: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                },
                footerLeft: {
                    width: '32%',
                },
                footerCenter: {
                    width: '32%',
                },
                footerRight: {
                    width: '32%',
                    textAlign: 'right',
                },
                footerTitle: {
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 4,
                },
                footerText: {
                    fontSize: 8,
                    color: '#666666',
                    marginBottom: 2,
                },
            }),
        []
    );

interface FacturePdfPreviewProps {
    facture: {
        numero_facture: string;
        objet: string;
        statut: string;
        date_facture: string;
        date_echeance: string;
        date_paiement?: string;
        montant_ht: number;
        taux_tva: number;
        montant_ttc: number;
        description?: string;
        conditions_paiement?: string;
        notes?: string;
        client: {
            nom: string;
            prenom: string;
            email: string;
            telephone?: string;
            adresse?: string;
            ville?: string;
            code_postal?: string;
            entreprise?: {
                nom: string;
                nom_commercial?: string;
                adresse?: string;
                ville?: string;
                code_postal?: string;
            };
        };
        devis?: {
            numero_devis: string;
        };
        administrateur?: {
            id: number;
            name: string;
            email: string;
        };
    };
    madinia?: {
        name: string;
        telephone?: string;
        email?: string;
        adresse?: string;
        pays?: string;
        siret?: string;
        numero_nda?: string;
        nom_banque?: string;
        nom_compte_bancaire?: string;
        numero_compte?: string;
        iban_bic_swift?: string;
        site_web?: string;
    };
}

export function FacturePdfPreview({ facture, madinia }: FacturePdfPreviewProps) {
    const styles = useStyles();

    // Vérifications de sécurité approfondies
    if (!facture) {
        return (
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={{ padding: 20 }}>
                        <Text>Erreur : Objet facture manquant</Text>
                    </View>
                </Page>
            </Document>
        );
    }

    if (!facture.numero_facture) {
        return (
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={{ padding: 20 }}>
                        <Text>Erreur : Numéro de facture manquant</Text>
                    </View>
                </Page>
            </Document>
        );
    }

    if (!facture.client) {
        return (
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={{ padding: 20 }}>
                        <Text>Erreur : Informations client manquantes</Text>
                    </View>
                </Page>
            </Document>
        );
    }

    const formatStatut = (statut: string): string => {
        const statuts = {
            brouillon: 'Brouillon',
            envoyee: 'Envoyée',
            payee: 'Payée',
            en_retard: 'En retard',
            annulee: 'Annulée',
        };
        return statuts[statut as keyof typeof statuts] || statut;
    };

    const renderHeader = (
        <View style={styles.header}>
            <View style={styles.logoSection}>
                <Text style={styles.companyTitle}>{madinia?.name || 'MADIN.IA'}</Text>
                <Text style={styles.logoSubtitle}>Intelligence Artificielle</Text>
            </View>

            <View style={styles.statusSection}>
                <View style={styles.statusBadge}>
                    <Text>{formatStatut(facture.statut)}</Text>
                </View>
                <Text style={styles.factureNumber}>{facture.numero_facture}</Text>
            </View>
        </View>
    );

    const renderInfo = (
        <View style={styles.infoSection}>
            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Facture de</Text>
                <Text style={styles.infoName}>{madinia?.name || 'Madin.IA'}</Text>
                {madinia?.adresse && <Text style={styles.infoText}>{madinia.adresse}</Text>}
                {madinia?.pays && <Text style={styles.infoText}>{madinia.pays}</Text>}
                {madinia?.telephone && (
                    <Text style={styles.infoText}>Tél: {madinia.telephone}</Text>
                )}
                <Text style={styles.infoText}>
                    Email: {facture.administrateur?.email || madinia?.email || 'contact@madinia.fr'}
                </Text>
                {facture.administrateur && (
                    <Text style={[styles.infoText, { fontSize: 8, marginTop: 4, backgroundColor: '#F3F4F6', padding: 2 }]}>
                        Contact: {facture.administrateur.name}
                    </Text>
                )}
                {madinia?.siret && (
                    <Text style={styles.infoText}>SIRET: {madinia.siret}</Text>
                )}
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Facturé à</Text>
                <Text style={styles.infoName}>
                    {(facture.client?.prenom || '')} {(facture.client?.nom || '')}
                </Text>
                {facture.client?.entreprise && (
                    <Text style={styles.infoText}>
                        {facture.client.entreprise.nom_commercial || facture.client.entreprise.nom || ''}
                    </Text>
                )}
                {facture.client?.adresse && <Text style={styles.infoText}>{facture.client.adresse}</Text>}
                {(facture.client?.code_postal || facture.client?.ville) && (
                    <Text style={styles.infoText}>
                        {facture.client.code_postal || ''} {facture.client.ville || ''}
                    </Text>
                )}
                <Text style={styles.infoText}>Email: {facture.client?.email || ''}</Text>
                {facture.client?.telephone && (
                    <Text style={styles.infoText}>Tél: {facture.client.telephone}</Text>
                )}
            </View>
        </View>
    );

    const renderDates = (
        <View style={styles.dateSection}>
            <View style={styles.dateBox}>
                <Text style={styles.dateTitle}>Date de facture</Text>
                <Text style={styles.dateText}>{fDateSimple(facture.date_facture)}</Text>
            </View>
            <View style={styles.dateBox}>
                <Text style={styles.dateTitle}>Date d'échéance</Text>
                <Text style={styles.dateText}>{fDateSimple(facture.date_echeance)}</Text>
            </View>
            {facture.date_paiement && (
                <View style={styles.dateBox}>
                    <Text style={styles.dateTitle}>Date de paiement</Text>
                    <Text style={styles.dateText}>{fDateSimple(facture.date_paiement)}</Text>
                </View>
            )}
        </View>
    );

    const renderTable = (
        <View style={styles.tableSection}>
            <Text style={styles.tableTitle}>Détails de la facture</Text>
            <View style={styles.table}>
                {/* En-tête du tableau */}
                <View style={styles.tableHeader}>
                    <Text style={styles.cellNum}>#</Text>
                    <Text style={[styles.cellDescription, { fontSize: 9, fontWeight: 700 }]}>
                        Description
                    </Text>
                    <Text style={[styles.cellQuantity, { fontSize: 9, fontWeight: 700 }]}>
                        Quantité
                    </Text>
                    <Text style={[styles.cellPrice, { fontSize: 9, fontWeight: 700 }]}>
                        Prix unitaire
                    </Text>
                    <Text style={[styles.cellTotal, { fontSize: 9, fontWeight: 700 }]}>
                        Total
                    </Text>
                </View>

                {/* Ligne unique pour la facture */}
                <View style={[styles.tableRow, styles.tableRowLast]}>
                    <Text style={styles.cellNum}>1</Text>
                    <View style={styles.cellDescription}>
                        <Text style={styles.descriptionTitle}>Prestation de service</Text>
                        <Text style={styles.descriptionDetail}>
                            {facture.description || 'Service personnalisé'}
                        </Text>
                    </View>
                    <Text style={styles.cellQuantity}>1</Text>
                    <Text style={styles.cellPrice}>{fCurrencyPDF(facture.montant_ht || 0)}</Text>
                    <Text style={styles.cellTotal}>{fCurrencyPDF(facture.montant_ht || 0)}</Text>
                </View>
            </View>
        </View>
    );

    const renderSummary = (
        <View style={styles.summarySection}>
            <View style={styles.summaryTable}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Sous-total HT</Text>
                    <Text style={styles.summaryValue}>{fCurrencyPDF(facture.montant_ht || 0)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                        TVA ({(Number(facture.taux_tva) || 0).toFixed(1)}%)
                    </Text>
                    <Text style={styles.summaryValue}>
                        {fCurrencyPDF((facture.montant_ttc || 0) - (facture.montant_ht || 0))}
                    </Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryRowLast]}>
                    <Text style={styles.summaryTotal}>Total TTC</Text>
                    <Text style={styles.summaryTotal}>{fCurrencyPDF(facture.montant_ttc || 0)}</Text>
                </View>
            </View>
        </View>
    );

    const renderPaymentAndNotes = (
        <View style={styles.paymentNotesSection}>
            {facture.conditions_paiement && (
                <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>CONDITIONS DE PAIEMENT</Text>
                    <Text style={styles.sectionText}>{facture.conditions_paiement}</Text>
                </View>
            )}
            {facture.notes && (
                <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>NOTES</Text>
                    <Text style={styles.sectionText}>{facture.notes}</Text>
                </View>
            )}
        </View>
    );

    const renderFooter = (
        <View style={styles.footer}>
            <View style={{ textAlign: 'center' }}>
                <Text style={[styles.footerText, { fontSize: 9, fontWeight: 700, marginBottom: 2 }]}>
                    {madinia?.name || 'Madin.IA'}
                </Text>
                <Text style={styles.footerText}>
                    Email: {facture.administrateur?.email || madinia?.email || 'contact@madinia.fr'}
                </Text>
                {madinia?.site_web && (
                    <Text style={styles.footerText}>
                        Web: {madinia.site_web.replace(/^https?:\/\//, '')}
                    </Text>
                )}
            </View>
        </View>
    );

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {renderHeader}
                {renderInfo}
                {renderDates}
                {renderTable}
                {renderSummary}
                {renderPaymentAndNotes}
                {renderFooter}
            </Page>
        </Document>
    );
}

export default FacturePdfPreview;

