import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Users, Search, Filter, Download, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

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
    const [selectedClients, setSelectedClients] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [cityFilter, setCityFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortField, setSortField] = useState<keyof Client>('nom');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        client: Client | null;
    }>({ isOpen: false, client: null });
    const [isDeleting, setIsDeleting] = useState(false);

    // Obtenir les villes uniques pour le filtre
    const uniqueCities = useMemo(() => {
        const cities = clients
            .map(client => client.ville)
            .filter((ville): ville is string => Boolean(ville))
            .filter((ville, index, array) => array.indexOf(ville) === index)
            .sort();
        return cities;
    }, [clients]);

    // Filtrer et trier les clients
    const filteredAndSortedClients = useMemo(() => {
        let filtered = clients.filter(client => {
            const matchesSearch =
                client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (client.telephone && client.telephone.includes(searchTerm)) ||
                (client.ville && client.ville.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (client.entreprise && (
                    client.entreprise.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (client.entreprise.nom_commercial && client.entreprise.nom_commercial.toLowerCase().includes(searchTerm.toLowerCase()))
                ));

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && client.actif) ||
                (statusFilter === 'inactive' && !client.actif);

            const matchesCity =
                cityFilter === 'all' || client.ville === cityFilter;

            return matchesSearch && matchesStatus && matchesCity;
        });

        // Tri
        filtered.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            if (sortField === 'nom' || sortField === 'prenom') {
                aValue = (aValue as string).toLowerCase();
                bValue = (bValue as string).toLowerCase();
            }

            // Gérer les valeurs undefined/null
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
            if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [clients, searchTerm, statusFilter, cityFilter, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage);
    const paginatedClients = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedClients.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedClients, currentPage, itemsPerPage]);

    // Gestion de la sélection
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedClients(paginatedClients.map(client => client.id));
        } else {
            setSelectedClients([]);
        }
    };

    const handleSelectClient = (clientId: number, checked: boolean) => {
        if (checked) {
            setSelectedClients(prev => [...prev, clientId]);
        } else {
            setSelectedClients(prev => prev.filter(id => id !== clientId));
        }
    };

    const isAllSelected = paginatedClients.length > 0 && selectedClients.length === paginatedClients.length;
    const isIndeterminate = selectedClients.length > 0 && selectedClients.length < paginatedClients.length;

    // Gestion du tri
    const handleSort = (field: keyof Client) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Gestion de la suppression
    const openDeleteDialog = (client: Client) => {
        setDeleteDialog({ isOpen: true, client });
    };

    const closeDeleteDialog = () => {
        setDeleteDialog({ isOpen: false, client: null });
    };

    const handleDeleteClient = async (deleteUrl: string, onClose: () => void) => {
        setIsDeleting(true);
        router.delete(deleteUrl, {
            onSuccess: () => {
                setIsDeleting(false);
                onClose();
                toast.success('Client supprimé avec succès');
            },
            onError: () => {
                setIsDeleting(false);
                toast.error('Une erreur est survenue lors de la suppression du client');
            }
        });
    };

    // Suppression multiple
    const handleDeleteSelected = () => {
        if (selectedClients.length === 0) return;

        // Ici vous pourriez ouvrir un dialog de confirmation pour la suppression multiple
        toast.info(`${selectedClients.length} client(s) sélectionné(s) pour suppression`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />

            <div className="page-container">
                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title">Clients</h1>
                        <p className="text-muted-foreground">
                            Gérez vos clients et leurs informations
                        </p>
                    </div>
                    <div className="form-actions">
                        {selectedClients.length > 0 && (
                            <>
                                <Button variant="outline" size="sm" onClick={handleDeleteSelected} className="btn-icon">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer ({selectedClients.length})
                                </Button>
                                <Button variant="outline" size="sm" className="btn-icon">
                                    <Download className="mr-2 h-4 w-4" />
                                    Exporter
                                </Button>
                            </>
                        )}
                        <Button asChild className="btn-icon">
                            <Link href="/clients/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Nouveau client
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Filtres et recherche */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="form-row sm:justify-between">
                            <CardTitle className="section-title">
                                <Filter className="section-icon" />
                                Filtres & Recherche
                            </CardTitle>
                            <div className="form-actions">
                                <div className="input-with-icon">
                                    <Search className="input-icon-left" />
                                    <Input
                                        placeholder="Rechercher des clients..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input-with-left-icon w-full sm:w-[300px]"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                                    <SelectTrigger className="w-full sm:w-[140px]">
                                        <SelectValue placeholder="Statut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous</SelectItem>
                                        <SelectItem value="active">Actifs</SelectItem>
                                        <SelectItem value="inactive">Inactifs</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={cityFilter} onValueChange={setCityFilter}>
                                    <SelectTrigger className="w-full sm:w-[140px]">
                                        <SelectValue placeholder="Ville" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes</SelectItem>
                                        {uniqueCities.map(city => (
                                            <SelectItem key={city} value={city}>{city}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Tableau */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Liste des clients ({filteredAndSortedClients.length} résultat{filteredAndSortedClients.length > 1 ? 's' : ''})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-md border table-responsive">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={isAllSelected}
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Sélectionner tous"
                                                {...(isIndeterminate && { 'data-indeterminate': true })}
                                            />
                                        </TableHead>
                                        <TableHead className="cursor-pointer sort-button" onClick={() => handleSort('nom')}>
                                            <div className="flex items-center gap-2">
                                                Nom
                                                <ArrowUpDown className="h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer sort-button" onClick={() => handleSort('email')}>
                                            <div className="flex items-center gap-2">
                                                Email
                                                <ArrowUpDown className="h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Téléphone</TableHead>
                                        <TableHead>Ville</TableHead>
                                        <TableHead>Entreprise</TableHead>
                                        <TableHead className="cursor-pointer sort-button" onClick={() => handleSort('actif')}>
                                            <div className="flex items-center gap-2">
                                                Statut
                                                <ArrowUpDown className="h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                                                        {paginatedClients.map((client) => (
                                        <TableRow
                                            key={client.id}
                                            data-state={selectedClients.includes(client.id) ? "selected" : undefined}
                                            className="group"
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedClients.includes(client.id)}
                                                    onCheckedChange={(checked) => handleSelectClient(client.id, checked as boolean)}
                                                    aria-label={`Sélectionner ${client.prenom} ${client.nom}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={`/clients/${client.id}`}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                >
                                                    {client.prenom} {client.nom}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{client.email}</TableCell>
                                            <TableCell>{client.telephone || '-'}</TableCell>
                                            <TableCell>{client.ville || '-'}</TableCell>
                                            <TableCell>
                                                {client.entreprise ? (
                                                    client.entreprise.nom_commercial || client.entreprise.nom
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                                                <Badge className={client.actif ? 'badge-success' : 'badge-neutral'}>
                                    {client.actif ? 'Actif' : 'Inactif'}
                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 table-actions">
                                                    <Button size="sm" variant="ghost" asChild>
                                                        <Link href={`/clients/${client.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button size="sm" variant="ghost" asChild>
                                                        <Link href={`/clients/${client.id}/edit`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openDeleteDialog(client)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {paginatedClients.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="empty-state">
                                                <Users className="empty-state-icon" />
                                                <h3 className="font-medium mb-2">Aucun client trouvé</h3>
                                                <p>Aucun client ne correspond à vos critères de recherche</p>
                                                <Button asChild className="mt-4">
                                                    <Link href="/clients/create">
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Créer un client
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-4 border-t">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-muted-foreground">
                                        Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredAndSortedClients.length)} sur {filteredAndSortedClients.length} résultats
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                                        setItemsPerPage(Number(value));
                                        setCurrentPage(1);
                                    }}>
                                        <SelectTrigger className="w-[70px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">5</SelectItem>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="pagination-button"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Précédent
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                            if (page > totalPages) return null;
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(page)}
                                                    className="w-8 pagination-button"
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="pagination-button"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Suivant
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dialog de suppression */}
                {deleteDialog.isOpen && deleteDialog.client !== null && (
                    <DeleteConfirmationDialog
                        isOpen={deleteDialog.isOpen}
                        onClose={closeDeleteDialog}
                        title="Supprimer le client"
                        description="Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible."
                        itemName={`${deleteDialog.client!.prenom} ${deleteDialog.client!.nom}`}
                        deleteUrl={`/clients/${deleteDialog.client!.id}`}
                        isDeleting={isDeleting}
                        onDelete={() => handleDeleteClient(`/clients/${deleteDialog.client!.id}`, closeDeleteDialog)}
                    />
                )}
            </div>
        </AppLayout>
    );
}
