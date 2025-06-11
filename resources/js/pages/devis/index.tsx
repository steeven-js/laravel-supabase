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
import { Plus, Eye, Edit, Trash2, FileText, CheckCircle, XCircle, Clock, AlertCircle, Mail, MailCheck, MailX, RefreshCw, Search, Filter, Download, ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

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
    const [selectedDevis, setSelectedDevis] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'>('all');
    const [statusEnvoiFilter, setStatusEnvoiFilter] = useState<'all' | 'non_envoye' | 'envoye' | 'echec_envoi'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortField, setSortField] = useState<keyof Devis>('date_devis');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        devis: Devis | null;
    }>({ isOpen: false, devis: null });
    const [isDeleting, setIsDeleting] = useState(false);

    // Filtrer et trier les devis
    const filteredAndSortedDevis = useMemo(() => {
        let filtered = devis.filter(item => {
            const matchesSearch =
                item.numero_devis.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.client.entreprise && (
                    item.client.entreprise.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (item.client.entreprise.nom_commercial && item.client.entreprise.nom_commercial.toLowerCase().includes(searchTerm.toLowerCase()))
                ));

            const matchesStatus =
                statusFilter === 'all' || item.statut === statusFilter;

            const matchesStatusEnvoi =
                statusEnvoiFilter === 'all' || item.statut_envoi === statusEnvoiFilter;

            return matchesSearch && matchesStatus && matchesStatusEnvoi;
        });

        // Tri
        filtered.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            if (sortField === 'numero_devis' || sortField === 'objet') {
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
    }, [devis, searchTerm, statusFilter, statusEnvoiFilter, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedDevis.length / itemsPerPage);
    const paginatedDevis = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedDevis.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedDevis, currentPage, itemsPerPage]);

    // Gestion de la sélection
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedDevis(paginatedDevis.map(item => item.id));
        } else {
            setSelectedDevis([]);
        }
    };

    const handleSelectDevis = (devisId: number, checked: boolean) => {
        if (checked) {
            setSelectedDevis(prev => [...prev, devisId]);
        } else {
            setSelectedDevis(prev => prev.filter(id => id !== devisId));
        }
    };

    const isAllSelected = paginatedDevis.length > 0 && selectedDevis.length === paginatedDevis.length;
    const isIndeterminate = selectedDevis.length > 0 && selectedDevis.length < paginatedDevis.length;

    // Gestion du tri
    const handleSort = (field: keyof Devis) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Gestion de la suppression
    const openDeleteDialog = (devisItem: Devis) => {
        setDeleteDialog({ isOpen: true, devis: devisItem });
    };

    const closeDeleteDialog = () => {
        setDeleteDialog({ isOpen: false, devis: null });
    };

    const handleDeleteDevis = async (deleteUrl: string, onClose: () => void) => {
        setIsDeleting(true);
        router.delete(deleteUrl, {
            onSuccess: () => {
                setIsDeleting(false);
                onClose();
                toast.success('Devis supprimé avec succès');
            },
            onError: () => {
                setIsDeleting(false);
                toast.error('Une erreur est survenue lors de la suppression du devis');
            }
        });
    };

    // Suppression multiple
    const handleDeleteSelected = () => {
        if (selectedDevis.length === 0) return;
        toast.info(`${selectedDevis.length} devis sélectionné(s) pour suppression`);
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

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Devis</h1>
                        <p className="text-muted-foreground">
                            Gérez vos devis et propositions commerciales
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedDevis.length > 0 && (
                            <>
                                <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer ({selectedDevis.length})
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Exporter
                                </Button>
                            </>
                        )}
                        <Button asChild>
                            <Link href="/devis/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Nouveau devis
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
                                        placeholder="Rechercher des devis..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 w-full sm:w-[300px]"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={(value: 'all' | 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire') => setStatusFilter(value)}>
                                    <SelectTrigger className="w-full sm:w-[140px]">
                                        <SelectValue placeholder="Statut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous</SelectItem>
                                        <SelectItem value="brouillon">Brouillon</SelectItem>
                                        <SelectItem value="envoye">Envoyé</SelectItem>
                                        <SelectItem value="accepte">Accepté</SelectItem>
                                        <SelectItem value="refuse">Refusé</SelectItem>
                                        <SelectItem value="expire">Expiré</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={statusEnvoiFilter} onValueChange={(value: 'all' | 'non_envoye' | 'envoye' | 'echec_envoi') => setStatusEnvoiFilter(value)}>
                                    <SelectTrigger className="w-full sm:w-[140px]">
                                        <SelectValue placeholder="Envoi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous</SelectItem>
                                        <SelectItem value="non_envoye">Non envoyé</SelectItem>
                                        <SelectItem value="envoye">Envoyé</SelectItem>
                                        <SelectItem value="echec_envoi">Échec envoi</SelectItem>
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
                            Liste des devis ({filteredAndSortedDevis.length} résultat{filteredAndSortedDevis.length > 1 ? 's' : ''})
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
                                        <TableHead className="cursor-pointer sort-button" onClick={() => handleSort('numero_devis')}>
                                            <div className="flex items-center gap-2">
                                                Numéro
                                                <ArrowUpDown className="h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer sort-button" onClick={() => handleSort('objet')}>
                                            <div className="flex items-center gap-2">
                                                Objet
                                                <ArrowUpDown className="h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead className="cursor-pointer sort-button" onClick={() => handleSort('statut')}>
                                            <div className="flex items-center gap-2">
                                                Statut
                                                <ArrowUpDown className="h-4 w-4" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Statut envoi</TableHead>
                                        <TableHead className="cursor-pointer sort-button" onClick={() => handleSort('date_devis')}>
                                            <div className="flex items-center gap-2">
                                                Date
                                                <ArrowUpDown className="h-4 w-4" />
                                            </div>
                                        </TableHead>
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
                                    {paginatedDevis.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            data-state={selectedDevis.includes(item.id) ? "selected" : undefined}
                                            className="group"
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedDevis.includes(item.id)}
                                                    onCheckedChange={(checked) => handleSelectDevis(item.id, checked as boolean)}
                                                    aria-label={`Sélectionner ${item.numero_devis}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {item.numero_devis}
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px] truncate">
                                                    {item.objet}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">
                                                        {item.client.prenom} {item.client.nom}
                                                    </div>
                                                    {item.client.entreprise && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {item.client.entreprise.nom_commercial || item.client.entreprise.nom}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${getStatusStyles(item.statut)} border-0`}>
                                                    <span className="flex items-center gap-1">
                                                        {getStatusIcon(item.statut)}
                                                        {formatStatut(item.statut)}
                                                    </span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${getStatusEnvoiStyles(item.statut_envoi)} border-0 text-xs`}>
                                                    <span className="flex items-center gap-1">
                                                        {getStatusEnvoiIcon(item.statut_envoi)}
                                                        {formatStatutEnvoi(item.statut_envoi)}
                                                    </span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div>{formatDate(item.date_devis)}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Expire: {formatDate(item.date_validite)}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatPrice(item.montant_ttc)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 table-actions">
                                                    {item.peut_etre_envoye && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className={`${item.statut_envoi === 'envoye' ? 'text-orange-600 hover:text-orange-700' : 'text-blue-600 hover:text-blue-700'}`}
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
                                                    <Button size="sm" variant="ghost" asChild>
                                                        <Link href={`/devis/${item.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button size="sm" variant="ghost" asChild>
                                                        <Link href={`/devis/${item.id}/edit`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openDeleteDialog(item)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {paginatedDevis.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-12">
                                                <div className="text-muted-foreground">
                                                    <FileText className="mx-auto h-12 w-12 mb-4" />
                                                    <h3 className="font-medium mb-2">Aucun devis trouvé</h3>
                                                    <p>Aucun devis ne correspond à vos critères de recherche</p>
                                                </div>
                                                <Button asChild className="mt-4">
                                                    <Link href="/devis/create">
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Créer un devis
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
                                        Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredAndSortedDevis.length)} sur {filteredAndSortedDevis.length} résultats
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
                {deleteDialog.isOpen && deleteDialog.devis !== null && (
                    <DeleteConfirmationDialog
                        isOpen={deleteDialog.isOpen}
                        onClose={closeDeleteDialog}
                        title="Supprimer le devis"
                        description="Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible."
                        itemName={deleteDialog.devis!.numero_devis}
                        deleteUrl={`/devis/${deleteDialog.devis!.id}`}
                        isDeleting={isDeleting}
                        onDelete={() => handleDeleteDevis(`/devis/${deleteDialog.devis!.id}`, closeDeleteDialog)}
                    />
                )}
            </div>
        </AppLayout>
    );
}
