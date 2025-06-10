import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Building2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Entreprises',
        href: '/entreprises',
    },
];

interface Entreprise {
    id: number;
    nom: string;
    nom_commercial?: string;
    secteur_activite?: string;
    ville?: string;
    telephone?: string;
    email?: string;
    active: boolean;
    nombre_employes?: number;
    clients_count?: number;
    created_at: string;
}

interface Props {
    entreprises: Entreprise[];
}

export default function EntreprisesIndex({ entreprises }: Props) {
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        entreprise: Entreprise | null;
    }>({ isOpen: false, entreprise: null });

    const openDeleteDialog = (entreprise: Entreprise) => {
        setDeleteDialog({ isOpen: true, entreprise });
    };

    const closeDeleteDialog = () => {
        setDeleteDialog({ isOpen: false, entreprise: null });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Entreprises" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Entreprises</h1>
                        <p className="text-muted-foreground">
                            Gérez vos entreprises clientes
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/entreprises/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Nouvelle entreprise
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Liste des entreprises ({entreprises.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {entreprises.map((entreprise) => (
                                <div key={entreprise.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-medium">
                                                {entreprise.nom_commercial || entreprise.nom}
                                            </h3>
                                            <Badge variant={entreprise.active ? 'default' : 'secondary'}>
                                                {entreprise.active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            {entreprise.email && <div>📧 {entreprise.email}</div>}
                                            <div className="flex items-center gap-4">
                                                {entreprise.secteur_activite && (
                                                    <span>🏭 {entreprise.secteur_activite}</span>
                                                )}
                                                {entreprise.ville && <span>📍 {entreprise.ville}</span>}
                                                {entreprise.telephone && <span>📞 {entreprise.telephone}</span>}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs">
                                                {entreprise.nombre_employes && (
                                                    <span>👥 {entreprise.nombre_employes} employés</span>
                                                )}
                                                {entreprise.clients_count !== undefined && (
                                                    <span>🤝 {entreprise.clients_count} clients</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={`/entreprises/${entreprise.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={`/entreprises/${entreprise.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openDeleteDialog(entreprise)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {entreprises.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-muted-foreground">
                                        <Building2 className="mx-auto h-12 w-12 mb-4" />
                                        <h3 className="font-medium mb-2">Aucune entreprise</h3>
                                        <p>Commencez par ajouter votre première entreprise</p>
                                    </div>
                                    <Button asChild className="mt-4">
                                        <Link href="/entreprises/create">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Créer une entreprise
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {deleteDialog.entreprise && (
                    <DeleteConfirmationDialog
                        isOpen={deleteDialog.isOpen}
                        onClose={closeDeleteDialog}
                        title="Supprimer l'entreprise"
                        description="Êtes-vous sûr de vouloir supprimer cette entreprise ? Cette action est irréversible."
                        itemName={deleteDialog.entreprise.nom_commercial || deleteDialog.entreprise.nom}
                        deleteUrl={`/entreprises/${deleteDialog.entreprise.id}`}
                    />
                )}
            </div>
        </AppLayout>
    );
}
