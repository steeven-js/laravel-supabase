import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Package, ArrowLeft, Search, Euro } from 'lucide-react';
import { useState } from 'react';

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
    services: {
        data: Service[];
        meta: any;
        links: any;
    };
    filters: {
        search?: string;
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
        title: 'Services Actifs',
        href: '/services/actifs',
    },
];

export default function ServicesActifs({ services, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/services/actifs', { search }, { preserveState: true });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Services Actifs" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-primary/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <Button variant="outline" size="sm" asChild className="shrink-0">
                                        <Link href="/services">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Tous les services
                                        </Link>
                                    </Button>
                                    <div className="space-y-2">
                                        <h1 className="text-3xl font-bold tracking-tight">
                                            Services Actifs
                                        </h1>
                                        <p className="text-muted-foreground">
                                            Services disponibles pour vos devis et factures
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>{services.meta.total} services actifs</span>
                                        </div>
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

                {/* Recherche */}
                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Rechercher un service..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button type="submit">
                                Rechercher
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Liste des services */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.data.map((service) => (
                        <Card key={service.id} className="h-full hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                        <h3 className="font-medium line-clamp-2">
                                            {service.nom}
                                        </h3>
                                        <code className="text-xs text-muted-foreground">
                                            {service.code}
                                        </code>
                                    </div>
                                    <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                                        Actif
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-3">
                                {service.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {service.description}
                                    </p>
                                )}
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1 text-lg font-semibold text-primary">
                                            <Euro className="h-4 w-4" />
                                            {formatPrice(service.prix_ht)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Qté défaut: {service.qte_defaut}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/services/${service.id}`}>
                                                Voir
                                            </Link>
                                        </Button>
                                        <Button size="sm" asChild>
                                            <Link href={`/services/${service.id}/edit`}>
                                                Modifier
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Pagination */}
                {services.meta.last_page > 1 && (
                    <div className="flex justify-center items-center gap-2">
                        {services.links.map((link: any, index: number) => (
                            <Button
                                key={index}
                                variant={link.active ? "default" : "outline"}
                                size="sm"
                                disabled={!link.url}
                                asChild={!!link.url}
                            >
                                {link.url ? (
                                    <Link href={link.url}>
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    </Link>
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                )}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
