import React, { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { DevisPdfPreview } from '@/components/pdf/DevisPdfPreview';
import { PdfSaveButton } from '@/components/pdf/PdfSaveButton';

interface Props {
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
    saveRoute: string;
    backRoute: string;
}

export default function GeneratePdf({ devis, madinia, saveRoute, backRoute }: Props) {
    useEffect(() => {
        // Auto-scroll vers les boutons d'action
        const actionSection = document.getElementById('pdf-actions');
        if (actionSection) {
            actionSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, []);

    return (
        <>
            <Head title={`Génération PDF - ${devis.numero_devis}`} />

            <div className="min-h-screen bg-gray-50">
                {/* Header avec navigation */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href={backRoute}
                                    className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <ArrowLeft className="h-5 w-5 mr-2" />
                                    Retour au devis
                                </Link>
                                <div className="h-6 w-px bg-gray-300"></div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    Génération PDF - {devis.numero_devis}
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                                    <span className="text-blue-600 font-semibold text-sm">1</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-blue-900 mb-2">
                                    Génération automatique avec react-pdf/renderer
                                </h3>
                                <p className="text-blue-700 mb-4">
                                    Cette page utilise react-pdf/renderer pour générer le PDF avec le même rendu
                                    que l'aperçu. Le PDF sera automatiquement sauvegardé localement et sur Supabase.
                                </p>
                                <div id="pdf-actions" className="flex gap-3">
                                    <PdfSaveButton
                                        pdfComponent={<DevisPdfPreview devis={devis} madinia={madinia} />}
                                        saveRoute={saveRoute}
                                        filename={`${devis.numero_devis}.pdf`}
                                        type="devis"
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        🚀 Générer et Sauvegarder
                                    </PdfSaveButton>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Aperçu du PDF */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="bg-gray-100 px-6 py-4 border-b">
                            <h2 className="text-lg font-medium text-gray-900">
                                Aperçu du PDF qui sera généré
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Ceci est exactement ce qui sera sauvegardé en PDF
                            </p>
                        </div>

                        <div className="p-6">
                            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-600">
                                <p className="mb-2">Aperçu PDF généré avec react-pdf/renderer</p>
                                <p className="text-sm">
                                    Le rendu final sera identique à ce que vous voyez dans l'aperçu
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Avantages */}
                    <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-green-900 mb-3">
                            ✅ Avantages de react-pdf/renderer
                        </h3>
                        <ul className="text-green-700 space-y-2">
                            <li>• 🎯 Rendu identique à l'aperçu</li>
                            <li>• ⚡ Génération côté client (plus rapide)</li>
                            <li>• 🔧 Composants React réutilisables</li>
                            <li>• 💾 Sauvegarde automatique locale + Supabase</li>
                            <li>• 🎨 Design moderne et responsive</li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
