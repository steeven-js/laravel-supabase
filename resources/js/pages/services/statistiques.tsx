import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Package, ArrowLeft, BarChart3, TrendingUp, Euro, Users } from 'lucide-react';

interface Service {
    id: number;
    nom: string;
    code: string;
    description?: string;
    prix_ht: number;
    qte_defaut: number;
    actif: boolean;
    lignes_devis_count?: number;
    lignes_factures_count?: number;
}

interface Props {
    stats: {
        total: number;
        actifs: number;
        inactifs: number;
        par_categorie: Array<{
            categorie: string;
            total: number;
            actifs: number;
        }>;
        plus_utilises: Service[];
        ca_par_service: Array<{
            service: Service;
            ca_total: number;
        }>;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Accueil',
        href: '/dashboard',
    },
    {
        title: 'Gestion',
        href: '/dashboard',
    },
    {
        title: 'Services',
        href: '/services',
    },
    {
        title: 'Statistiques',
        href: '/services/statistiques',
    },
];

export default function ServicesStatistiques({ stats }: Props) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const pourcentageActifs = stats.total > 0 ? Math.round((stats.actifs / stats.total) * 100) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Statistiques des Services" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <Button variant="outline" size="sm" asChild className="shrink-0">
                                        <Link href="/services">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Retour
                                        </Link>
                                    </Button>
                                    <div className="space-y-2">
                                        <h1 className="text-3xl font-bold tracking-tight">
                                            Statistiques des Services
                                        </h1>
                                        <p className="text-muted-foreground">
                                            Analyse complète de l'utilisation de vos services
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/services/catalogue">
                                            <Package className="mr-2 h-4 w-4" />
                                            Catalogue
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Statistiques générales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Services</p>
                                    <p className="text-3xl font-bold">{stats.total}</p>
                                </div>
                                <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Services Actifs</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.actifs}</p>
                                    <p className="text-xs text-muted-foreground">{pourcentageActifs}% du total</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Services Inactifs</p>
                                    <p className="text-3xl font-bold text-red-600">{stats.inactifs}</p>
                                    <p className="text-xs text-muted-foreground">{100 - pourcentageActifs}% du total</p>
                                </div>
                                <Users className="h-8 w-8 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Catégories</p>
                                    <p className="text-3xl font-bold text-blue-600">{stats.par_categorie.length}</p>
                                    <p className="text-xs text-muted-foreground">Types différents</p>
                                </div>
                                <BarChart3 className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Services par catégorie */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Services par Catégorie
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {stats.par_categorie.map((cat) => (
                                    <div key={cat.categorie} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{cat.categorie}</span>
                                            <Badge variant="outline">
                                                {cat.total} service{cat.total > 1 ? 's' : ''}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all"
                                                    style={{ width: `${(cat.actifs / cat.total) * 100}%` }}
                                                />
                                            </div>
                                            <span>{cat.actifs}/{cat.total} actifs</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Services les plus utilisés */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Services les Plus Utilisés
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {stats.plus_utilises.slice(0, 8).map((service, index) => (
                                    <div key={service.id} className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{service.nom}</p>
                                            <p className="text-xs text-muted-foreground">{service.code}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                {(service.lignes_devis_count || 0) + (service.lignes_factures_count || 0)} fois
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {service.lignes_devis_count || 0} devis, {service.lignes_factures_count || 0} factures
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top CA par service */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Euro className="h-5 w-5" />
                            Top 10 - Chiffre d'Affaires par Service
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {stats.ca_par_service.slice(0, 10).map((item, index) => (
                                <div key={item.service.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{item.service.nom}</p>
                                        <p className="text-xs text-muted-foreground">{item.service.code}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-green-600">
                                            {formatPrice(item.ca_total)}
                                        </p>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/services/${item.service.id}`}>
                                                Détails
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
