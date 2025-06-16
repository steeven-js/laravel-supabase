import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Edit,
    FileText,
    Building2,
    MapPin,
    Phone,
    Mail,
    Calendar,
    Users,
    Euro,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Eye,
    Download,
    Share,
    MoreHorizontal,
    Copy,
    CheckCircle,
    XCircle,
    Clock,
    FileX,
    Globe,
    UserPlus,
    History,
    Trash2,
    RotateCcw
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Entreprise {
    id: number;
    nom: string;
    nom_commercial?: string;
    siret?: string;
    siren?: string;
    secteur_activite?: string;
    adresse?: string;
    ville?: string;
    code_postal?: string;
    pays?: string;
    telephone?: string;
    email?: string;
    site_web?: string;

    active: boolean;
    notes?: string;
    clients: Array<{
        id: number;
        nom: string;
        prenom: string;
        email: string;
        telephone?: string;
        actif: boolean;
        devis: Array<{
            id: number;
            numero_devis: string;
            objet: string;
            statut: string;
            date_devis: string;
            montant_ttc: number;
        }>;
    }>;
    created_at: string;
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
    entreprise: Entreprise;
    historique: HistoriqueAction[];
}

const breadcrumbs = (entreprise: Entreprise): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Entreprises',
        href: '/entreprises',
    },
    {
        title: entreprise.nom_commercial || entreprise.nom,
        href: `/entreprises/${entreprise.id}`,
    },
];

export default function EntreprisesShow({ entreprise, historique }: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'stats' | 'historique'>('overview');

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

    const getStatusVariant = (statut: string) => {
        switch (statut) {
            case 'accepte':
                return 'default';
            case 'envoye':
                return 'outline';
            case 'refuse':
                return 'destructive';
            case 'expire':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getStatusIcon = (statut: string) => {
        switch (statut) {
            case 'accepte':
                return <CheckCircle className="h-4 w-4" />;
            case 'envoye':
                return <Eye className="h-4 w-4" />;
            case 'refuse':
                return <XCircle className="h-4 w-4" />;
            case 'expire':
                return <FileX className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
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

    // Calculs des statistiques
    const allDevis = entreprise.clients.flatMap(client =>
        client.devis.map(devis => ({ ...devis, client }))
    );

    const stats = {
        totalClients: entreprise.clients.length,
        activeClients: entreprise.clients.filter(c => c.actif).length,
        totalQuotes: allDevis.length,
        acceptedQuotes: allDevis.filter(d => d.statut === 'accepte').length,
        pendingQuotes: allDevis.filter(d => d.statut === 'envoye').length,
        rejectedQuotes: allDevis.filter(d => d.statut === 'refuse').length,
        totalRevenue: allDevis
            .filter(d => d.statut === 'accepte')
            .reduce((sum, d) => sum + d.montant_ttc, 0),
        averageQuoteValue: allDevis.length > 0
            ? allDevis.reduce((sum, d) => sum + d.montant_ttc, 0) / allDevis.length
            : 0,
        conversionRate: allDevis.length > 0
            ? (allDevis.filter(d => d.statut === 'accepte').length / allDevis.length) * 100
            : 0
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
                return <FileX className="h-4 w-4" />;
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

    const tabs = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: Building2 },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'stats', label: 'Statistiques', icon: BarChart3 },
        { id: 'historique', label: 'Historique', icon: History }
    ] as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs(entreprise)}>
            <Head title={entreprise.nom_commercial || entreprise.nom} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Bouton retour */}
                <div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/entreprises">
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
                                                {entreprise.nom_commercial || entreprise.nom}
                                            </h1>
                                            <Badge
                                                variant={entreprise.active ? 'default' : 'secondary'}
                                                className="text-sm"
                                            >
                                                {entreprise.active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Entreprise depuis le {formatDate(entreprise.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Euro className="h-4 w-4" />
                                                {formatPrice(stats.totalRevenue)} de CA
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {stats.totalClients} clients
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button variant="outline" size="sm">
                                        <Share className="mr-2 h-4 w-4" />
                                        Partager
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Exporter
                                    </Button>
                                    <Button asChild>
                                        <Link href={`/entreprises/${entreprise.id}/edit`}>
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
                                    </button>
                                );
                            })}
                        </div>
                    </CardHeader>
                </Card>

                {/* Contenu des onglets */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Informations de l'entreprise */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Informations de l'entreprise
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {entreprise.nom_commercial && entreprise.nom_commercial !== entreprise.nom && (
                                        <div>
                                            <p className="text-sm font-medium">Nom légal</p>
                                            <p className="text-sm text-muted-foreground">{entreprise.nom}</p>
                                        </div>
                                    )}

                                    {entreprise.secteur_activite && (
                                        <div>
                                            <p className="text-sm font-medium">Secteur d'activité</p>
                                            <p className="text-sm text-muted-foreground">{entreprise.secteur_activite}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {entreprise.email && (
                                            <div className="group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">Email</p>
                                                            <p className="text-sm text-muted-foreground">{entreprise.email}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(entreprise.email!, 'Email')}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {entreprise.telephone && (
                                            <div className="group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">Téléphone</p>
                                                            <p className="text-sm text-muted-foreground">{entreprise.telephone}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(entreprise.telephone!, 'Téléphone')}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {entreprise.site_web && (
                                        <>
                                            <Separator />
                                            <div className="group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">Site web</p>
                                                            <a
                                                                href={entreprise.site_web}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-primary hover:underline"
                                                            >
                                                                {entreprise.site_web}
                                                            </a>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(entreprise.site_web!, 'Site web')}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {(entreprise.adresse || entreprise.ville) && (
                                        <>
                                            <Separator />
                                            <div className="group">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium">Adresse</p>
                                                            <div className="text-sm text-muted-foreground space-y-1">
                                                                {entreprise.adresse && <div>{entreprise.adresse}</div>}
                                                                {entreprise.ville && (
                                                                    <div>
                                                                        {entreprise.code_postal && `${entreprise.code_postal} `}
                                                                        {entreprise.ville}
                                                                        {entreprise.pays && entreprise.pays !== 'France' && `, ${entreprise.pays}`}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            const address = [
                                                                entreprise.adresse,
                                                                entreprise.code_postal && entreprise.ville ? `${entreprise.code_postal} ${entreprise.ville}` : entreprise.ville,
                                                                entreprise.pays && entreprise.pays !== 'France' ? entreprise.pays : null
                                                            ].filter(Boolean).join(', ');
                                                            copyToClipboard(address, 'Adresse');
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {(entreprise.siret || entreprise.siren) && (
                                        <>
                                            <Separator />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {entreprise.siret && (
                                                    <div>
                                                        <p className="text-sm font-medium">SIRET</p>
                                                        <p className="text-sm text-muted-foreground font-mono">{entreprise.siret}</p>
                                                    </div>
                                                )}
                                                {entreprise.siren && (
                                                    <div>
                                                        <p className="text-sm font-medium">SIREN</p>
                                                        <p className="text-sm text-muted-foreground font-mono">{entreprise.siren}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {entreprise.notes && (
                                        <>
                                            <Separator />
                                            <div>
                                                <p className="text-sm font-medium mb-2">Notes</p>
                                                <div className="bg-muted/50 rounded-lg p-3">
                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                        {entreprise.notes}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Statistiques rapides */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Aperçu rapide
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                <span className="text-sm font-medium">CA Total</span>
                                            </div>
                                            <span className="font-bold text-green-700 dark:text-green-400">
                                                {formatPrice(stats.totalRevenue)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                <span className="text-sm font-medium">Clients actifs</span>
                                            </div>
                                            <span className="font-bold text-blue-700 dark:text-blue-400">
                                                {stats.activeClients}/{stats.totalClients}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                                <span className="text-sm font-medium">Taux conversion</span>
                                            </div>
                                            <span className="font-bold text-orange-700 dark:text-orange-400">
                                                {stats.conversionRate.toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                                <span className="text-sm font-medium">Panier moyen</span>
                                            </div>
                                            <span className="font-bold text-purple-700 dark:text-purple-400">
                                                {formatPrice(stats.averageQuoteValue)}
                                            </span>
                                        </div>


                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions rapides</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button className="w-full justify-start" asChild>
                                        <Link href={`/clients/create?entreprise_id=${entreprise.id}`}>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Nouveau client
                                        </Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <Link href={`/entreprises/${entreprise.id}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Modifier l'entreprise
                                        </Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start">
                                        <Mail className="mr-2 h-4 w-4" />
                                        Envoyer un email
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'clients' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Clients ({entreprise.clients.length})
                                </CardTitle>
                                <Button asChild>
                                    <Link href={`/clients/create?entreprise_id=${entreprise.id}`}>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Nouveau client
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {entreprise.clients.length > 0 ? (
                                <div className="rounded-md border table-responsive">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nom</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Téléphone</TableHead>
                                                <TableHead>Devis</TableHead>
                                                <TableHead>Statut</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {entreprise.clients.map((client) => (
                                                <TableRow key={client.id} className="group">
                                                    <TableCell className="font-medium">
                                                        <Link
                                                            href={`/clients/${client.id}`}
                                                            className="text-primary hover:underline"
                                                        >
                                                            {client.prenom} {client.nom}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>{client.email}</TableCell>
                                                    <TableCell>{client.telephone || '-'}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span>{client.devis.length}</span>
                                                            {client.devis.length > 0 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    ({client.devis.filter(d => d.statut === 'accepte').length} acceptés)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={client.actif ? 'default' : 'secondary'}>
                                                            {client.actif ? 'Actif' : 'Inactif'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1 table-actions">
                                                            <Button size="sm" variant="ghost" asChild>
                                                                <Link href={`/clients/${client.id}`}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button size="sm" variant="ghost" asChild>
                                                                <Link href={`/clients/${client.id}/edit`}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button size="sm" variant="ghost">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Users className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-2">Aucun client</h3>
                                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                        Cette entreprise n'a pas encore de clients. Commencez par créer le premier client.
                                    </p>
                                    <Button asChild>
                                        <Link href={`/clients/create?entreprise_id=${entreprise.id}`}>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Créer un client
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'stats' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Statistiques détaillées */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                                        <p className="text-2xl font-bold">{stats.totalClients}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/20 rounded-lg flex items-center justify-center">
                                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm">
                                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                    <span className="text-green-600">+12% ce mois</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Clients Actifs</p>
                                        <p className="text-2xl font-bold">{stats.activeClients}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-950/20 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm">
                                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                    <span className="text-green-600">+8% ce mois</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Taux de Conversion</p>
                                        <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/20 rounded-lg flex items-center justify-center">
                                        <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm">
                                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                                    <span className="text-red-600">-2% ce mois</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">CA Total</p>
                                        <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/20 rounded-lg flex items-center justify-center">
                                        <Euro className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm">
                                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                    <span className="text-green-600">+15% ce mois</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Devis</p>
                                        <p className="text-2xl font-bold">{stats.totalQuotes}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/20 rounded-lg flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm">
                                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                    <span className="text-green-600">+7% ce mois</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Devis Acceptés</p>
                                        <p className="text-2xl font-bold">{stats.acceptedQuotes}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/20 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm">
                                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                    <span className="text-green-600">+5% ce mois</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Panier Moyen</p>
                                        <p className="text-2xl font-bold">{formatPrice(stats.averageQuoteValue)}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-950/20 rounded-lg flex items-center justify-center">
                                        <Euro className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm">
                                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                                    <span className="text-red-600">-3% ce mois</span>
                                </div>
                            </CardContent>
                        </Card>


                    </div>
                )}

                {activeTab === 'historique' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Historique des actions
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Suivi de toutes les actions effectuées sur cette entreprise ({historique.length})
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
                                                    {action.donnees_supplementaires?.email_destinataire && (
                                                        <span>• Envoyé à {action.donnees_supplementaires.email_destinataire}</span>
                                                    )}
                                                    {action.donnees_supplementaires?.numero_devis && (
                                                        <span>• Devis {action.donnees_supplementaires.numero_devis}</span>
                                                    )}
                                                    {action.donnees_supplementaires?.numero_facture && (
                                                        <span>• Facture {action.donnees_supplementaires.numero_facture}</span>
                                                    )}
                                                    {action.donnees_supplementaires?.numero_ticket && (
                                                        <span>• Ticket #{action.donnees_supplementaires.numero_ticket}</span>
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
                                        Aucune action n'a encore été enregistrée pour cette entreprise. Les actions futures apparaîtront ici automatiquement.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
