import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
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
    BarChart3
} from 'lucide-react';
import { useState } from 'react';
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
    };
}

export default function ServicesIndex({
    services,
    stats,
    filters = {}
}: Props) {
    // Debug: log des props pour identifier le problème
    console.log('ServicesIndex props:', { services, stats, filters });

    // Vérifications de sécurité renforcées
    const safeServices = services || { data: [], links: [], meta: { current_page: 1, per_page: 15, total: 0, last_page: 1 } };
    const safeStats = stats || { total: 0, actifs: 0, inactifs: 0, chiffre_affaires_total: 0 };

    // Correction spéciale pour filters qui peut arriver comme array vide
    let safeFilters: {
        search?: string;
        statut?: string;
        sort?: string;
        direction?: string;
    } = {};
    if (filters && typeof filters === 'object' && !Array.isArray(filters)) {
        safeFilters = filters;
    } else {
        console.warn('Filters is not a valid object:', filters);
        safeFilters = {};
    }

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

    const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
    const [statutFilter, setStatutFilter] = useState(safeFilters.statut || 'tous');
    const [sortBy, setSortBy] = useState(safeFilters.sort || 'nom');
    const [sortDirection, setSortDirection] = useState(safeFilters.direction || 'asc');

    const formatPrice = (price: number | undefined | null) => {
        const safePrice = price || 0;
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(safePrice);
    };

    const handleSearch = () => {
        router.get('/services', {
            search: searchTerm,
            statut: statutFilter === 'tous' ? '' : statutFilter,
            sort: sortBy,
            direction: sortDirection,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSort = (column: string) => {
        const newDirection = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortBy(column);
        setSortDirection(newDirection);

        router.get('/services', {
            search: searchTerm,
            statut: statutFilter === 'tous' ? '' : statutFilter,
            sort: column,
            direction: newDirection,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleToggleStatus = (service: Service) => {
        router.patch(`/services/${service.id}/toggle`, {}, {
            onSuccess: () => {
                toast.success(`Service ${service.actif ? 'désactivé' : 'activé'} avec succès`);
            },
            onError: () => {
                toast.error('Une erreur est survenue');
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
        router.get('/services', {}, { preserveState: true, replace: true });
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
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Select value={statutFilter} onValueChange={setStatutFilter}>
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
                                <Button onClick={handleSearch}>
                                    Rechercher
                                </Button>
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
                            <span>Services ({safeServices.meta.total})</span>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <BarChart3 className="h-4 w-4" />
                                Page {safeServices.meta.current_page} sur {safeServices.meta.last_page}
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {!safeServices.data || safeServices.data.length === 0 ? (
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
                                        {safeServices.data?.map((service, index) => (
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
                                                            className="font-medium hover:text-primary hover:underline"
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
                                                    <div className="flex items-center gap-2">
                                                        <Hash className="h-4 w-4 text-muted-foreground" />
                                                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                                            {service.code}
                                                        </code>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-medium">
                                                        {formatPrice(service.prix_ht)}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Qté: {service.qte_defaut}
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
                        {safeServices.meta && safeServices.meta.last_page > 1 && (
                            <div className="p-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Affichage de {(((safeServices.meta?.current_page || 1) - 1) * (safeServices.meta?.per_page || 15)) + 1} à{' '}
                                        {Math.min((safeServices.meta?.current_page || 1) * (safeServices.meta?.per_page || 15), safeServices.meta?.total || 0)} sur{' '}
                                        {safeServices.meta?.total || 0} services
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {safeServices.links?.map((link, index) => (
                                            <Button
                                                key={index}
                                                variant={link.active ? "default" : "outline"}
                                                size="sm"
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url)}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
