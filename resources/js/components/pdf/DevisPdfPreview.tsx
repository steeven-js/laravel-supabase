import { useMemo } from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

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

// Fonction utilitaire pour tronquer intelligemment les descriptions
const tronquerDescription = (description: string, maxLength: number = 120) => {
    if (!description || description.length <= maxLength) return description;

    // Tronquer au dernier mot complet avant la limite
    const tronque = description.substring(0, maxLength);
    const dernierEspace = tronque.lastIndexOf(' ');

    if (dernierEspace > maxLength * 0.8) { // Si on peut tronquer près d'un mot
        return tronque.substring(0, dernierEspace) + '...';
    }

    return tronque + '...';
};

// Fonction utilitaire pour formater les unités
const formatUnite = (quantite: number, unite?: string): string => {
    if (!unite) return quantite <= 1 ? 'unité' : 'unités';

    const unites = {
        heure: quantite <= 1 ? 'heure' : 'heures',
        journee: quantite <= 1 ? 'journée' : 'journées',
        semaine: quantite <= 1 ? 'semaine' : 'semaines',
        mois: 'mois',
        unite: quantite <= 1 ? 'unité' : 'unités',
        forfait: quantite <= 1 ? 'forfait' : 'forfaits',
        licence: quantite <= 1 ? 'licence' : 'licences',
    };

    return unites[unite as keyof typeof unites] || (quantite <= 1 ? 'unité' : 'unités');
};

const useStyles = () =>
    useMemo(
        () =>
            StyleSheet.create({
                // Layout ultra-optimisé pour une seule page
                page: {
                    fontSize: 7, // Réduit de 8 à 7
                    lineHeight: 1.2, // Réduit de 1.3 à 1.2
                    fontFamily: 'Helvetica',
                    backgroundColor: 'transparent',
                    padding: '15px 20px 60px 20px', // Marges ultra-réduites
                },
                // Header très compact
                header: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center', // Centré pour gagner de l'espace
                    marginBottom: 10, // Réduit de 15 à 10
                    borderBottomWidth: 1,
                    borderBottomColor: '#000000',
                    paddingBottom: 5, // Réduit de 8 à 5
                },
                logoSection: {
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                },
                logo: {
                    width: 80, // Réduit de 100 à 80
                    height: 'auto',
                    marginRight: 10, // Réduit de 12 à 10
                },
                statusSection: {
                    alignItems: 'flex-end',
                },
                statusBadge: {
                    backgroundColor: '#FFF3CD',
                    color: '#856404',
                    padding: '2px 5px', // Réduit de 3px 6px
                    fontSize: 8, // Réduit de 9 à 8
                    fontWeight: 700,
                    marginBottom: 2, // Réduit de 3 à 2
                    textAlign: 'center',
                    minWidth: 60, // Réduit de 70 à 60
                },
                devisNumber: {
                    fontSize: 12, // Réduit de 14 à 12
                    fontWeight: 700,
                    color: '#000000',
                },
                // Section info émetteur/client
                topInfoSection: {
                    marginBottom: 6,
                },
                infoSection: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 6, // Ultra-réduit
                },
                dateSection: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                },
                infoBox: {
                    width: '48%',
                    backgroundColor: '#F8F9FA',
                    padding: 6, // Réduit de 8 à 6
                    borderRadius: 2, // Réduit de 3 à 2
                },
                dateBox: {
                    width: '48%',
                    backgroundColor: '#F8F9FA',
                    padding: 6, // Réduit de 8 à 6
                    borderRadius: 2, // Réduit de 3 à 2
                },
                infoTitle: {
                    fontSize: 8, // Réduit de 9 à 8
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 3, // Réduit de 4 à 3
                    textTransform: 'uppercase',
                },
                dateTitle: {
                    fontSize: 8, // Réduit de 9 à 8
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 3, // Réduit de 3 à 2
                    textTransform: 'uppercase',
                },
                infoText: {
                    fontSize: 7, // Réduit de 8 à 7
                    color: '#333333',
                    marginBottom: 0.5, // Ultra-réduit
                },
                dateText: {
                    fontSize: 8, // Augmenté pour plus de lisibilité
                    color: '#000000',
                    fontWeight: 600,
                },
                infoName: {
                    fontSize: 8, // Réduit de 9 à 8
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 1,
                },
                // Table ultra-compacte
                tableSection: {
                    marginBottom: 8, // Réduit de 12 à 8
                },
                tableTitle: {
                    fontSize: 10, // Réduit de 11 à 10
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 5, // Réduit de 8 à 5
                },
                table: {
                    borderWidth: 1,
                    borderColor: '#E9ECEF',
                    borderRadius: 2, // Réduit de 3 à 2
                },
                tableHeader: {
                    flexDirection: 'row',
                    backgroundColor: '#F8F9FA',
                    padding: 4, // Réduit de 6 à 4
                    borderBottomWidth: 1,
                    borderBottomColor: '#E9ECEF',
                },
                tableRow: {
                    flexDirection: 'row',
                    padding: 4, // Réduit de 6 à 4
                    borderBottomWidth: 1,
                    borderBottomColor: '#E9ECEF',
                    minHeight: 28, // Réduit de 32 à 28
                },
                tableRowLast: {
                    borderBottomWidth: 0,
                },
                cellNum: {
                    width: '5%',
                    fontSize: 7,
                    fontWeight: 700,
                    color: '#000000',
                },
                cellDescription: {
                    width: '50%',
                    paddingRight: 6, // Réduit de 8 à 6
                },
                cellQuantity: {
                    width: '15%',
                    textAlign: 'center',
                    fontSize: 7,
                    color: '#000000',
                },
                cellPrice: {
                    width: '15%',
                    textAlign: 'right',
                    fontSize: 7,
                    color: '#000000',
                },
                cellTotal: {
                    width: '15%',
                    textAlign: 'right',
                    fontSize: 7,
                    fontWeight: 700,
                    color: '#000000',
                },
                descriptionTitle: {
                    fontSize: 7,
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 0.5, // Ultra-réduit
                },
                descriptionDetail: {
                    fontSize: 6, // Réduit de 7 à 6
                    color: '#666666',
                    lineHeight: 1.1, // Réduit de 1.2 à 1.1
                },
                // Section finale ultra-compacte avec tout sur 3 colonnes
                finalSectionCompact: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 6, // Ultra-réduit
                    marginBottom: 5,
                },
                bankingColumn: {
                    width: 260,
                    paddingRight: 8,
                },
                signatureColumn: {
                    width: 140,
                },
                summaryColumn: {
                    width: 140,
                },
                bankingBox: {
                    backgroundColor: '#F8F9FA',
                    padding: 8,
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: '#E9ECEF',
                },
                signatureBox: {
                    backgroundColor: '#F8F9FA',
                    padding: 4, // Ultra-réduit
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: '#E9ECEF',
                    minHeight: 60, // Réduit de 80 à 60
                },
                bankingTitle: {
                    fontSize: 8, // Réduit de 9 à 8
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 3, // Réduit de 4 à 3
                    textTransform: 'uppercase',
                },
                bankingText: {
                    fontSize: 6, // Réduit de 7 à 6
                    color: '#333333',
                    marginBottom: 0.5, // Ultra-réduit
                },
                signatureTitle: {
                    fontSize: 8, // Réduit de 9 à 8
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 3, // Réduit de 4 à 3
                    textTransform: 'uppercase',
                },
                signatureField: {
                    fontSize: 6, // Réduit de 7 à 6
                    color: '#666666',
                    marginBottom: 4, // Réduit de 6 à 4
                    borderBottomWidth: 1,
                    borderBottomColor: '#CCCCCC',
                    paddingBottom: 0.5, // Ultra-réduit
                },
                signatureLabel: {
                    fontSize: 6, // Réduit de 7 à 6
                    color: '#333333',
                    marginBottom: 0.5, // Ultra-réduit
                },
                signatureSpace: {
                    marginTop: 4, // Réduit de 6 à 4
                    borderBottomWidth: 1,
                    borderBottomColor: '#CCCCCC',
                    height: 15, // Réduit de 20 à 15
                },
                // Summary très compact
                summarySection: {
                    alignItems: 'flex-end',
                },
                summaryTable: {
                    width: '100%',
                    borderWidth: 1,
                    borderColor: '#E9ECEF',
                    borderRadius: 2,
                },
                summaryRow: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    padding: 4, // Réduit de 6 à 4
                    borderBottomWidth: 1,
                    borderBottomColor: '#E9ECEF',
                },
                summaryRowLast: {
                    borderBottomWidth: 0,
                    backgroundColor: '#F8F9FA',
                },
                summaryLabel: {
                    fontSize: 7, // Réduit de 8 à 7
                    color: '#333333',
                },
                summaryValue: {
                    fontSize: 7, // Réduit de 8 à 7
                    fontWeight: 700,
                    color: '#000000',
                },
                summaryTotal: {
                    fontSize: 9, // Réduit de 10 à 9
                    fontWeight: 700,
                    color: '#000000',
                },
                // Footer ultra-compact
                footer: {
                    position: 'absolute',
                    bottom: 15, // Réduit de 20 à 15
                    left: 20,
                    right: 20,
                    borderTopWidth: 1,
                    borderTopColor: '#E9ECEF',
                    paddingTop: 4, // Réduit de 6 à 4
                },
                footerContent: {
                    flexDirection: 'row',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                },
                footerText: {
                    fontSize: 5, // Réduit de 6 à 5
                    color: '#666666',
                    textAlign: 'center',
                    marginHorizontal: 2, // Réduit de 3 à 2
                },
                footerSeparator: {
                    fontSize: 5, // Réduit de 6 à 5
                    color: '#666666',
                    marginHorizontal: 1,
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
                unite?: string;
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

    // Vérifications de sécurité
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
            en_attente: 'En attente',
            envoye: 'Envoyé',
            accepte: 'Accepté',
            refuse: 'Refusé',
            expire: 'Expiré',
        };
        return statuts[statut as keyof typeof statuts] || statut;
    };

    const lignes = devis.lignes && devis.lignes.length > 0 ? devis.lignes : [];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header ultra-compact */}
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        <Image
                            style={styles.logo}
                            src="/logo/logo-1-small.png"
                        />
                    </View>
                    <View style={styles.statusSection}>
                        <View style={styles.statusBadge}>
                            <Text>{formatStatut(devis.statut)}</Text>
                        </View>
                        <Text style={styles.devisNumber}>{devis.numero_devis}</Text>
                    </View>
                </View>

                {/* Première ligne : Émetteur et Client */}
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
                                <Text style={[styles.infoText, { marginTop: 1 }]}>
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

                {/* Deuxième ligne : Date d'émission et Date d'échéance */}
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

                {/* Table ultra-compacte */}
                <View style={styles.tableSection}>
                    <Text style={styles.tableTitle}>Détails du devis</Text>
                    <View style={styles.table}>
                        {/* En-tête du tableau */}
                        <View style={styles.tableHeader}>
                            <Text style={styles.cellNum}>#</Text>
                            <Text style={[styles.cellDescription, { fontSize: 7, fontWeight: 700 }]}>
                                Description
                            </Text>
                            <Text style={[styles.cellQuantity, { fontSize: 7, fontWeight: 700 }]}>
                                Quantité
                            </Text>
                            <Text style={[styles.cellPrice, { fontSize: 7, fontWeight: 700 }]}>
                                Prix unitaire
                            </Text>
                            <Text style={[styles.cellTotal, { fontSize: 7, fontWeight: 700 }]}>
                                Total
                            </Text>
                        </View>

                        {/* Lignes du tableau */}
                        {lignes.length > 0 ? lignes.map((ligne, index) => (
                            <View
                                key={ligne.id || index}
                                style={[
                                    styles.tableRow,
                                    index === lignes.length - 1 ? styles.tableRowLast : {},
                                ]}
                            >
                                <Text style={styles.cellNum}>{index + 1}</Text>
                                <View style={styles.cellDescription}>
                                    <Text style={styles.descriptionTitle}>
                                        {ligne.service?.nom || `Phase ${index + 1} - Service personnalisé`}
                                    </Text>
                                    <Text style={styles.descriptionDetail}>
                                        {tronquerDescription(
                                            ligne.description_personnalisee ||
                                            ligne.service?.description ||
                                            'Configuration des environnements de développement et mise en place de l\'architecture basée sur votre cahier des charges',
                                            100 // Descriptions très courtes
                                        )}
                                    </Text>
                                </View>
                                <Text style={styles.cellQuantity}>
                                    {ligne.quantite || 1} {formatUnite(ligne.quantite || 1, ligne.service?.unite)}
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
                                    <Text style={styles.descriptionDetail}>
                                        {tronquerDescription('Prestation de service')}
                                    </Text>
                                </View>
                                <Text style={styles.cellQuantity}>1 unité</Text>
                                <Text style={styles.cellPrice}>{fCurrencyPDF(devis.montant_ht || 0)}</Text>
                                <Text style={styles.cellTotal}>{fCurrencyPDF(devis.montant_ht || 0)}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Section finale sur 3 colonnes : Bancaire | Signature | Résumé */}
                <View style={styles.finalSectionCompact}>
                    {/* Colonne 1 : Coordonnées bancaires */}
                    <View style={styles.bankingColumn}>
                        <View style={styles.bankingBox}>
                            <Text style={styles.bankingTitle}>Coordonnées bancaires</Text>
                            {madinia?.nom_banque && (
                                <Text style={styles.bankingText}>
                                    {madinia.nom_banque}
                                </Text>
                            )}
                            {madinia?.nom_compte_bancaire && (
                                <Text style={styles.bankingText}>
                                    Titulaire: {madinia.nom_compte_bancaire}
                                </Text>
                            )}
                            {madinia?.numero_compte && (
                                <Text style={styles.bankingText}>
                                    N° Compte: {madinia.numero_compte}
                                </Text>
                            )}
                            {madinia?.iban_bic_swift && (
                                <Text style={styles.bankingText}>
                                    IBAN/BIC: {madinia.iban_bic_swift}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Colonne 2 : Signature */}
                    <View style={styles.signatureColumn}>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureTitle}>Acceptation du devis</Text>

                            <Text style={styles.signatureLabel}>Date :</Text>
                            <View style={styles.signatureField}></View>

                            <Text style={styles.signatureLabel}>Lieu :</Text>
                            <View style={styles.signatureField}></View>

                            <Text style={styles.signatureLabel}>Signature et cachet :</Text>
                            <View style={styles.signatureSpace}></View>
                        </View>
                    </View>

                    {/* Colonne 3 : Résumé */}
                    <View style={styles.summaryColumn}>
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
                    </View>
                </View>

                {/* Footer ultra-compact */}
                <View style={styles.footer}>
                    <View style={styles.footerContent}>
                        {madinia?.name && (
                            <>
                                <Text style={styles.footerText}>{madinia.name}</Text>
                                <Text style={styles.footerSeparator}>•</Text>
                            </>
                        )}
                        {madinia?.adresse && (
                            <>
                                <Text style={styles.footerText}>{madinia.adresse}</Text>
                                <Text style={styles.footerSeparator}>•</Text>
                            </>
                        )}
                        {madinia?.siret && (
                            <>
                                <Text style={styles.footerText}>SIRET: {madinia.siret}</Text>
                                <Text style={styles.footerSeparator}>•</Text>
                            </>
                        )}
                        {madinia?.numero_nda && (
                            <>
                                <Text style={styles.footerText}>N° DA: {madinia.numero_nda}</Text>
                                <Text style={styles.footerSeparator}>•</Text>
                            </>
                        )}
                        <Text style={styles.footerText}>
                            Contact: {devis.administrateur?.email || madinia?.email || 'contact@madinia.fr'}
                        </Text>
                        {devis.notes && (
                            <>
                                <Text style={styles.footerSeparator}>•</Text>
                                <Text style={styles.footerText}>{devis.notes}</Text>
                            </>
                        )}
                    </View>
                </View>
            </Page>
        </Document>
    );
}

export default DevisPdfPreview;
