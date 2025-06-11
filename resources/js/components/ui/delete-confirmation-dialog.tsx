import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    itemName: string;
    deleteUrl: string;
    isDeleting?: boolean;
    onDelete?: () => void;
}

export function DeleteConfirmationDialog({
    isOpen,
    onClose,
    title,
    description,
    itemName,
    deleteUrl,
    isDeleting = false,
    onDelete
}: DeleteConfirmationDialogProps) {

    const handleDelete = () => {
        router.delete(deleteUrl, {
            onSuccess: () => {
                onClose();
                toast.success('Élément supprimé avec succès');
            },
            onError: (errors) => {
                console.error('Erreur lors de la suppression:', errors);
                toast.error('Une erreur est survenue lors de la suppression');
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                        <br />
                        <span className="font-medium text-foreground">"{itemName}"</span>
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onDelete}
                        disabled={isDeleting}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDeleting ? 'Suppression...' : 'Supprimer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
