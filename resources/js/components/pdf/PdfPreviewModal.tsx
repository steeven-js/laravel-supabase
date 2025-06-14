import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import DevisPdfPreview from './DevisPdfPreview';

interface PdfPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    devis: any;
    madinia?: any;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
    isOpen,
    onClose,
    devis,
    madinia
}) => {

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[100vw] w-[100vw] h-[98vh] p-0 m-0">

                <div className="flex-1 p-2">
                    <PDFViewer
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            borderRadius: '8px',
                        }}
                    >
                        <DevisPdfPreview devis={devis} madinia={madinia} />
                    </PDFViewer>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PdfPreviewModal;
