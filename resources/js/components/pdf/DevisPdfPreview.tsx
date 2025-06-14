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
                    backgroundColor: '#FFF3CD',
                    color: '#856404',
                    padding: '4px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                    marginBottom: 4,
                    textAlign: 'center',
                    minWidth: 80,
                },
                devisNumber: {
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
                    width: '48%',
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
                    width: '65%',
                },
                footerRight: {
                    width: '30%',
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

interface DevisPdfPreviewProps {
    devis: {
        numero_devis: string;
        objet: string;
        statut: string;
        date_devis: string;
        date_validite: string;
        montant_ht: number;
        taux_tva: number;
        montant_ttc: number;
        notes?: string;
        lignes?: Array<{
            id: number;
            quantite: number;
            prix_unitaire_ht: number;
            taux_tva: number;
            montant_ht: number;
            montant_tva: number;
            montant_ttc: number;
            ordre: number;
            description_personnalisee?: string;
            service?: {
                nom: string;
                description: string;
            };
        }>;
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
        administrateur?: {
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
    };
}

export function DevisPdfPreview({ devis, madinia }: DevisPdfPreviewProps) {
  const styles = useStyles();

  // Vérifications de sécurité approfondies
  if (!devis) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={{ padding: 20 }}>
            <Text>Erreur : Objet devis manquant</Text>
          </View>
        </Page>
      </Document>
    );
  }

  if (!devis.numero_devis) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={{ padding: 20 }}>
            <Text>Erreur : Numéro de devis manquant</Text>
          </View>
        </Page>
      </Document>
    );
  }

  if (!devis.client) {
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
      envoye: 'Envoyé',
      accepte: 'Accepté',
      refuse: 'Refusé',
      expire: 'Expiré',
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
                    <Text>{formatStatut(devis.statut)}</Text>
                </View>
                <Text style={styles.devisNumber}>{devis.numero_devis}</Text>
            </View>
        </View>
    );

    const renderInfo = (
        <View style={styles.infoSection}>
            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Émetteur</Text>
                <Text style={styles.infoName}>{madinia?.name || 'Madin.IA'}</Text>
                {madinia?.adresse && <Text style={styles.infoText}>{madinia.adresse}</Text>}
                {madinia?.telephone && (
                    <Text style={styles.infoText}>Tél: {madinia.telephone}</Text>
                )}
                <Text style={styles.infoText}>
                    Email: {devis.administrateur?.email || madinia?.email || 'contact@madinia.fr'}
                </Text>
                {madinia?.siret && (
                    <Text style={styles.infoText}>SIRET: {madinia.siret}</Text>
                )}
                {devis.administrateur && (
                    <>
                        <Text style={[styles.infoText, { marginTop: 4 }]}>
                            Contact: {devis.administrateur.name}
                        </Text>
                        <Text style={styles.infoText}>Web: https://madinia.fr</Text>
                    </>
                )}
            </View>

                  <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Client</Text>
        <Text style={styles.infoName}>
          {(devis.client?.prenom || '')} {(devis.client?.nom || '')}
        </Text>
        {devis.client?.entreprise && (
          <Text style={styles.infoText}>
            {devis.client.entreprise.nom_commercial || devis.client.entreprise.nom || ''}
          </Text>
        )}
        {devis.client?.adresse && <Text style={styles.infoText}>{devis.client.adresse}</Text>}
        {(devis.client?.code_postal || devis.client?.ville) && (
          <Text style={styles.infoText}>
            {devis.client.code_postal || ''} {devis.client.ville || ''}
          </Text>
        )}
        <Text style={styles.infoText}>Email: {devis.client?.email || ''}</Text>
        {devis.client?.telephone && (
          <Text style={styles.infoText}>Tél: {devis.client.telephone}</Text>
        )}
      </View>
        </View>
    );

    const renderDates = (
        <View style={styles.dateSection}>
            <View style={styles.dateBox}>
                <Text style={styles.dateTitle}>Date d'émission</Text>
                <Text style={styles.dateText}>{fDateSimple(devis.date_devis)}</Text>
            </View>
            <View style={styles.dateBox}>
                <Text style={styles.dateTitle}>Date d'échéance</Text>
                <Text style={styles.dateText}>{fDateSimple(devis.date_validite)}</Text>
            </View>
        </View>
    );

    const renderTable = (
        <View style={styles.tableSection}>
            <Text style={styles.tableTitle}>Détails du devis</Text>
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

                        {/* Lignes du tableau */}
        {(devis.lignes && devis.lignes.length > 0) ? devis.lignes.map((ligne, index) => (
          <View
            key={ligne.id || index}
            style={[
              styles.tableRow,
              index === (devis.lignes?.length || 0) - 1 ? styles.tableRowLast : {},
            ]}
          >
            <Text style={styles.cellNum}>{index + 1}</Text>
            <View style={styles.cellDescription}>
              <Text style={styles.descriptionTitle}>
                {ligne.service?.nom || `Phase ${index + 1} - Service personnalisé`}
              </Text>
              <Text style={styles.descriptionDetail}>
                {ligne.description_personnalisee ||
                 ligne.service?.description ||
                 'Configuration des environnements de développement et mise en place de l\'architecture basée sur votre cahier des charges'}
              </Text>
            </View>
            <Text style={styles.cellQuantity}>
              {ligne.quantite || 1} {(ligne.quantite || 1) > 1 ? 'heures' : 'heure'}
            </Text>
            <Text style={styles.cellPrice}>
              {fCurrencyPDF(ligne.prix_unitaire_ht || 0)}
            </Text>
            <Text style={styles.cellTotal}>
              {fCurrencyPDF(ligne.montant_ht || 0)}
            </Text>
          </View>
        )) : (
          <View style={styles.tableRow}>
            <Text style={styles.cellNum}>1</Text>
            <View style={styles.cellDescription}>
              <Text style={styles.descriptionTitle}>Service personnalisé</Text>
              <Text style={styles.descriptionDetail}>Prestation de service</Text>
            </View>
            <Text style={styles.cellQuantity}>1 heure</Text>
            <Text style={styles.cellPrice}>{fCurrencyPDF(devis.montant_ht || 0)}</Text>
            <Text style={styles.cellTotal}>{fCurrencyPDF(devis.montant_ht || 0)}</Text>
          </View>
        )}
            </View>
        </View>
    );

    const renderSummary = (
        <View style={styles.summarySection}>
            <View style={styles.summaryTable}>
                        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sous-total HT</Text>
          <Text style={styles.summaryValue}>{fCurrencyPDF(devis.montant_ht || 0)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            TVA ({(Number(devis.taux_tva) || 0).toFixed(1)}%)
          </Text>
          <Text style={styles.summaryValue}>
            {fCurrencyPDF((devis.montant_ttc || 0) - (devis.montant_ht || 0))}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryRowLast]}>
          <Text style={styles.summaryTotal}>Total TTC</Text>
          <Text style={styles.summaryTotal}>{fCurrencyPDF(devis.montant_ttc || 0)}</Text>
        </View>
            </View>
        </View>
    );

    const renderFooter = (
        <View style={styles.footer}>
            <View style={styles.footerContent}>
                <View style={styles.footerLeft}>
                    <Text style={styles.footerTitle}>INFORMATIONS LÉGALES</Text>
                    {madinia?.name && (
                        <Text style={styles.footerText}>
                            {madinia.name}
                        </Text>
                    )}
                    {madinia?.adresse && (
                        <Text style={styles.footerText}>
                            {madinia.adresse}
                        </Text>
                    )}
                    {madinia?.pays && (
                        <Text style={styles.footerText}>
                            {madinia.pays}
                        </Text>
                    )}
                    {madinia?.siret && (
                        <Text style={styles.footerText}>
                            SIRET: {madinia.siret}
                        </Text>
                    )}
                    {madinia?.numero_nda && (
                        <Text style={styles.footerText}>
                            N° DA: {madinia.numero_nda}
                        </Text>
                    )}
                    {devis.notes && (
                        <Text style={[styles.footerText, { marginTop: 4 }]}>{devis.notes}</Text>
                    )}
                </View>
                <View style={styles.footerRight}>
                    <Text style={styles.footerTitle}>COORDONNÉES BANCAIRES</Text>
                    {madinia?.nom_banque && (
                        <Text style={styles.footerText}>
                            {madinia.nom_banque}
                        </Text>
                    )}
                    {madinia?.nom_compte_bancaire && (
                        <Text style={styles.footerText}>
                            Titulaire: {madinia.nom_compte_bancaire}
                        </Text>
                    )}
                    {madinia?.numero_compte && (
                        <Text style={styles.footerText}>
                            N° Compte: {madinia.numero_compte}
                        </Text>
                    )}
                    {madinia?.iban_bic_swift && (
                        <Text style={styles.footerText}>
                            IBAN/BIC: {madinia.iban_bic_swift}
                        </Text>
                    )}
                    <Text style={[styles.footerText, { marginTop: 4 }]}>
                        Contact: {devis.administrateur?.email || madinia?.email || 'contact@madinia.fr'}
                    </Text>
                </View>
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
                {renderFooter}
            </Page>
        </Document>
    );
}

export default DevisPdfPreview;
