import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { FacturePdfPreview } from '@/components/pdf/FacturePdfPreview';
import { PdfSaveButton } from '@/components/pdf/PdfSaveButton';

interface Props {
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
    };
    saveRoute: string;
    backRoute: string;
    autoGenerate: boolean;
}

export default function SyncPdf({ facture, madinia, saveRoute, backRoute, autoGenerate }: Props) {
    useEffect(() => {
        if (autoGenerate) {
            // Auto-déclencher la génération du PDF après un court délai
            const timer = setTimeout(() => {
                const generateButton = document.querySelector('.auto-generate-btn') as HTMLButtonElement;
                if (generateButton) {
                    generateButton.click();
                }
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [autoGenerate]);

    return (
        <>
            <Head title={`Synchronisation PDF - ${facture.numero_facture}`} />

            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        {/* Icône de chargement */}
                        <div className="mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Synchronisation en cours
                            </h2>
                            <p className="text-gray-600">
                                Génération du PDF avec le nouveau template...
                            </p>
                        </div>

                        {/* Informations de la facture */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="text-sm text-gray-700">
                                <div className="font-semibold">Facture {facture.numero_facture}</div>
                                <div>Client: {facture.client.prenom} {facture.client.nom}</div>
                                <div>Montant: {Number(facture.montant_ttc || 0).toFixed(2)} € TTC</div>
                            </div>
                        </div>

                        {/* Bouton de génération automatique (caché) */}
                        <div className="hidden">
                            <PdfSaveButton
                                pdfComponent={<FacturePdfPreview facture={facture} madinia={madinia} />}
                                saveRoute={saveRoute}
                                filename={`${facture.numero_facture}.pdf`}
                                type="facture"
                                className="auto-generate-btn"
                            >
                                Générer PDF
                            </PdfSaveButton>
                        </div>

                        {/* Barre de progression simulée */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                        </div>

                        <p className="text-xs text-gray-500">
                            ✅ Template React PDF identique aux devis<br/>
                            💾 Sauvegarde automatique locale + Supabase
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
