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
const tronquerDescription = (description: string, maxLength: number = 200) => {
    if (!description || description.length <= maxLength) return description;

    // Tronquer au dernier mot complet avant la limite
    const tronque = description.substring(0, maxLength);
    const dernierEspace = tronque.lastIndexOf(' ');

    if (dernierEspace > maxLength * 0.8) { // Si on peut tronquer près d'un mot
        return tronque.substring(0, dernierEspace) + '...';
    }

    return tronque + '...';
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
                    padding: '30px 30px 100px 30px', // Plus d'espace en bas pour éviter les débordements
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
                    flexDirection: 'row',
                    alignItems: 'center',
                },
                logo: {
                    width: 120,
                    height: 'auto',
                    marginRight: 15,
                },
                companyInfo: {
                    flexDirection: 'column',
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
                    wrap: false, // Empêche la coupure de cette section
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
                    wrap: false, // Empêche la coupure de cette section
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
                    wrap: false, // Empêche la coupure de l'en-tête
                },
                tableRow: {
                    flexDirection: 'row',
                    padding: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: '#E9ECEF',
                    minHeight: 40,
                    wrap: false, // Empêche les coupures de ligne
                    orphans: 3, // Évite les lignes orphelines
                    widows: 3, // Évite les lignes veuves
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
                    maxLines: 3, // Limite à 3 lignes pour éviter les débordements
                },
                // Summary
                summarySection: {
                    alignItems: 'flex-end',
                    marginTop: 15,
                    marginBottom: 10,
                    wrap: false, // Empêche la coupure du résumé
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
                // Section bancaire et signature avant le résumé
                bankingSignatureSection: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 15,
                    marginTop: 10,
                    wrap: false,
                },
                // Section bancaire sur page dédiée (plus d'espace)
                bankingSignatureSectionDedicated: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 25,
                    marginTop: 30,
                    wrap: false,
                },
                bankingBox: {
                    width: '48%',
                    backgroundColor: '#F8F9FA',
                    padding: 8,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: '#E9ECEF',
                },
                signatureBox: {
                    width: '48%',
                    backgroundColor: '#F8F9FA',
                    padding: 8,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: '#E9ECEF',
                    minHeight: 100,
                },
                bankingTitle: {
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                },
                bankingText: {
                    fontSize: 8,
                    color: '#333333',
                    marginBottom: 2,
                },
                signatureTitle: {
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                },
                signatureField: {
                    fontSize: 8,
                    color: '#666666',
                    marginBottom: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: '#CCCCCC',
                    paddingBottom: 2,
                },
                signatureLabel: {
                    fontSize: 8,
                    color: '#333333',
                    marginBottom: 2,
                },
                signatureSpace: {
                    marginTop: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#CCCCCC',
                    height: 30,
                },
                // Footer - Réorganisé pour une ligne horizontale
                footer: {
                    marginTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: '#E9ECEF',
                    paddingTop: 8,
                    wrap: false, // Empêche la coupure du footer
                },
                footerContent: {
                    flexDirection: 'row',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                },
                footerText: {
                    fontSize: 7,
                    color: '#666666',
                    textAlign: 'center',
                    marginHorizontal: 4,
                },
                footerSeparator: {
                    fontSize: 7,
                    color: '#666666',
                    marginHorizontal: 2,
                },
                // Styles pour les pages multiples
                pageBreak: {
                    break: true,
                },
                continuationHeader: {
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#666666',
                    textAlign: 'center',
                    marginBottom: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: '#E9ECEF',
                    paddingBottom: 8,
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
            en_attente: 'En attente',
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
                                {tronquerDescription(
                                    ligne.description_personnalisee ||
                                    ligne.service?.description ||
                                    'Configuration des environnements de développement et mise en place de l\'architecture basée sur votre cahier des charges'
                                )}
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
                            <Text style={styles.descriptionDetail}>
                                {tronquerDescription('Prestation de service')}
                            </Text>
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

        const renderBankingAndSignature = (isDedicatedPage: boolean = false) => (
        <View style={isDedicatedPage ? styles.bankingSignatureSectionDedicated : styles.bankingSignatureSection}>
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
    );

    const renderFooter = (
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
    );

    // Fonction pour diviser les lignes de devis en chunks pour pagination
    const chunkArray = (array: any[], chunkSize: number) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    };

        // Calculer dynamiquement le nombre de lignes par page
    const lignes = devis.lignes && devis.lignes.length > 0 ? devis.lignes : [];

    // Fonction pour estimer la hauteur d'une ligne selon sa description
    const estimerHauteurLigne = (ligne: any) => {
        const description = ligne.description_personnalisee || ligne.service?.description || '';
        const longueurDescription = description.length;

        // Hauteur de base : 40px
        // Hauteur supplémentaire selon la longueur de la description
        if (longueurDescription > 150) return 70; // Description très longue
        if (longueurDescription > 80) return 55;  // Description longue
        return 40; // Description normale
    };

    // Calculer les chunks de manière intelligente selon la hauteur estimée
    const calculerChunksIntelligents = (lignesArray: any[]) => {
        const chunks = [];
        let chunkActuel: any[] = [];
        let hauteurChunkActuel = 0;
        // Hauteur disponible pour le tableau sur une page complète
        const hauteurMaxParPageComplete = 600;
        // Hauteur disponible pour le tableau sur la première page (avec info client/dates)
        const hauteurMaxPremierePageAvecInfo = 400;

        lignesArray.forEach((ligne, index) => {
            const hauteurLigne = estimerHauteurLigne(ligne);
            const estPremiereIteration = chunks.length === 0;
            const hauteurMax = estPremiereIteration ? hauteurMaxPremierePageAvecInfo : hauteurMaxParPageComplete;

            // Si ajouter cette ligne dépasse la hauteur max OU on a déjà le nombre max de lignes
            const maxLignes = estPremiereIteration ? 10 : 15;
            if ((hauteurChunkActuel + hauteurLigne > hauteurMax && chunkActuel.length > 0) || chunkActuel.length >= maxLignes) {
                chunks.push(chunkActuel);
                chunkActuel = [ligne];
                hauteurChunkActuel = hauteurLigne;
            } else {
                chunkActuel.push(ligne);
                hauteurChunkActuel += hauteurLigne;
            }
        });

        // Ajouter le dernier chunk s'il n'est pas vide
        if (chunkActuel.length > 0) {
            chunks.push(chunkActuel);
        }

        return chunks.length > 0 ? chunks : [lignesArray];
    };

    const chunksLignes = lignes.length > 8 ? calculerChunksIntelligents(lignes) : [lignes];

    // Déterminer si on a besoin d'une page séparée pour la section finale
    const hauteurEstimeeDernierChunk = chunksLignes[chunksLignes.length - 1]?.reduce((total, ligne) => total + estimerHauteurLigne(ligne), 0) || 0;
    const hauteurSectionFinale = 180; // Section bancaire + résumé + footer
    const espaceDisponibleDernierePage = chunksLignes.length === 1 ? 400 : 600; // Moins d'espace sur première page

    const needsSeparateFinalPage = (hauteurEstimeeDernierChunk + hauteurSectionFinale) > espaceDisponibleDernierePage;

    // Fonction pour créer le tableau avec un subset de lignes
    const renderTableWithLines = (lignesChunk: any[], isFirstPage: boolean, isLastTablePage: boolean, chunkIndex: number) => (
        <View style={styles.tableSection}>
            {isFirstPage && <Text style={styles.tableTitle}>Détails du devis</Text>}
            {!isFirstPage && (
                <Text style={styles.continuationHeader}>
                    Détails du devis (suite - page {chunkIndex + 1})
                </Text>
            )}
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

                {/* Lignes du tableau pour ce chunk */}
                {lignesChunk.length > 0 ? lignesChunk.map((ligne, index) => {
                    // Calculer l'index global en comptant toutes les lignes des chunks précédents
                    const globalIndex = chunksLignes.slice(0, chunkIndex).reduce((total, chunk) => total + chunk.length, 0) + index;
                    const isLastInChunk = index === lignesChunk.length - 1;
                    const isLastInDocument = isLastTablePage && isLastInChunk;

                    return (
                        <View
                            key={ligne.id || globalIndex}
                            style={[
                                styles.tableRow,
                                isLastInDocument ? styles.tableRowLast : {},
                            ]}
                        >
                            <Text style={styles.cellNum}>{globalIndex + 1}</Text>
                            <View style={styles.cellDescription}>
                                <Text style={styles.descriptionTitle}>
                                    {ligne.service?.nom || `Phase ${globalIndex + 1} - Service personnalisé`}
                                </Text>
                                                            <Text style={styles.descriptionDetail}>
                                {tronquerDescription(
                                    ligne.description_personnalisee ||
                                    ligne.service?.description ||
                                    'Configuration des environnements de développement et mise en place de l\'architecture basée sur votre cahier des charges'
                                )}
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
                    );
                }) : (
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

    return (
        <Document>
            {chunksLignes.map((chunk, chunkIndex) => {
                const isFirstPage = chunkIndex === 0;
                const isLastTablePage = chunkIndex === chunksLignes.length - 1;
                const shouldShowFinalSections = isLastTablePage && !needsSeparateFinalPage;

                return (
                    <Page key={chunkIndex} size="A4" style={styles.page}>
                        {/* En-tête sur chaque page */}
                        {isFirstPage ? renderHeader : (
                            <View style={styles.header}>
                                <View style={styles.logoSection}>
                                    <Image
                                        style={styles.logo}
                                        src="/logo/logo-1-small.png"
                                    />
                                </View>
                                <View style={styles.statusSection}>
                                    <Text style={styles.devisNumber}>
                                        {devis.numero_devis} (page {chunkIndex + 1}/{needsSeparateFinalPage ? chunksLignes.length + 1 : chunksLignes.length})
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Contenu de la première page */}
                        {isFirstPage && (
                            <>
                                {renderInfo}
                                {renderDates}
                            </>
                        )}

                        {/* Tableau pour cette page */}
                        {renderTableWithLines(chunk, isFirstPage, isLastTablePage, chunkIndex)}

                        {/* Section bancaire/signature, résumé et footer si on n'a pas besoin d'une page séparée */}
                        {shouldShowFinalSections && (
                            <>
                                {renderBankingAndSignature(false)}
                                {renderSummary}
                                {renderFooter}
                            </>
                        )}
                    </Page>
                );
            })}

            {/* Page séparée pour les sections finales si nécessaire */}
            {needsSeparateFinalPage && (
                <Page size="A4" style={styles.page}>
                    {/* En-tête simplifié */}
                    <View style={styles.header}>
                        <View style={styles.logoSection}>
                            <Image
                                style={styles.logo}
                                src="/logo/logo-1-small.png"
                            />
                        </View>
                        <View style={styles.statusSection}>
                            <Text style={styles.devisNumber}>
                                {devis.numero_devis} (page {chunksLignes.length + 1}/{chunksLignes.length + 1})
                            </Text>
                        </View>
                    </View>

                    {/* Sections finales sur page dédiée */}
                    {renderBankingAndSignature(true)}
                    {renderSummary}
                    {renderFooter}
                </Page>
            )}
        </Document>
    );
}

export default DevisPdfPreview;
