import React from 'react';
import PdfSaveButton from './PdfSaveButton';
import { DevisPdfPreview } from './DevisPdfPreview';
import { FacturePdfPreview } from './FacturePdfPreview';

// Exemple d'utilisation pour un devis
export function ExempleDevis({ devis, madinia }: { devis: any; madinia: any }) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Actions PDF</h3>

            <PdfSaveButton
                pdfComponent={<DevisPdfPreview devis={devis} madinia={madinia} />}
                saveRoute={route('devis.save-react-pdf', devis.id)}
                filename={`devis_${devis.numero_devis}.pdf`}
                type="devis"
                className="mr-2"
            >
                Générer et Sauvegarder
            </PdfSaveButton>
        </div>
    );
}

// Exemple d'utilisation pour une facture
export function ExempleFacture({ facture, madinia }: { facture: any; madinia: any }) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Actions PDF</h3>

            <PdfSaveButton
                pdfComponent={<FacturePdfPreview facture={facture} madinia={madinia} />}
                saveRoute={route('factures.save-react-pdf', facture.id)}
                filename={`facture_${facture.numero_facture}.pdf`}
                type="facture"
                className="mr-2"
            >
                Générer et Sauvegarder
            </PdfSaveButton>
        </div>
    );
}

// Exemple d'utilisation avec aperçu et sauvegarde
export function PdfPreviewWithSave({
    type,
    data,
    madinia
}: {
    type: 'devis' | 'facture';
    data: any;
    madinia: any;
}) {
    const pdfComponent = type === 'devis'
        ? <DevisPdfPreview devis={data} madinia={madinia} />
        : <FacturePdfPreview facture={data} madinia={madinia} />;

    const saveRoute = type === 'devis'
        ? route('devis.save-react-pdf', data.id)
        : route('factures.save-react-pdf', data.id);

    const filename = type === 'devis'
        ? `devis_${data.numero_devis}.pdf`
        : `facture_${data.numero_facture}.pdf`;

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                    {type === 'devis' ? 'Devis' : 'Facture'} PDF
                </h3>

                <PdfSaveButton
                    pdfComponent={pdfComponent}
                    saveRoute={saveRoute}
                    filename={filename}
                    type={type}
                />
            </div>

            <div className="border rounded-lg overflow-hidden">
                {/* Vous pouvez ajouter ici un aperçu du PDF si souhaité */}
                <div className="bg-gray-50 p-4 text-center text-gray-600">
                    Aperçu PDF à venir
                </div>
            </div>
        </div>
    );
}

export default PdfSaveButton;
