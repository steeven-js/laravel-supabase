import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToastDemo } from '@/components/toast-demo';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Users, Building2, FileText, Receipt, Euro, TrendingUp,
    AlertCircle, Database, RefreshCw, Plus, Eye
} from 'lucide-react';
import { useState } from 'react';

interface DashboardStats {
    clients: number;
    entreprises: number;
    devis: {
        total: number;
        brouillon: number;
        envoye: number;
        accepte: number;
        refuse: number;
        expire: number;
    };
    factures: {
        total: number;
        brouillon: number;
        envoyee: number;
        payee: number;
        en_retard: number;
        annulee: number;
        montant_total: number;
    };
}

interface Props {
    stats: DashboardStats;
    isLocal: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({ stats, isLocal }: Props) {
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const { post } = useForm();

    const handleDevAction = (action: string, route: string) => {
        if (confirm(`Êtes-vous sûr de vouloir ${action} ?`)) {
            setLoadingAction(action);
            post(route, {
                onFinish: () => setLoadingAction(null)
            });
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const getStatutColor = (type: 'devis' | 'facture', statut: string) => {
        if (type === 'devis') {
            switch (statut) {
                case 'brouillon': return 'bg-gray-100 text-gray-800';
                case 'envoye': return 'bg-blue-100 text-blue-800';
                case 'accepte': return 'bg-green-100 text-green-800';
                case 'refuse': return 'bg-red-100 text-red-800';
                case 'expire': return 'bg-orange-100 text-orange-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        } else {
            switch (statut) {
                case 'brouillon': return 'bg-gray-100 text-gray-800';
                case 'envoyee': return 'bg-blue-100 text-blue-800';
                case 'payee': return 'bg-green-100 text-green-800';
                case 'en_retard': return 'bg-red-100 text-red-800';
                case 'annulee': return 'bg-gray-100 text-gray-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">

                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Tableau de bord</h1>
                        <p className="text-muted-foreground">
                            Aperçu de votre activité commerciale
                        </p>
                    </div>

                    {/* Boutons de développement - seulement en mode local */}
                    {isLocal && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDevAction('reset des données (garder utilisateur)', '/dev/reset-keep-user')}
                                disabled={loadingAction !== null}
                            >
                                {loadingAction === 'reset des données (garder utilisateur)' ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Database className="mr-2 h-4 w-4" />
                                )}
                                Reset données
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDevAction('reset complet (tout supprimer)', '/dev/reset-all')}
                                disabled={loadingAction !== null}
                            >
                                {loadingAction === 'reset complet (tout supprimer)' ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Reset tout
                            </Button>
                        </div>
                    )}
                </div>

                {/* Statistiques principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Clients</p>
                                    <p className="text-2xl font-bold">{stats.clients}</p>
                                </div>
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Entreprises</p>
                                    <p className="text-2xl font-bold">{stats.entreprises}</p>
                                </div>
                                <Building2 className="h-8 w-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Devis</p>
                                    <p className="text-2xl font-bold">{stats.devis.total}</p>
                                </div>
                                <FileText className="h-8 w-8 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Factures</p>
                                    <p className="text-2xl font-bold">{stats.factures.total}</p>
                                </div>
                                <Receipt className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Chiffre d'affaires */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Chiffre d'affaires total</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {formatPrice(stats.factures.montant_total)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-8 w-8 text-green-600" />
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    {stats.factures.payee} factures payées
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Statistiques des devis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Répartition des devis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(stats.devis).filter(([key]) => key !== 'total').map(([statut, count]) => (
                                    <div key={statut} className="flex items-center justify-between">
                                        <Badge className={getStatutColor('devis', statut)}>
                                            {statut.charAt(0).toUpperCase() + statut.slice(1)}
                                        </Badge>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t">
                                <Link href="/devis" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
                                    <Eye className="mr-1 h-4 w-4" />
                                    Voir tous les devis
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistiques des factures */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Répartition des factures
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(stats.factures).filter(([key]) => !['total', 'montant_total'].includes(key)).map(([statut, count]) => (
                                    <div key={statut} className="flex items-center justify-between">
                                        <Badge className={getStatutColor('facture', statut)}>
                                            {statut === 'en_retard' ? 'En retard' :
                                             statut === 'envoyee' ? 'Envoyée' :
                                             statut === 'payee' ? 'Payée' :
                                             statut === 'annulee' ? 'Annulée' :
                                             statut.charAt(0).toUpperCase() + statut.slice(1)}
                                        </Badge>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t">
                                <Link href="/factures" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
                                    <Eye className="mr-1 h-4 w-4" />
                                    Voir toutes les factures
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions rapides */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actions rapides</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <Button asChild variant="outline" className="h-12">
                                <Link href="/clients/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nouveau client
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-12">
                                <Link href="/entreprises/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nouvelle entreprise
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-12">
                                <Link href="/devis/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nouveau devis
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-12">
                                <Link href="/factures/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nouvelle facture
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Démonstration des toasts Sonner */}
                <ToastDemo />

                {/* Alertes */}
                {stats.factures.en_retard > 0 && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <span className="font-medium text-red-900">
                                    Vous avez {stats.factures.en_retard} facture(s) en retard de paiement
                                </span>
                                <Link href="/factures?status=en_retard" className="ml-auto text-sm text-red-600 hover:text-red-800">
                                    Voir →
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
