import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Edit,
    Package,
    CheckCircle,
    XCircle,
    Calendar,
    Euro,
    Hash,
    Activity,
    Copy,
    Settings,
    FileText,
    Receipt,
    TrendingUp,
    BarChart3,
    Info,
    Users,
    Eye,
    ExternalLink,
    Trash2,
    AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Service {
    id: number;
    nom: string;
    code: string;
    description?: string;
    prix_ht: number;
    qte_defaut: number;
    actif: boolean;
    created_at: string;
    updated_at: string;
}

interface ServiceStats {
    lignes_devis_count: number;
    lignes_factures_count: number;
    chiffre_affaires_total: number;
    quantite_totale_vendue: number;
    prix_moyen_vente: number;
    derniere_utilisation?: string;
}

interface RecentDevis {
    id: number;
    numero_devis: string;
    objet: string;
    client: {
        nom: string;
        prenom: string;
    };
    date_devis: string;
    montant_ttc: number;
    statut: string;
}

interface RecentFacture {
    id: number;
    numero_facture: string;
    objet: string;
    client: {
        nom: string;
        prenom: string;
    };
    date_facture: string;
    montant_ttc: number;
    statut: string;
}

interface Props {
    service: Service;
    stats: ServiceStats;
    recent_devis: RecentDevis[];
    recent_factures: RecentFacture[];
}

const breadcrumbs = (service: Service): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Services',
        href: '/services',
    },
    {
        title: service.nom,
        href: `/services/${service.id}`,
    },
];

export default function ServiceShow({ service, stats, recent_devis, recent_factures }: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'devis' | 'factures'>('overview');

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateShort = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copié dans le presse-papiers`);
    };

    const handleToggleStatus = () => {
        router.patch(`/services/${service.id}/toggle`, {}, {
            onSuccess: () => {
                toast.success(`Service ${service.actif ? 'désactivé' : 'activé'} avec succès`);
            },
            onError: () => {
                toast.error('Une erreur est survenue');
            }
        });
    };

    const handleDuplicate = () => {
        router.post(`/services/${service.id}/duplicate`, {}, {
            onSuccess: () => {
                toast.success('Service dupliqué avec succès');
            },
            onError: () => {
                toast.error('Erreur lors de la duplication');
            }
        });
    };

    const handleDelete = () => {
        if (stats.lignes_devis_count > 0 || stats.lignes_factures_count > 0) {
            toast.error('Impossible de supprimer un service utilisé dans des devis ou factures');
            return;
        }

        if (confirm(`Êtes-vous sûr de vouloir supprimer le service "${service.nom}" ?`)) {
            router.delete(`/services/${service.id}`, {
                onSuccess: () => {
                    toast.success('Service supprimé avec succès');
                    router.get('/services');
                },
                onError: () => {
                    toast.error('Erreur lors de la suppression');
                }
            });
        }
    };

    const getStatutDevisStyles = (statut: string) => {
        switch (statut) {
            case 'accepte':
                return 'bg-green-600 text-white';
            case 'envoye':
                return 'bg-blue-600 text-white';
            case 'refuse':
                return 'bg-red-600 text-white';
            case 'expire':
                return 'bg-orange-600 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };

    const getStatutFactureStyles = (statut: string) => {
        switch (statut) {
            case 'payee':
                return 'bg-green-600 text-white';
            case 'envoyee':
                return 'bg-blue-600 text-white';
            case 'en_retard':
                return 'bg-red-600 text-white';
            case 'annulee':
                return 'bg-gray-600 text-white';
            default:
                return 'bg-yellow-600 text-white';
        }
    };

    const tabs = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: Info },
        { id: 'devis', label: 'Devis récents', icon: FileText, count: recent_devis.length },
        { id: 'factures', label: 'Factures récentes', icon: Receipt, count: recent_factures.length }
    ] as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs(service)}>
            <Head title={`Service ${service.nom}`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Bouton retour */}
                <div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/services">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                </div>

                {/* En-tête avec informations principales */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-3xl font-bold tracking-tight">
                                                {service.nom}
                                            </h1>
                                            <Badge
                                                className={`border-0 ${service.actif ?
                                                    "bg-green-600 hover:bg-green-700" :
                                                    "bg-gray-600 hover:bg-gray-700"
                                                }`}
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
                                            <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md">
                                                <Hash className="h-4 w-4 text-muted-foreground" />
                                                <code className="text-sm font-mono">{service.code}</code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(service.code, 'Code service')}
                                                    className="h-auto p-1"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Euro className="h-4 w-4" />
                                                    {formatPrice(service.prix_ht)} HT
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Package className="h-4 w-4" />
                                                    Qté défaut: {service.qte_defaut}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    Créé le {formatDate(service.created_at)}
                                                </div>
                                            </div>
                                            {service.description && (
                                                <p className="text-muted-foreground">
                                                    {service.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                    {/* Bouton de changement de statut professionnel */}
                                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                                                <Settings className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Modifier le statut
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleToggleStatus}
                                            className="w-full h-11 border border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium transition-colors"
                                        >
                                            <Settings className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            {service.actif ? 'Désactiver le service' : 'Activer le service'}
                                        </Button>
                                    </div>

                                    <Button variant="outline" size="sm" onClick={handleDuplicate}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Dupliquer
                                    </Button>

                                    {stats.lignes_devis_count === 0 && stats.lignes_factures_count === 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDelete}
                                            className="text-destructive hover:text-destructive border-destructive/20"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Supprimer
                                        </Button>
                                    )}

                                    <Button asChild>
                                        <Link href={`/services/${service.id}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Modifier
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Navigation par onglets */}
                <Card>
                    <CardHeader className="pb-0">
                        <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                            activeTab === tab.id
                                                ? 'bg-background text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {tab.label}
                                        {'count' in tab && tab.count !== undefined && (
                                            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                                                {tab.count}
                                            </Badge>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </CardHeader>
                </Card>

                {/* Contenu des onglets */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Statistiques principales */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Statistiques d'utilisation */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Statistiques d'utilisation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {stats.lignes_devis_count}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Devis</div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">
                                                {stats.lignes_factures_count}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Factures</div>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {stats.quantite_totale_vendue}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Qté vendue</div>
                                        </div>
                                        <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                                            <div className="text-lg font-bold text-orange-600">
                                                {formatPrice(stats.chiffre_affaires_total)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">CA Total</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Métriques de performance */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Métriques de performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                                            <span className="font-medium">Prix moyen de vente</span>
                                            <span className="text-lg font-bold">
                                                {stats.prix_moyen_vente > 0 ? formatPrice(stats.prix_moyen_vente) : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                                            <span className="font-medium">Prix catalogue</span>
                                            <span className="text-lg font-bold">{formatPrice(service.prix_ht)}</span>
                                        </div>
                                        {stats.prix_moyen_vente > 0 && (
                                            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                                                <span className="font-medium">Écart vs catalogue</span>
                                                <span className={`text-lg font-bold ${
                                                    stats.prix_moyen_vente >= service.prix_ht ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {stats.prix_moyen_vente >= service.prix_ht ? '+' : ''}
                                                    {formatPrice(stats.prix_moyen_vente - service.prix_ht)}
                                                </span>
                                            </div>
                                        )}
                                        {stats.derniere_utilisation && (
                                            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                                                <span className="font-medium">Dernière utilisation</span>
                                                <span className="text-lg font-bold">
                                                    {formatDateShort(stats.derniere_utilisation)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Panneau latéral */}
                        <div className="space-y-6">
                            {/* Informations détaillées */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Info className="h-5 w-5" />
                                        Informations détaillées
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Code service</div>
                                        <div className="flex items-center gap-2">
                                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1">
                                                {service.code}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(service.code, 'Code service')}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Prix unitaire HT</div>
                                        <div className="text-lg font-bold">{formatPrice(service.prix_ht)}</div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Quantité par défaut</div>
                                        <div className="text-lg font-bold">{service.qte_defaut}</div>
                                    </div>

                                    <Separator />

                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <div>Créé le {formatDateShort(service.created_at)}</div>
                                        {service.updated_at !== service.created_at && (
                                            <div>Modifié le {formatDateShort(service.updated_at)}</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions rapides */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Actions rapides</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                        <Link href={`/services/${service.id}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Modifier le service
                                        </Link>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={handleDuplicate}
                                    >
                                        <Copy className="mr-2 h-4 w-4" />
                                        Dupliquer le service
                                    </Button>

                                    {/* Modification de statut professionnelle */}
                                    <div className="bg-gradient-to-r from-slate-50 to-emerald-50 dark:from-slate-900/50 dark:to-emerald-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                                                <Settings className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                Statut du service
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start border border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium transition-colors"
                                            onClick={handleToggleStatus}
                                        >
                                            <Settings className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            {service.actif ? 'Désactiver' : 'Activer'}
                                        </Button>
                                    </div>

                                    <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                        <Link href="/services">
                                            <Package className="mr-2 h-4 w-4" />
                                            Voir tous les services
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Alerte suppression */}
                            {stats.lignes_devis_count > 0 || stats.lignes_factures_count > 0 ? (
                                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-orange-600" />
                                            <div className="text-sm">
                                                <div className="font-medium text-orange-900 dark:text-orange-100">
                                                    Service utilisé
                                                </div>
                                                <div className="text-orange-700 dark:text-orange-200">
                                                    Ce service ne peut pas être supprimé car il est utilisé dans des devis ou factures.
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                <div className="text-sm font-medium text-red-900 dark:text-red-100">
                                                    Zone de danger
                                                </div>
                                            </div>
                                            <p className="text-sm text-red-700 dark:text-red-200">
                                                Ce service n'est utilisé dans aucun devis ou facture. Vous pouvez le supprimer si nécessaire.
                                            </p>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="w-full"
                                                onClick={handleDelete}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Supprimer le service
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'devis' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Devis récents utilisant ce service</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recent_devis.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                                    <h3 className="font-medium mb-2">Aucun devis</h3>
                                    <p className="text-muted-foreground">Ce service n'a encore été utilisé dans aucun devis.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recent_devis.map((devis) => (
                                        <div key={devis.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <Link
                                                        href={`/devis/${devis.id}`}
                                                        className="font-medium hover:text-primary hover:underline"
                                                    >
                                                        {devis.numero_devis}
                                                    </Link>
                                                    <Badge className={getStatutDevisStyles(devis.statut)}>
                                                        {devis.statut}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {devis.objet}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {devis.client.prenom} {devis.client.nom} • {formatDateShort(devis.date_devis)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{formatPrice(devis.montant_ttc)}</div>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/devis/${devis.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'factures' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Factures récentes utilisant ce service</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recent_factures.length === 0 ? (
                                <div className="text-center py-8">
                                    <Receipt className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                                    <h3 className="font-medium mb-2">Aucune facture</h3>
                                    <p className="text-muted-foreground">Ce service n'a encore été utilisé dans aucune facture.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recent_factures.map((facture) => (
                                        <div key={facture.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <Link
                                                        href={`/factures/${facture.id}`}
                                                        className="font-medium hover:text-primary hover:underline"
                                                    >
                                                        {facture.numero_facture}
                                                    </Link>
                                                    <Badge className={getStatutFactureStyles(facture.statut)}>
                                                        {facture.statut}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {facture.objet}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {facture.client.prenom} {facture.client.nom} • {formatDateShort(facture.date_facture)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{formatPrice(facture.montant_ttc)}</div>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/factures/${facture.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
