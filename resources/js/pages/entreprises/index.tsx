import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Building2, Search, Filter, Download, ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

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

    clients_count?: number;
    created_at: string;
}

interface Props {
    entreprises: Entreprise[];
}

export default function EntreprisesIndex({ entreprises }: Props) {
    const [selectedEntreprises, setSelectedEntreprises] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [secteurFilter, setSecteurFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortField, setSortField] = useState<keyof Entreprise>('nom');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        entreprise: Entreprise | null;
    }>({ isOpen: false, entreprise: null });
    const [isDeleting, setIsDeleting] = useState(false);

    // Obtenir les secteurs uniques pour le filtre
    const uniqueSecteurs = useMemo(() => {
        const secteurs = entreprises
            .map(entreprise => entreprise.secteur_activite)
            .filter((secteur): secteur is string => Boolean(secteur))
            .filter((secteur, index, array) => array.indexOf(secteur) === index)
            .sort();
        return secteurs;
    }, [entreprises]);

    // Filtrer et trier les entreprises
    const filteredAndSortedEntreprises = useMemo(() => {
        let filtered = entreprises.filter(entreprise => {
            const matchesSearch =
                entreprise.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (entreprise.nom_commercial && entreprise.nom_commercial.toLowerCase().includes(searchTerm.toLowerCase())) ||
                entreprise.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (entreprise.telephone && entreprise.telephone.includes(searchTerm)) ||
                (entreprise.ville && entreprise.ville.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (entreprise.secteur_activite && entreprise.secteur_activite.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && entreprise.active) ||
                (statusFilter === 'inactive' && !entreprise.active);

            const matchesSecteur =
                secteurFilter === 'all' || entreprise.secteur_activite === secteurFilter;

            return matchesSearch && matchesStatus && matchesSecteur;
        });

        // Tri
        filtered.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            if (sortField === 'nom' || sortField === 'nom_commercial') {
                aValue = (aValue as string)?.toLowerCase() || '';
                bValue = (bValue as string)?.toLowerCase() || '';
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
    }, [entreprises, searchTerm, statusFilter, secteurFilter, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedEntreprises.length / itemsPerPage);
    const paginatedEntreprises = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedEntreprises.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedEntreprises, currentPage, itemsPerPage]);

    // Gestion de la sélection
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedEntreprises(paginatedEntreprises.map(entreprise => entreprise.id));
        } else {
            setSelectedEntreprises([]);
        }
    };

    const handleSelectEntreprise = (entrepriseId: number, checked: boolean) => {
        if (checked) {
            setSelectedEntreprises(prev => [...prev, entrepriseId]);
        } else {
            setSelectedEntreprises(prev => prev.filter(id => id !== entrepriseId));
        }
    };

    const isAllSelected = paginatedEntreprises.length > 0 && selectedEntreprises.length === paginatedEntreprises.length;
    const isIndeterminate = selectedEntreprises.length > 0 && selectedEntreprises.length < paginatedEntreprises.length;

    // Gestion du tri
    const handleSort = (field: keyof Entreprise) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Gestion de la suppression
    const openDeleteDialog = (entreprise: Entreprise) => {
        setDeleteDialog({ isOpen: true, entreprise });
    };

    const closeDeleteDialog = () => {
        setDeleteDialog({ isOpen: false, entreprise: null });
    };

    const handleDeleteEntreprise = async (deleteUrl: string, onClose: () => void) => {
        setIsDeleting(true);
        router.delete(deleteUrl, {
            onSuccess: () => {
                setIsDeleting(false);
                onClose();
                toast.success('Entreprise supprimée avec succès');
            },
            onError: () => {
                setIsDeleting(false);
                toast.error('Une erreur est survenue lors de la suppression de l\'entreprise');
            }
        });
    };

    // Suppression multiple
    const handleDeleteSelected = () => {
        if (selectedEntreprises.length === 0) return;

        // Ici vous pourriez ouvrir un dialog de confirmation pour la suppression multiple
        toast.info(`${selectedEntreprises.length} entreprise(s) sélectionnée(s) pour suppression`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Entreprises" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Entreprises</h1>
                        <p className="text-muted-foreground">
                            Gérez vos entreprises et leurs informations
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedEntreprises.length > 0 && (
                            <>
                                <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer ({selectedEntreprises.length})
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Exporter
                                </Button>
                            </>
                        )}
                        <Button asChild>
                            <Link href="/entreprises/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Nouvelle entreprise
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Filtres et recherche */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filtres & Recherche
                            </CardTitle>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Rechercher des entreprises..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 w-full sm:w-[300px]"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                                    <SelectTrigger className="w-full sm:w-[140px]">
                                        <SelectValue placeholder="Statut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous</SelectItem>
                                        <SelectItem value="active">Actives</SelectItem>
                                        <SelectItem value="inactive">Inactives</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={secteurFilter} onValueChange={setSecteurFilter}>
                                    <SelectTrigger className="w-full sm:w-[140px]">
                                        <SelectValue placeholder="Secteur" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous</SelectItem>
                                        {uniqueSecteurs.map(secteur => (
                                            <SelectItem key={secteur} value={secteur}>{secteur}</SelectItem>
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
                            Liste des entreprises ({filteredAndSortedEntreprises.length} résultat{filteredAndSortedEntreprises.length > 1 ? 's' : ''})
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
                                                Entreprise
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
                                        <TableHead>Secteur</TableHead>

                                        <TableHead className="cursor-pointer sort-button" onClick={() => handleSort('active')}>
                                            <div className="flex items-center gap-2">
                                                Statut
                                                <ArrowUpDown className="h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedEntreprises.map((entreprise) => (
                                        <TableRow
                                            key={entreprise.id}
                                            data-state={selectedEntreprises.includes(entreprise.id) ? "selected" : undefined}
                                            className="group"
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedEntreprises.includes(entreprise.id)}
                                                    onCheckedChange={(checked) => handleSelectEntreprise(entreprise.id, checked as boolean)}
                                                    aria-label={`Sélectionner ${entreprise.nom_commercial || entreprise.nom}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {entreprise.nom_commercial || entreprise.nom}
                                                {entreprise.nom_commercial && (
                                                    <div className="text-sm text-muted-foreground">{entreprise.nom}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>{entreprise.email || '-'}</TableCell>
                                            <TableCell>{entreprise.telephone || '-'}</TableCell>
                                            <TableCell>{entreprise.ville || '-'}</TableCell>
                                            <TableCell>{entreprise.secteur_activite || '-'}</TableCell>

                                            <TableCell>
                                                <Badge variant={entreprise.active ? 'default' : 'secondary'}>
                                                    {entreprise.active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 table-actions">
                                                    <Button size="sm" variant="ghost" asChild>
                                                        <Link href={`/entreprises/${entreprise.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button size="sm" variant="ghost" asChild>
                                                        <Link href={`/entreprises/${entreprise.id}/edit`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openDeleteDialog(entreprise)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {paginatedEntreprises.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-12">
                                                <div className="text-muted-foreground">
                                                    <Building2 className="mx-auto h-12 w-12 mb-4" />
                                                    <h3 className="font-medium mb-2">Aucune entreprise trouvée</h3>
                                                    <p>Aucune entreprise ne correspond à vos critères de recherche</p>
                                                </div>
                                                <Button asChild className="mt-4">
                                                    <Link href="/entreprises/create">
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Créer une entreprise
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
                                        Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredAndSortedEntreprises.length)} sur {filteredAndSortedEntreprises.length} résultats
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
