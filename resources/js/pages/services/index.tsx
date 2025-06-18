import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Copy,
    Trash2,
    MoreHorizontal,
    Package,
    Euro,
    Activity,
    TrendingUp,
    Settings,
    AlertCircle,
    CheckCircle,
    XCircle,
    Hash,
    FileText,
    BarChart3,
    Info
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Services',
        href: '/services',
    },
];

interface Service {
    id: number;
    nom: string;
    code: string;
    description?: string;
    prix_ht: number;
    qte_defaut: number;
    unite?: string;
    actif: boolean;
    lignes_devis_count: number;
    lignes_factures_count: number;
    created_at: string;
    updated_at: string;
}

interface Stats {
    total: number;
    actifs: number;
    inactifs: number;
    chiffre_affaires_total: number;
}

interface Props {
    services?: {
        data: Service[];
        links: any[];
        meta: {
            current_page: number;
            per_page: number;
            total: number;
            last_page: number;
        };
    };
    stats?: Stats;
    filters?: {
        search?: string;
        statut?: string;
        sort?: string;
        direction?: string;
    } | any;
}

export default function ServicesIndex({
    services,
    stats,
    filters
}: Props) {
    // Vérifications de sécurité renforcées
    const safeServices = services || { data: [], links: [], meta: { current_page: 1, per_page: 15, total: 0, last_page: 1 } };
    const safeStats = stats || { total: 0, actifs: 0, inactifs: 0, chiffre_affaires_total: 0 };

    // Correction spéciale pour filters qui peut arriver comme array vide ou null
    const safeFilters: {
        search?: string;
        statut?: string;
        sort?: string;
        direction?: string;
    } = (filters && typeof filters === 'object' && !Array.isArray(filters)) ? filters : {};

    // S'assurer que services.data existe et est un array
    if (!safeServices.data || !Array.isArray(safeServices.data)) {
        console.error('Services.data is undefined/null or not an array:', safeServices.data);
        safeServices.data = [];
    }

    // S'assurer que services.meta existe
    if (!safeServices.meta) {
        safeServices.meta = { current_page: 1, per_page: 15, total: 0, last_page: 1 };
    }

    // S'assurer que services.links existe
    if (!safeServices.links) {
        safeServices.links = [];
    }

    const [searchTerm, setSearchTerm] = useState('');
    const [statutFilter, setStatutFilter] = useState('tous');
    const [sortBy, setSortBy] = useState<string>('nom');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    // Tous les services (récupérés une seule fois)
    const allServices = safeServices.data || [];

    // Filtrage et tri côté client
    const filteredAndSortedServices = useMemo(() => {
        const filtered = allServices.filter(service => {
            // Vérification que le service existe
            if (!service || !service.nom) {
                return false;
            }

            // Filtrage par terme de recherche
            const matchesSearch = !searchTerm.trim() || [
                service.nom,
                service.code,
                service.description
            ].some(field => {
                if (!field) return false;
                return field.toLowerCase().includes(searchTerm.toLowerCase());
            });

            // Filtrage par statut
            const matchesStatus =
                statutFilter === 'tous' ||
                (statutFilter === 'actif' && service.actif) ||
                (statutFilter === 'inactif' && !service.actif);

            return matchesSearch && matchesStatus;
        });

        // Tri
        filtered.sort((a, b) => {
            let aValue = a[sortBy as keyof Service];
            let bValue = b[sortBy as keyof Service];

            if (sortBy === 'nom' || sortBy === 'code' || sortBy === 'description') {
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
    }, [allServices, searchTerm, statutFilter, sortBy, sortDirection]);

    // Pagination côté client
    const totalPages = Math.ceil(filteredAndSortedServices.length / itemsPerPage);
    const paginatedServices = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedServices.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedServices, currentPage, itemsPerPage]);

    const formatPrice = (price: number | undefined | null) => {
        const safePrice = price || 0;
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(safePrice);
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
        setCurrentPage(1); // Retourner à la première page lors du tri
    };

    const handleToggleStatus = (service: Service) => {
        setSelectedService(service);
        setShowStatusModal(true);
    };

    const confirmToggleStatus = () => {
        if (!selectedService) return;

        router.patch(`/services/${selectedService.id}/toggle`, {}, {
            onSuccess: () => {
                toast.success(`Service ${selectedService.actif ? 'désactivé' : 'activé'} avec succès`);
                setShowStatusModal(false);
                setSelectedService(null);
            },
            onError: () => {
                toast.error('Une erreur est survenue');
                setShowStatusModal(false);
                setSelectedService(null);
            }
        });
    };

    const handleDuplicate = (service: Service) => {
        router.post(`/services/${service.id}/duplicate`, {}, {
            onSuccess: () => {
                toast.success('Service dupliqué avec succès');
            },
            onError: () => {
                toast.error('Erreur lors de la duplication');
            }
        });
    };

    const handleDelete = (service: Service) => {
        if (service.lignes_devis_count > 0 || service.lignes_factures_count > 0) {
            toast.error('Impossible de supprimer un service utilisé dans des devis ou factures');
            return;
        }

        if (confirm(`Êtes-vous sûr de vouloir supprimer le service "${service.nom}" ?`)) {
            router.delete(`/services/${service.id}`, {
                onSuccess: () => {
                    toast.success('Service supprimé avec succès');
                },
                onError: () => {
                    toast.error('Erreur lors de la suppression');
                }
            });
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatutFilter('tous');
        setSortBy('nom');
        setSortDirection('asc');
        setCurrentPage(1);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Services" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête avec statistiques */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-3xl font-bold tracking-tight">Services</h1>
                                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                            {safeStats?.total || 0} services
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground">
                                        Gérez votre catalogue de services et prestations
                                    </p>
                                </div>
                                <Button asChild>
                                    <Link href="/services/create">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Nouveau service
                                    </Link>
                                </Button>
                            </div>

                            {/* Statistiques rapides */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                                <div className="bg-white/50 dark:bg-white/5 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <Package className="h-8 w-8 text-blue-600" />
                                        <div>
                                            <div className="text-2xl font-bold">{safeStats?.total || 0}</div>
                                            <div className="text-sm text-muted-foreground">Total services</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white/50 dark:bg-white/5 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                        <div>
                                            <div className="text-2xl font-bold">{safeStats?.actifs || 0}</div>
                                            <div className="text-sm text-muted-foreground">Actifs</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white/50 dark:bg-white/5 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <XCircle className="h-8 w-8 text-red-600" />
                                        <div>
                                            <div className="text-2xl font-bold">{safeStats?.inactifs || 0}</div>
                                            <div className="text-sm text-muted-foreground">Inactifs</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white/50 dark:bg-white/5 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="h-8 w-8 text-purple-600" />
                                        <div>
                                            <div className="text-lg font-bold">{formatPrice(safeStats.chiffre_affaires_total || 0)}</div>
                                            <div className="text-sm text-muted-foreground">CA Total</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtres et recherche */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Rechercher un service (nom, code, description)..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setCurrentPage(1); // Retourner à la première page lors de la recherche
                                            }
                                        }}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Select value={statutFilter} onValueChange={(value) => {
                                    setStatutFilter(value);
                                    setCurrentPage(1); // Retourner à la première page lors du changement de filtre
                                }}>
                                    <SelectTrigger className="w-[140px]">
                                        <Filter className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="Statut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tous">Tous</SelectItem>
                                        <SelectItem value="actif">Actifs</SelectItem>
                                        <SelectItem value="inactif">Inactifs</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" onClick={resetFilters}>
                                    Réinitialiser
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Liste des services */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Services ({filteredAndSortedServices.length} résultat{filteredAndSortedServices.length > 1 ? 's' : ''})</span>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <BarChart3 className="h-4 w-4" />
                                Page {currentPage} sur {totalPages}
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {!paginatedServices || paginatedServices.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                                <h3 className="font-medium mb-2">Aucun service trouvé</h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchTerm || (statutFilter && statutFilter !== 'tous') ?
                                        'Aucun service ne correspond à vos critères de recherche.' :
                                        'Commencez par créer votre premier service.'
                                    }
                                </p>
                                <Button asChild>
                                    <Link href="/services/create">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Créer un service
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b bg-muted/30">
                                        <tr>
                                            <th
                                                className="text-left p-4 font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => handleSort('nom')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Nom
                                                    {sortBy === 'nom' && (
                                                        <span className="text-xs">
                                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                className="text-left p-4 font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => handleSort('code')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Code
                                                    {sortBy === 'code' && (
                                                        <span className="text-xs">
                                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                className="text-left p-4 font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => handleSort('prix_ht')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Prix HT
                                                    {sortBy === 'prix_ht' && (
                                                        <span className="text-xs">
                                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th className="text-left p-4 font-medium">Statut</th>
                                            <th className="text-left p-4 font-medium">Utilisation</th>
                                            <th className="text-right p-4 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedServices?.map((service, index) => (
                                            <tr
                                                key={service.id}
                                                className={`border-b hover:bg-muted/30 transition-colors ${
                                                    index % 2 === 0 ? 'bg-white/50' : 'bg-muted/10'
                                                }`}
                                            >
                                                <td className="p-4">
                                                    <div className="space-y-1">
                                                        <Link
                                                            href={`/services/${service.id}`}
                                                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                        >
                                                            {service.nom}
                                                        </Link>
                                                        {service.description && (
                                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                                {service.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono whitespace-nowrap">
                                                        {service.code}
                                                    </code>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-medium">
                                                        {formatPrice(service.prix_ht)}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Qté: {service.qte_defaut} {service.unite && (
                                                            <span className="text-blue-600 font-medium">
                                                                {service.unite === 'heure' ? service.qte_defaut > 1 ? 'heures' : 'heure' :
                                                                 service.unite === 'journee' ? service.qte_defaut > 1 ? 'journées' : 'journée' :
                                                                 service.unite === 'semaine' ? service.qte_defaut > 1 ? 'semaines' : 'semaine' :
                                                                 service.unite === 'mois' ? 'mois' :
                                                                 service.unite === 'unite' ? service.qte_defaut > 1 ? 'unités' : 'unité' :
                                                                 service.unite === 'forfait' ? service.qte_defaut > 1 ? 'forfaits' : 'forfait' :
                                                                 service.unite === 'licence' ? service.qte_defaut > 1 ? 'licences' : 'licence' :
                                                                 service.unite}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Badge
                                                        variant={service.actif ? "default" : "secondary"}
                                                        className={service.actif ?
                                                            "bg-green-600 hover:bg-green-700" :
                                                            "bg-gray-600 hover:bg-gray-700"
                                                        }
                                                    >
                                                        {service.actif ? (
                                                            <>
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Actif
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                Inactif
                                                            </>
                                                        )}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <div className="space-y-1">
                                                        <div className="text-sm">
                                                            <span className="font-medium">{service.lignes_devis_count}</span>
                                                            <span className="text-muted-foreground ml-1">devis</span>
                                                        </div>
                                                        <div className="text-sm">
                                                            <span className="font-medium">{service.lignes_factures_count}</span>
                                                            <span className="text-muted-foreground ml-1">factures</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/services/${service.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/services/${service.id}/edit`}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggleStatus(service)}
                                                        >
                                                            <Settings className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDuplicate(service)}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                        {service.lignes_devis_count === 0 && service.lignes_factures_count === 0 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(service)}
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Affichage de {((currentPage - 1) * itemsPerPage) + 1} à{' '}
                                        {Math.min(currentPage * itemsPerPage, filteredAndSortedServices.length)} sur{' '}
                                        {filteredAndSortedServices.length} services
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
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
                                                        className="w-8"
                                                    >
                                                        {page}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Suivant
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal de confirmation changement de statut */}
            <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Confirmer le changement de statut
                        </DialogTitle>
                        <DialogDescription>
                            {selectedService && (
                                <>Êtes-vous sûr de vouloir {selectedService.actif ? 'désactiver' : 'activer'} ce service ?</>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedService && (
                        <div className="py-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Package className="h-5 w-5 text-gray-600" />
                                    <div>
                                        <div className="font-medium">{selectedService.nom}</div>
                                        <div className="text-sm text-gray-500">{selectedService.code}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <span>Statut actuel :</span>
                                    <Badge
                                        className={`${selectedService.actif ?
                                            "bg-green-600 text-white" :
                                            "bg-gray-600 text-white"
                                        }`}
                                    >
                                        {selectedService.actif ? (
                                            <>
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Actif
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Inactif
                                            </>
                                        )}
                                    </Badge>
                                    <span>→</span>
                                    <Badge
                                        className={`${!selectedService.actif ?
                                            "bg-green-600 text-white" :
                                            "bg-gray-600 text-white"
                                        }`}
                                    >
                                        {!selectedService.actif ? (
                                            <>
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Actif
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Inactif
                                            </>
                                        )}
                                    </Badge>
                                </div>

                                {selectedService.actif && (selectedService.lignes_devis_count > 0 || selectedService.lignes_factures_count > 0) && (
                                    <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                                        <div className="text-sm text-orange-800">
                                            <p className="font-medium">Attention</p>
                                            <p>Ce service est utilisé dans {selectedService.lignes_devis_count} devis et {selectedService.lignes_factures_count} factures. Le désactiver peut affecter la visibilité de ces documents.</p>
                                        </div>
                                    </div>
                                )}

                                {!selectedService.actif && (
                                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <div className="text-sm text-blue-800">
                                            <p>L'activation de ce service le rendra disponible pour la création de nouveaux devis et factures.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowStatusModal(false);
                            setSelectedService(null);
                        }}>
                            Annuler
                        </Button>
                        <Button
                            onClick={confirmToggleStatus}
                            className={selectedService?.actif ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            {selectedService?.actif ? 'Désactiver' : 'Activer'} le service
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
