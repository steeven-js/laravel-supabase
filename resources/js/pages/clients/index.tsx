import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Clients',
        href: '/clients',
    },
];

interface Client {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    ville?: string;
    actif: boolean;
    entreprise?: {
        nom: string;
        nom_commercial?: string;
    };
    created_at: string;
}

interface Props {
    clients: Client[];
}

export default function ClientsIndex({ clients }: Props) {
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        client: Client | null;
    }>({ isOpen: false, client: null });

    const openDeleteDialog = (client: Client) => {
        setDeleteDialog({ isOpen: true, client });
    };

    const closeDeleteDialog = () => {
        setDeleteDialog({ isOpen: false, client: null });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Clients</h1>
                        <p className="text-muted-foreground">
                            Gérez vos clients et leurs informations
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/clients/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Nouveau client
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Liste des clients ({clients.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {clients.map((client) => (
                                <div key={client.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-medium">{client.prenom} {client.nom}</h3>
                                            <Badge variant={client.actif ? 'default' : 'secondary'}>
                                                {client.actif ? 'Actif' : 'Inactif'}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div>{client.email}</div>
                                            <div className="flex items-center gap-4">
                                                {client.telephone && <span>📞 {client.telephone}</span>}
                                                {client.ville && <span>📍 {client.ville}</span>}
                                                {client.entreprise && (
                                                    <span>🏢 {client.entreprise.nom_commercial || client.entreprise.nom}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={`/clients/${client.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={`/clients/${client.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openDeleteDialog(client)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {clients.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-muted-foreground">
                                        <Users className="mx-auto h-12 w-12 mb-4" />
                                        <h3 className="font-medium mb-2">Aucun client</h3>
                                        <p>Commencez par créer votre premier client</p>
                                    </div>
                                    <Button asChild className="mt-4">
                                        <Link href="/clients/create">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Créer un client
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {deleteDialog.client && (
                    <DeleteConfirmationDialog
                        isOpen={deleteDialog.isOpen}
                        onClose={closeDeleteDialog}
                        title="Supprimer le client"
                        description="Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible."
                        itemName={`${deleteDialog.client.prenom} ${deleteDialog.client.nom}`}
                        deleteUrl={`/clients/${deleteDialog.client.id}`}
                    />
                )}
            </div>
        </AppLayout>
    );
}
