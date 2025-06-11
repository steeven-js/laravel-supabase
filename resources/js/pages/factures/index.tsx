import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Receipt, CheckCircle, XCircle, Clock, AlertCircle, FileText, Download } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Factures',
        href: '/factures',
    },
];

interface Facture {
    id: number;
    numero_facture: string;
    client: {
        id: number;
        nom: string;
        prenom: string;
        entreprise?: {
            nom: string;
            nom_commercial?: string;
        };
    };
    devis?: {
        id: number;
        numero_devis: string;
    };
    objet: string;
    statut: string;
    date_facture: string;
    date_echeance: string;
    montant_ttc: number;
    created_at: string;
}

interface Props {
    factures: Facture[];
}

const getStatusVariant = (statut: string) => {
    switch (statut) {
        case 'payee':
            return 'default';
        case 'envoyee':
            return 'outline';
        case 'en_retard':
            return 'destructive';
        case 'annulee':
            return 'destructive';
        default:
            return 'secondary';
    }
};

const getStatusIcon = (statut: string) => {
    switch (statut) {
        case 'payee':
            return <CheckCircle className="h-4 w-4" />;
        case 'envoyee':
            return <Clock className="h-4 w-4" />;
        case 'en_retard':
            return <AlertCircle className="h-4 w-4" />;
        case 'annulee':
            return <XCircle className="h-4 w-4" />;
        default:
            return <FileText className="h-4 w-4" />;
    }
};

const formatStatut = (statut: string) => {
    switch (statut) {
        case 'brouillon':
            return 'Brouillon';
        case 'envoyee':
            return 'Envoyée';
        case 'payee':
            return 'Payée';
        case 'en_retard':
            return 'En retard';
        case 'annulee':
            return 'Annulée';
        default:
            return statut;
    }
};

export default function FacturesIndex({ factures }: Props) {
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        facture: Facture | null;
    }>({ isOpen: false, facture: null });

    const openDeleteDialog = (facture: Facture) => {
        setDeleteDialog({ isOpen: true, facture });
    };

    const closeDeleteDialog = () => {
        setDeleteDialog({ isOpen: false, facture: null });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const isRetard = (dateEcheance: string, statut: string) => {
        return new Date(dateEcheance) < new Date() &&
               !['payee', 'annulee'].includes(statut);
    };

    const getStatutColor = (statut: string) => {
        switch (statut) {
            case 'brouillon':
                return 'bg-gray-100 text-gray-800';
            case 'envoyee':
                return 'bg-blue-100 text-blue-800';
            case 'payee':
                return 'bg-green-100 text-green-800';
            case 'en_retard':
                return 'bg-red-100 text-red-800';
            case 'annulee':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatutLabel = (statut: string) => {
        switch (statut) {
            case 'brouillon':
                return 'Brouillon';
            case 'envoyee':
                return 'Envoyée';
            case 'payee':
                return 'Payée';
            case 'en_retard':
                return 'En retard';
            case 'annulee':
                return 'Annulée';
            default:
                return statut;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Factures" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Factures</h1>
                        <p className="text-muted-foreground">
                            Gérez vos factures clients
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/factures/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Nouvelle facture
                        </Link>
                    </Button>
                </div>

                {factures.length === 0 ? (
                    <Card className="flex-1">
                        <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px]">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Vous n'avez pas encore créé de factures.<br />
                                Créez votre première facture pour commencer.
                            </p>
                            <Button asChild>
                                <Link href="/factures/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Créer une facture
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {/* Statistiques */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {factures.filter(f => f.statut === 'envoyee').length}
                                    </div>
                                    <p className="text-sm text-muted-foreground">Envoyées</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-green-600">
                                        {factures.filter(f => f.statut === 'payee').length}
                                    </div>
                                    <p className="text-sm text-muted-foreground">Payées</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-red-600">
                                        {factures.filter(f => f.statut === 'en_retard').length}
                                    </div>
                                    <p className="text-sm text-muted-foreground">En retard</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold">
                                        {formatPrice(factures.reduce((sum, f) => sum + f.montant_ttc, 0))}
                                    </div>
                                    <p className="text-sm text-muted-foreground">Total</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Liste des factures */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Toutes les factures</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-2">Numéro</th>
                                                <th className="text-left p-2">Client</th>
                                                <th className="text-left p-2">Objet</th>
                                                <th className="text-left p-2">Date</th>
                                                <th className="text-left p-2">Échéance</th>
                                                <th className="text-left p-2">Montant</th>
                                                <th className="text-left p-2">Statut</th>
                                                <th className="text-left p-2">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {factures.map((facture) => (
                                                <tr key={facture.id} className="border-b hover:bg-muted/50">
                                                    <td className="p-2">
                                                        <Link
                                                            href={`/factures/${facture.id}`}
                                                            className="font-medium hover:underline"
                                                        >
                                                            {facture.numero_facture}
                                                        </Link>
                                                    </td>
                                                    <td className="p-2">
                                                        <div>
                                                            <div className="font-medium">
                                                                {facture.client.prenom} {facture.client.nom}
                                                            </div>
                                                            {facture.client.entreprise && (
                                                                <div className="text-sm text-muted-foreground">
                                                                    {facture.client.entreprise.nom_commercial || facture.client.entreprise.nom}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="max-w-[200px] truncate" title={facture.objet}>
                                                            {facture.objet}
                                                        </div>
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {formatDate(facture.date_facture)}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {formatDate(facture.date_echeance)}
                                                    </td>
                                                    <td className="p-2 font-medium">
                                                        {formatPrice(facture.montant_ttc)}
                                                    </td>
                                                    <td className="p-2">
                                                        <Badge className={getStatutColor(facture.statut)}>
                                                            {getStatutLabel(facture.statut)}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="ghost" size="sm" asChild>
                                                                <Link href={`/factures/${facture.id}`}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            {facture.statut === 'brouillon' && (
                                                                <Button variant="ghost" size="sm" asChild>
                                                                    <Link href={`/factures/${facture.id}/edit`}>
                                                                        <Edit className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            )}
                                                            <Button variant="ghost" size="sm">
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <DeleteConfirmationDialog
                    isOpen={deleteDialog.isOpen}
                    onClose={closeDeleteDialog}
                    title="Supprimer la facture"
                    description="Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible."
                    itemName={deleteDialog.facture?.numero_facture || ''}
                    deleteUrl={`/factures/${deleteDialog.facture?.id}`}
                />
            </div>
        </AppLayout>
    );
}
