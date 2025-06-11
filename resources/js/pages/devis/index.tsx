import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, FileText, CheckCircle, XCircle, Clock, AlertCircle, Mail, MailCheck, MailX, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Devis',
        href: '/devis',
    },
];

interface Devis {
    id: number;
    numero_devis: string;
    objet: string;
    statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
    statut_envoi: 'non_envoye' | 'envoye' | 'echec_envoi';
    date_devis: string;
    date_validite: string;
    date_envoi_client?: string;
    date_envoi_admin?: string;
    montant_ttc: number;
    peut_etre_envoye?: boolean;
    client: {
        nom: string;
        prenom: string;
        email: string;
        entreprise?: {
            nom: string;
            nom_commercial?: string;
        };
    };
    created_at: string;
}

interface Props {
    devis: Devis[];
}

const getStatusStyles = (statut: string) => {
    switch (statut) {
        case 'accepte':
            return 'bg-green-600 text-white hover:bg-green-700';
        case 'envoye':
            return 'bg-blue-600 text-white hover:bg-blue-700';
        case 'refuse':
            return 'bg-red-600 text-white hover:bg-red-700';
        case 'expire':
            return 'bg-orange-600 text-white hover:bg-orange-700';
        case 'brouillon':
            return 'bg-gray-600 text-white hover:bg-gray-700';
        default:
            return 'bg-gray-600 text-white hover:bg-gray-700';
    }
};

const getStatusIcon = (statut: string) => {
    switch (statut) {
        case 'accepte':
            return <CheckCircle className="h-4 w-4" />;
        case 'envoye':
            return <Clock className="h-4 w-4" />;
        case 'refuse':
            return <XCircle className="h-4 w-4" />;
        case 'expire':
            return <AlertCircle className="h-4 w-4" />;
        default:
            return <FileText className="h-4 w-4" />;
    }
};

const formatStatut = (statut: string) => {
    switch (statut) {
        case 'brouillon':
            return 'Brouillon';
        case 'envoye':
            return 'Envoyé';
        case 'accepte':
            return 'Accepté';
        case 'refuse':
            return 'Refusé';
        case 'expire':
            return 'Expiré';
        default:
            return statut;
    }
};

const getStatusEnvoiStyles = (statutEnvoi: string) => {
    switch (statutEnvoi) {
        case 'envoye':
            return 'bg-emerald-600 text-white hover:bg-emerald-700';
        case 'echec_envoi':
            return 'bg-red-600 text-white hover:bg-red-700';
        case 'non_envoye':
            return 'bg-amber-600 text-white hover:bg-amber-700';
        default:
            return 'bg-gray-600 text-white hover:bg-gray-700';
    }
};

const getStatusEnvoiIcon = (statutEnvoi: string) => {
    switch (statutEnvoi) {
        case 'envoye':
            return <MailCheck className="h-3 w-3" />;
        case 'echec_envoi':
            return <MailX className="h-3 w-3" />;
        default:
            return <Mail className="h-3 w-3" />;
    }
};

const formatStatutEnvoi = (statutEnvoi: string) => {
    switch (statutEnvoi) {
        case 'non_envoye':
            return 'Non envoyé';
        case 'envoye':
            return 'Envoyé';
        case 'echec_envoi':
            return 'Échec envoi';
        default:
            return statutEnvoi;
    }
};

export default function DevisIndex({ devis }: Props) {
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        devis: Devis | null;
    }>({ isOpen: false, devis: null });

    const openDeleteDialog = (devisItem: Devis) => {
        setDeleteDialog({ isOpen: true, devis: devisItem });
    };

    const closeDeleteDialog = () => {
        setDeleteDialog({ isOpen: false, devis: null });
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Devis" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Devis</h1>
                        <p className="text-muted-foreground">
                            Gérez vos devis et propositions commerciales
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/devis/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Nouveau devis
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Liste des devis ({devis.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {devis.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-medium">{item.numero_devis}</h3>
                                            <Badge className={`${getStatusStyles(item.statut)} border-0`}>
                                                <span className="flex items-center gap-1">
                                                    {getStatusIcon(item.statut)}
                                                    {formatStatut(item.statut)}
                                                </span>
                                            </Badge>
                                            <Badge className={`${getStatusEnvoiStyles(item.statut_envoi)} border-0 text-xs`}>
                                                <span className="flex items-center gap-1">
                                                    {getStatusEnvoiIcon(item.statut_envoi)}
                                                    {formatStatutEnvoi(item.statut_envoi)}
                                                </span>
                                            </Badge>
                                        </div>
                                        <div className="text-sm font-medium text-foreground">
                                            {item.objet}
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div>
                                                👤 {item.client.prenom} {item.client.nom}
                                                {item.client.entreprise && (
                                                    <span className="ml-2">
                                                        🏢 {item.client.entreprise.nom_commercial || item.client.entreprise.nom}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span>📅 {formatDate(item.date_devis)}</span>
                                                <span>⏰ Expire le {formatDate(item.date_validite)}</span>
                                                {item.date_envoi_client && (
                                                    <span>📧 Envoyé le {formatDate(item.date_envoi_client)}</span>
                                                )}
                                                <span className="font-medium">{formatPrice(item.montant_ttc)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {item.peut_etre_envoye && (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className={`${item.statut_envoi === 'envoye' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                asChild
                                                title={item.statut_envoi === 'envoye' ? 'Renvoyer par email' : 'Envoyer par email'}
                                            >
                                                <Link href={`/devis/${item.id}/envoyer-email`}>
                                                    {item.statut_envoi === 'envoye' ?
                                                        <RefreshCw className="h-4 w-4" /> :
                                                        <Mail className="h-4 w-4" />
                                                    }
                                                </Link>
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={`/devis/${item.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={`/devis/${item.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openDeleteDialog(item)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {devis.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-muted-foreground">
                                        <FileText className="mx-auto h-12 w-12 mb-4" />
                                        <h3 className="font-medium mb-2">Aucun devis</h3>
                                        <p>Commencez par créer votre premier devis</p>
                                    </div>
                                    <Button asChild className="mt-4">
                                        <Link href="/devis/create">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Créer un devis
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {deleteDialog.devis && (
                    <DeleteConfirmationDialog
                        isOpen={deleteDialog.isOpen}
                        onClose={closeDeleteDialog}
                        title="Supprimer le devis"
                        description="Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible."
                        itemName={deleteDialog.devis.numero_devis}
                        deleteUrl={`/devis/${deleteDialog.devis.id}`}
                    />
                )}
            </div>
        </AppLayout>
    );
}
