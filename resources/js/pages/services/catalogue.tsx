import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Package, ArrowLeft, Euro } from 'lucide-react';

interface Service {
    id: number;
    nom: string;
    code: string;
    description?: string;
    prix_ht: number;
    qte_defaut: number;
    actif: boolean;
}

interface Props {
    services_groupes: Record<string, Service[]>;
    stats: {
        total_actifs: number;
        categories: string[];
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
        title: 'Catalogue',
        href: '/services/catalogue',
    },
];

export default function ServicesCatalogue({ services_groupes, stats }: Props) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catalogue des Services" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg" />
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
                                            Catalogue des Services
                                        </h1>
                                        <p className="text-muted-foreground">
                                            Découvrez nos services organisés par catégorie
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>{stats.total_actifs} services actifs</span>
                                            <span>{stats.categories.length} catégories</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Catalogue par catégories */}
                <div className="space-y-6">
                    {Object.entries(services_groupes).map(([categorie, services]) => (
                        <Card key={categorie}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Package className="h-5 w-5" />
                                    {categorie}
                                    <Badge variant="secondary">
                                        {services.length} service{services.length > 1 ? 's' : ''}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {services.map((service) => (
                                        <Card key={service.id} className="h-full">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <h3 className="font-medium line-clamp-2">
                                                            {service.nom}
                                                        </h3>
                                                        <code className="text-xs text-muted-foreground">
                                                            {service.code}
                                                        </code>
                                                    </div>
                                                    <Badge variant={service.actif ? 'default' : 'secondary'}>
                                                        {service.actif ? 'Actif' : 'Inactif'}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                {service.description && (
                                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                                                        {service.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1 text-sm font-medium">
                                                        <Euro className="h-4 w-4" />
                                                        {formatPrice(service.prix_ht)}
                                                    </div>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/services/${service.id}`}>
                                                            Voir détails
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
