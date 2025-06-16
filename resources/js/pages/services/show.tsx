import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    AlertCircle,
    History,
    Mail,
    Clock,
    RotateCcw
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
        id?: number;
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
        id?: number;
        nom: string;
        prenom: string;
    };
    date_facture: string;
    montant_ttc: number;
    statut: string;
}

interface HistoriqueAction {
    id: number;
    action: 'creation' | 'modification' | 'changement_statut' | 'envoi_email' | 'suppression' | 'archivage' | 'restauration' | 'transformation';
    titre: string;
    description?: string;
    donnees_avant?: any;
    donnees_apres?: any;
    donnees_supplementaires?: any;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    user_nom: string;
    user_email: string;
}

interface Props {
    service: Service;
    stats: ServiceStats;
    recent_devis: RecentDevis[];
    recent_factures: RecentFacture[];
    historique: HistoriqueAction[];
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

export default function ServiceShow({ service, stats, recent_devis, recent_factures, historique }: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'devis' | 'factures' | 'historique'>('overview');
    const [showStatusModal, setShowStatusModal] = useState(false);

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

    // Helper functions pour l'historique
    const getActionIcon = (action: string) => {
        switch (action) {
            case 'creation':
                return <FileText className="h-4 w-4" />;
            case 'modification':
                return <Edit className="h-4 w-4" />;
            case 'changement_statut':
                return <CheckCircle className="h-4 w-4" />;
            case 'envoi_email':
                return <Mail className="h-4 w-4" />;
            case 'transformation':
                return <RotateCcw className="h-4 w-4" />;
            case 'suppression':
                return <Trash2 className="h-4 w-4" />;
            case 'archivage':
                return <Package className="h-4 w-4" />;
            case 'restauration':
                return <RotateCcw className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'creation':
                return 'bg-blue-100 text-blue-800';
            case 'modification':
                return 'bg-amber-100 text-amber-800';
            case 'changement_statut':
                return 'bg-green-100 text-green-800';
            case 'envoi_email':
                return 'bg-purple-100 text-purple-800';
            case 'transformation':
                return 'bg-emerald-100 text-emerald-800';
            case 'suppression':
                return 'bg-red-100 text-red-800';
            case 'archivage':
                return 'bg-gray-100 text-gray-800';
            case 'restauration':
                return 'bg-teal-100 text-teal-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatActionDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleToggleStatus = () => {
        setShowStatusModal(true);
    };

    const confirmToggleStatus = () => {
        router.patch(`/services/${service.id}/toggle`, {}, {
            onSuccess: () => {
                toast.success(`Service ${service.actif ? 'désactivé' : 'activé'} avec succès`);
                setShowStatusModal(false);
            },
            onError: () => {
                toast.error('Une erreur est survenue');
                setShowStatusModal(false);
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
        { id: 'factures', label: 'Factures récentes', icon: Receipt, count: recent_factures.length },
        { id: 'historique', label: 'Historique', icon: History, count: historique.length }
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

                {/* Header avec actions - Version harmonisée */}
                <Card className="w-full max-w-5xl mx-auto bg-white shadow-sm border border-gray-200">
                    <CardContent className="p-6">
                        {/* Titre et informations principales */}
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    Service {service.nom}
                                </h1>
                                <div className="flex items-center gap-3 mb-3">
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
                                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono whitespace-nowrap">
                                        {service.code}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(service.code, 'Code service')}
                                        className="h-auto p-1"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
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

                            {/* Section statut organisée */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Statut du service */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Settings className="h-4 w-4 text-amber-600" />
                                        <span className="text-sm font-medium text-gray-700">
                                            Statut du service
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleToggleStatus}
                                        className="w-full h-10 border-gray-300 hover:border-amber-400 bg-white transition-colors"
                                    >
                                        <Settings className="mr-2 h-4 w-4" />
                                        {service.actif ? 'Désactiver' : 'Activer'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Actions organisées */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            {/* Actions principales */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Button asChild className="h-10 px-4">
                                    <Link href={`/services/${service.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Link>
                                </Button>
                                <Button variant="outline" size="sm" className="h-10 px-4" onClick={handleDuplicate}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Dupliquer
                                </Button>
                            </div>

                            {/* Actions secondaires */}
                            <div className="flex flex-wrap items-center gap-2">
                                {stats.lignes_devis_count === 0 && stats.lignes_factures_count === 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-10 px-4 text-destructive hover:text-destructive border-destructive/20"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                                                    {devis.client?.prenom && devis.client?.nom
                                                        ? `${devis.client.prenom} ${devis.client.nom}`
                                                        : `Client ID: ${devis.client?.id || 'N/A'}`} • {devis.date_devis ? formatDateShort(devis.date_devis) : 'Date inconnue'}
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
                                                    {facture.client?.prenom && facture.client?.nom
                                                        ? `${facture.client.prenom} ${facture.client.nom}`
                                                        : `Client ID: ${facture.client?.id || 'N/A'}`} • {facture.date_facture ? formatDateShort(facture.date_facture) : 'Date inconnue'}
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

                {activeTab === 'historique' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Historique des actions
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Suivi de toutes les actions effectuées sur ce service ({historique.length})
                            </p>
                        </CardHeader>
                        <CardContent>
                            {historique.length > 0 ? (
                                <div className="space-y-4">
                                    {historique.map((action) => (
                                        <div key={action.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getActionColor(action.action)}`}>
                                                {getActionIcon(action.action)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-gray-900">{action.titre}</h4>
                                                    <span className="text-sm text-gray-500">{formatActionDate(action.created_at)}</span>
                                                </div>
                                                {action.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                    <span>Par {action.user?.name || action.user_nom}</span>
                                                    {action.donnees_supplementaires?.prix_ancien && action.donnees_supplementaires?.prix_nouveau && (
                                                        <span>• Prix: {action.donnees_supplementaires.prix_ancien}€ → {action.donnees_supplementaires.prix_nouveau}€</span>
                                                    )}
                                                    {action.donnees_supplementaires?.statut_ancien && action.donnees_supplementaires?.statut_nouveau && (
                                                        <span>• Statut: {action.donnees_supplementaires.statut_ancien} → {action.donnees_supplementaires.statut_nouveau}</span>
                                                    )}
                                                </div>
                                                {(action.donnees_avant || action.donnees_apres) && (
                                                    <details className="mt-2">
                                                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                                            Voir les détails
                                                        </summary>
                                                        <div className="mt-2 text-xs bg-white p-2 rounded border">
                                                            {action.donnees_avant && (
                                                                <div className="mb-2">
                                                                    <span className="font-medium text-red-600">Avant :</span>
                                                                    <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                                                                        {JSON.stringify(action.donnees_avant, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                            {action.donnees_apres && (
                                                                <div>
                                                                    <span className="font-medium text-green-600">Après :</span>
                                                                    <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                                                                        {JSON.stringify(action.donnees_apres, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <History className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="mt-4 text-lg font-medium">Aucune action enregistrée</h3>
                                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                        Aucune action n'a encore été enregistrée pour ce service. Les actions futures apparaîtront ici automatiquement.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
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
                            Êtes-vous sûr de vouloir {service.actif ? 'désactiver' : 'activer'} ce service ?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Package className="h-5 w-5 text-gray-600" />
                                <div>
                                    <div className="font-medium">{service.nom}</div>
                                    <div className="text-sm text-gray-500">{service.code}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <span>Statut actuel :</span>
                                <Badge
                                    className={`${service.actif ?
                                        "bg-green-600 text-white" :
                                        "bg-gray-600 text-white"
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
                                <span>→</span>
                                <Badge
                                    className={`${!service.actif ?
                                        "bg-green-600 text-white" :
                                        "bg-gray-600 text-white"
                                    }`}
                                >
                                    {!service.actif ? (
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

                            {service.actif && (stats.lignes_devis_count > 0 || stats.lignes_factures_count > 0) && (
                                <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                                    <div className="text-sm text-orange-800">
                                        <p className="font-medium">Attention</p>
                                        <p>Ce service est utilisé dans {stats.lignes_devis_count} devis et {stats.lignes_factures_count} factures. Le désactiver peut affecter la visibilité de ces documents.</p>
                                    </div>
                                </div>
                            )}

                            {!service.actif && (
                                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div className="text-sm text-blue-800">
                                        <p>L'activation de ce service le rendra disponible pour la création de nouveaux devis et factures.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStatusModal(false)}>
                            Annuler
                        </Button>
                        <Button
                            onClick={confirmToggleStatus}
                            className={service.actif ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            {service.actif ? 'Désactiver' : 'Activer'} le service
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
