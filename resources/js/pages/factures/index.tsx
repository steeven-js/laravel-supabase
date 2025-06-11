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
import { Plus, Eye, Edit, Trash2, Receipt, CheckCircle, XCircle, Clock, AlertCircle, FileText, Download, Search, Filter, ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

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
    statut: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee';
    date_facture: string;
    date_echeance: string;
    montant_ttc: number;
    created_at: string;
}

interface Props {
    factures: Facture[];
}

const getStatusStyles = (statut: string) => {
    switch (statut) {
        case 'payee':
            return 'bg-green-600 text-white hover:bg-green-700';
        case 'envoyee':
            return 'bg-blue-600 text-white hover:bg-blue-700';
        case 'en_retard':
            return 'bg-red-600 text-white hover:bg-red-700';
        case 'annulee':
            return 'bg-gray-600 text-white hover:bg-gray-700';
        case 'brouillon':
            return 'bg-yellow-600 text-white hover:bg-yellow-700';
        default:
            return 'bg-gray-600 text-white hover:bg-gray-700';
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
        case 'brouillon':
            return <FileText className="h-4 w-4" />;
        default:
            return <Receipt className="h-4 w-4" />;
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
    const [selectedFactures, setSelectedFactures] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortField, setSortField] = useState<keyof Facture>('date_facture');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        facture: Facture | null;
    }>({ isOpen: false, facture: null });
    const [isDeleting, setIsDeleting] = useState(false);

    // Filtrer et trier les factures
    const filteredAndSortedFactures = useMemo(() => {
        let filtered = factures.filter(item => {
            const matchesSearch =
                item.numero_facture.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.client.entreprise && (
                    item.client.entreprise.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (item.client.entreprise.nom_commercial && item.client.entreprise.nom_commercial.toLowerCase().includes(searchTerm.toLowerCase()))
                ));

            const matchesStatus =
                statusFilter === 'all' || item.statut === statusFilter;

            return matchesSearch && matchesStatus;
        });

        // Tri
        filtered.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            if (sortField === 'numero_facture' || sortField === 'objet') {
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
    }, [factures, searchTerm, statusFilter, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedFactures.length / itemsPerPage);
    const paginatedFactures = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedFactures.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedFactures, currentPage, itemsPerPage]);

    // Gestion de la sélection
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedFactures(paginatedFactures.map(item => item.id));
        } else {
            setSelectedFactures([]);
        }
    };

    const handleSelectFacture = (factureId: number, checked: boolean) => {
        if (checked) {
            setSelectedFactures(prev => [...prev, factureId]);
        } else {
            setSelectedFactures(prev => prev.filter(id => id !== factureId));
        }
    };

    const isAllSelected = paginatedFactures.length > 0 && selectedFactures.length === paginatedFactures.length;
    const isIndeterminate = selectedFactures.length > 0 && selectedFactures.length < paginatedFactures.length;

    // Gestion du tri
    const handleSort = (field: keyof Facture) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Gestion de la suppression
    const openDeleteDialog = (facture: Facture) => {
        setDeleteDialog({ isOpen: true, facture });
    };

    const closeDeleteDialog = () => {
        setDeleteDialog({ isOpen: false, facture: null });
    };

    const handleDeleteFacture = async (deleteUrl: string, onClose: () => void) => {
        setIsDeleting(true);
        router.delete(deleteUrl, {
            onSuccess: () => {
                setIsDeleting(false);
                onClose();
                toast.success('Facture supprimée avec succès');
            },
            onError: () => {
                setIsDeleting(false);
                toast.error('Une erreur est survenue lors de la suppression de la facture');
            }
        });
    };

    // Suppression multiple
    const handleDeleteSelected = () => {
        if (selectedFactures.length === 0) return;
        toast.info(`${selectedFactures.length} facture(s) sélectionnée(s) pour suppression`);
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Factures" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Factures</h1>
                        <p className="text-muted-foreground">
                            Gérez vos factures clients et suivez les paiements
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedFactures.length > 0 && (
                            <>
                                <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer ({selectedFactures.length})
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Exporter
                                </Button>
                            </>
                        )}
                        <Button asChild>
                            <Link href="/factures/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Nouvelle facture
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Factures envoyées</p>
                                    <div className="text-3xl font-bold text-blue-600">
                                        {factures.filter(f => f.statut === 'envoyee').length}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {factures.length > 0 ? Math.round((factures.filter(f => f.statut === 'envoyee').length / factures.length) * 100) : 0}% du total
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Factures payées</p>
                                    <div className="text-3xl font-bold text-green-600">
                                        {factures.filter(f => f.statut === 'payee').length}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {factures.length > 0 ? Math.round((factures.filter(f => f.statut === 'payee').length / factures.length) * 100) : 0}% du total
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Factures en retard</p>
                                    <div className="text-3xl font-bold text-red-600">
                                        {factures.filter(f => f.statut === 'en_retard').length}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {factures.length > 0 ? Math.round((factures.filter(f => f.statut === 'en_retard').length / factures.length) * 100) : 0}% du total
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Chiffre d'affaires</p>
                                    <div className="text-3xl font-bold text-purple-600">
                                        {formatPrice(factures.filter(f => f.montant_ttc != null).reduce((sum, f) => sum + (f.montant_ttc || 0), 0))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatPrice(factures.filter(f => f.statut === 'payee' && f.montant_ttc != null).reduce((sum, f) => sum + (f.montant_ttc || 0), 0))} encaissé
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                    <Receipt className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
                        </CardContent>
                    </Card>
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
                                        placeholder="Rechercher des factures..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 w-full sm:w-[300px]"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={(value: 'all' | 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee') => setStatusFilter(value)}>
                                    <SelectTrigger className="w-full sm:w-[140px]">
                                        <SelectValue placeholder="Statut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous</SelectItem>
                                        <SelectItem value="brouillon">Brouillon</SelectItem>
                                        <SelectItem value="envoyee">Envoyée</SelectItem>
                                        <SelectItem value="payee">Payée</SelectItem>
                                        <SelectItem value="en_retard">En retard</SelectItem>
                                        <SelectItem value="annulee">Annulée</SelectItem>
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
                            Liste des factures ({filteredAndSortedFactures.length} résultat{filteredAndSortedFactures.length > 1 ? 's' : ''})
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
                                        <TableHead className="cursor-pointer sort-button" onClick={() => handleSort('numero_facture')}>
                                            <div className="flex items-center gap-2">
                                                Numéro
                                                <ArrowUpDown className="h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead className="cursor-pointer sort-button" onClick={() => handleSort('objet')}>
                                            <div className="flex items-center gap-2">
                                                Objet
                                                <ArrowUpDown className="h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer sort-button" onClick={() => handleSort('statut')}>
                                            <div className="flex items-center gap-2">
                                                Statut
                                                <ArrowUpDown className="h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer sort-button" onClick={() => handleSort('date_facture')}>
                                            <div className="flex items-center gap-2">
                                                Date
                                                <ArrowUpDown className="h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Échéance</TableHead>
                                        <TableHead className="cursor-pointer sort-button" onClick={() => handleSort('montant_ttc')}>
                                            <div className="flex items-center gap-2">
                                                Montant
                                                <ArrowUpDown className="h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedFactures.map((facture) => (
                                        <TableRow
                                            key={facture.id}
                                            data-state={selectedFactures.includes(facture.id) ? "selected" : undefined}
                                            className="group"
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedFactures.includes(facture.id)}
                                                    onCheckedChange={(checked) => handleSelectFacture(facture.id, checked as boolean)}
                                                    aria-label={`Sélectionner ${facture.numero_facture}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={`/factures/${facture.id}`}
                                                    className="hover:underline"
                                                >
                                                    {facture.numero_facture}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">
                                                        {facture.client.prenom} {facture.client.nom}
                                                    </div>
                                                    {facture.client.entreprise && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {facture.client.entreprise.nom_commercial || facture.client.entreprise.nom}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px] truncate" title={facture.objet}>
                                                    {facture.objet}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${getStatusStyles(facture.statut)} border-0`}>
                                                    <span className="flex items-center gap-1">
                                                        {getStatusIcon(facture.statut)}
                                                        {formatStatut(facture.statut)}
                                                    </span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div>{formatDate(facture.date_facture)}</div>
                                                    {facture.devis && (
                                                        <div className="text-sm text-muted-foreground">
                                                            Devis: {facture.devis.numero_devis}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className={isRetard(facture.date_echeance, facture.statut) ? 'text-red-600 font-medium' : ''}>
                                                    {formatDate(facture.date_echeance)}
                                                    {isRetard(facture.date_echeance, facture.statut) && (
                                                        <div className="text-xs text-red-500">En retard</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatPrice(facture.montant_ttc)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 table-actions">
                                                    <Button size="sm" variant="ghost" asChild>
                                                        <Link href={`/factures/${facture.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    {facture.statut === 'brouillon' && (
                                                        <Button size="sm" variant="ghost" asChild>
                                                            <Link href={`/factures/${facture.id}/edit`}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" asChild>
                                                        <a href={`/factures/${facture.id}/pdf`} target="_blank" rel="noopener noreferrer">
                                                            <FileText className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                    <Button size="sm" variant="ghost" asChild>
                                                        <a href={`/factures/${facture.id}/telecharger-pdf`}>
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openDeleteDialog(facture)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {paginatedFactures.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-12">
                                                <div className="text-muted-foreground">
                                                    <Receipt className="mx-auto h-12 w-12 mb-4" />
                                                    <h3 className="font-medium mb-2">Aucune facture trouvée</h3>
                                                    <p>Aucune facture ne correspond à vos critères de recherche</p>
                                                </div>
                                                <Button asChild className="mt-4">
                                                    <Link href="/factures/create">
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Créer une facture
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
                                        Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredAndSortedFactures.length)} sur {filteredAndSortedFactures.length} résultats
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
                {deleteDialog.isOpen && deleteDialog.facture !== null && (
                    <DeleteConfirmationDialog
                        isOpen={deleteDialog.isOpen}
                        onClose={closeDeleteDialog}
                        title="Supprimer la facture"
                        description="Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible."
                        itemName={deleteDialog.facture!.numero_facture}
                        deleteUrl={`/factures/${deleteDialog.facture!.id}`}
                        isDeleting={isDeleting}
                        onDelete={() => handleDeleteFacture(`/factures/${deleteDialog.facture!.id}`, closeDeleteDialog)}
                    />
                )}
            </div>
        </AppLayout>
    );
}
