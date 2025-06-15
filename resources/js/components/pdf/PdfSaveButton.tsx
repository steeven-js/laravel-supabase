import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { router } from '@inertiajs/react';
import { Download, Save, Loader2 } from 'lucide-react';

interface PdfSaveButtonProps {
    /** Le composant PDF à rendre */
    pdfComponent: React.ReactElement;
    /** Route pour sauvegarder le PDF */
    saveRoute: string;
    /** Nom de fichier suggéré */
    filename: string;
    /** Type de document (devis ou facture) */
    type: 'devis' | 'facture';
    /** Texte du bouton */
    children?: React.ReactNode;
    /** Classe CSS additionnelle */
    className?: string;
}

export function PdfSaveButton({
    pdfComponent,
    saveRoute,
    filename,
    type,
    children,
    className = '',
}: PdfSaveButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const generateAndSavePdf = async () => {
        try {
            setIsGenerating(true);

            // 1. Générer le PDF avec react-pdf/renderer
            const pdfBlob = await pdf(pdfComponent as any).toBlob();

            setIsGenerating(false);
            setIsSaving(true);

            // 2. Convertir le blob en base64
            const arrayBuffer = await pdfBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const binaryString = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
            const base64String = btoa(binaryString);

            // 3. Envoyer vers Laravel via Inertia
            router.post(
                saveRoute,
                {
                    pdf_blob: base64String,
                    filename: filename,
                    type: type,
                },
                {
                    onSuccess: () => {
                        setIsSaving(false);
                        console.log('PDF sauvegardé avec succès');
                    },
                    onError: (errors: any) => {
                        setIsSaving(false);
                        console.error('Erreur lors de la sauvegarde:', errors);
                    },
                }
            );
        } catch (error) {
            setIsGenerating(false);
            setIsSaving(false);
            console.error('Erreur lors de la génération du PDF:', error);
        }
    };

    const downloadPdf = async () => {
        try {
            setIsGenerating(true);

            // Générer le PDF avec react-pdf/renderer
            const pdfBlob = await pdf(pdfComponent as any).toBlob();

            // Créer un lien de téléchargement
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setIsGenerating(false);
        } catch (error) {
            setIsGenerating(false);
            console.error('Erreur lors du téléchargement du PDF:', error);
        }
    };

    const isLoading = isGenerating || isSaving;
    const loadingText = isGenerating ? 'Génération...' : isSaving ? 'Sauvegarde...' : '';

    return (
        <div className="flex gap-2">
            {/* Bouton Sauvegarder */}
            <button
                onClick={generateAndSavePdf}
                disabled={isLoading}
                className={`inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring ring-blue-300 disabled:opacity-25 transition ease-in-out duration-150 ${className}`}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {loadingText}
                    </>
                ) : (
                    <>
                        <Save className="mr-2 h-4 w-4" />
                        {children || 'Sauvegarder PDF'}
                    </>
                )}
            </button>

            {/* Bouton Télécharger */}
            <button
                onClick={downloadPdf}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150"
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Génération...
                    </>
                ) : (
                    <>
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger
                    </>
                )}
            </button>
        </div>
    );
}

export default PdfSaveButton;
