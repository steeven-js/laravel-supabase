import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Edit,
    FileText,
    Building2,
    MapPin,
    Phone,
    Mail,
    Calendar,
    User,
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
    Send,
    History,
    Plus,
    Loader2
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Client {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    code_postal?: string;
    pays?: string;
    actif: boolean;
    notes?: string;
    entreprise?: {
        id: number;
        nom: string;
        nom_commercial?: string;
    };
    devis: Array<{
        id: number;
        numero_devis: string;
        objet: string;
        statut: string;
        date_devis: string;
        montant_ttc: number;
    }>;
    emails?: Array<{
        id: number;
        objet: string;
        contenu: string;
        date_envoi: string;
        statut: 'envoye' | 'echec';
        user: {
            id: number;
            name: string;
        };
    }>;
    created_at: string;
}

interface Props {
    client: Client;
    auth: {
        user: {
            id: number;
            name: string;
        };
    };
}

const breadcrumbs = (client: Client): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Clients',
        href: '/clients',
    },
    {
        title: `${client.prenom} ${client.nom}`,
        href: `/clients/${client.id}`,
    },
];

export default function ClientsShow({ client, auth }: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'stats' | 'emails'>('overview');
    const [isComposingEmail, setIsComposingEmail] = useState(false);
    const [emailForm, setEmailForm] = useState({
        objet: '',
        contenu: ''
    });
    const [isSendingEmail, setIsSendingEmail] = useState(false);

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
    const stats = {
        totalQuotes: client.devis.length,
        acceptedQuotes: client.devis.filter(d => d.statut === 'accepte').length,
        pendingQuotes: client.devis.filter(d => d.statut === 'envoye').length,
        rejectedQuotes: client.devis.filter(d => d.statut === 'refuse').length,
        totalRevenue: client.devis
            .filter(d => d.statut === 'accepte')
            .reduce((sum, d) => sum + d.montant_ttc, 0),
        averageQuoteValue: client.devis.length > 0
            ? client.devis.reduce((sum, d) => sum + d.montant_ttc, 0) / client.devis.length
            : 0,
        conversionRate: client.devis.length > 0
            ? (client.devis.filter(d => d.statut === 'accepte').length / client.devis.length) * 100
            : 0
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copié dans le presse-papiers`);
    };

    const tabs = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: User },
        { id: 'quotes', label: 'Devis', icon: FileText },
        { id: 'stats', label: 'Statistiques', icon: BarChart3 },
        { id: 'emails', label: 'Emails', icon: Mail }
    ] as const;

    const handleSendEmail = async () => {
        if (!emailForm.objet.trim() || !emailForm.contenu.trim()) {
            toast.error('Veuillez remplir tous les champs');
            return;
        }

        setIsSendingEmail(true);

        try {
            await router.post(`/clients/${client.id}/send-email`, emailForm, {
                onSuccess: () => {
                    toast.success('Email envoyé avec succès !');
                    setEmailForm({ objet: '', contenu: '' });
                    setIsComposingEmail(false);
                },
                onError: (errors) => {
                    console.error('Erreur lors de l\'envoi:', errors);
                    toast.error('Erreur lors de l\'envoi de l\'email');
                },
                onFinish: () => {
                    setIsSendingEmail(false);
                }
            });
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de l\'envoi de l\'email');
            setIsSendingEmail(false);
        }
    };

    const formatEmailDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const userEmails = client.emails?.filter(email => email.user?.id === auth.user.id) || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs(client)}>
            <Head title={`${client.prenom} ${client.nom}`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Bouton retour */}
                <div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/clients">
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
                                                {client.prenom} {client.nom}
                                            </h1>
                                            <Badge
                                                variant={client.actif ? 'default' : 'secondary'}
                                                className="text-sm"
                                            >
                                                {client.actif ? 'Actif' : 'Inactif'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Client depuis le {formatDate(client.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Euro className="h-4 w-4" />
                                                {formatPrice(stats.totalRevenue)} de CA
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FileText className="h-4 w-4" />
                                                {stats.totalQuotes} devis
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
                                        <Link href={`/clients/${client.id}/edit`}>
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
                        {/* Informations de contact */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Informations de contact
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Email</p>
                                                        <p className="text-sm text-muted-foreground">{client.email}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(client.email, 'Email')}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {client.telephone && (
                                            <div className="group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">Téléphone</p>
                                                            <p className="text-sm text-muted-foreground">{client.telephone}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(client.telephone!, 'Téléphone')}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {(client.adresse || client.ville) && (
                                        <>
                                            <Separator />
                                            <div className="group">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium">Adresse</p>
                                                            <div className="text-sm text-muted-foreground space-y-1">
                                                                {client.adresse && <div>{client.adresse}</div>}
                                                                {client.ville && (
                                                                    <div>
                                                                        {client.code_postal && `${client.code_postal} `}
                                                                        {client.ville}
                                                                        {client.pays && client.pays !== 'France' && `, ${client.pays}`}
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
                                                                client.adresse,
                                                                client.code_postal && client.ville ? `${client.code_postal} ${client.ville}` : client.ville,
                                                                client.pays && client.pays !== 'France' ? client.pays : null
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

                                    {client.entreprise && (
                                        <>
                                            <Separator />
                                            <div className="flex items-center gap-3">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">Entreprise</p>
                                                    <Link
                                                        href={`/entreprises/${client.entreprise.id}`}
                                                        className="text-sm text-primary hover:underline"
                                                    >
                                                        {client.entreprise.nom_commercial || client.entreprise.nom}
                                                    </Link>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {client.notes && (
                                        <>
                                            <Separator />
                                            <div>
                                                <p className="text-sm font-medium mb-2">Notes</p>
                                                <div className="bg-muted/50 rounded-lg p-3">
                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                        {client.notes}
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
                                                <span className="text-sm font-medium">Devis acceptés</span>
                                            </div>
                                            <span className="font-bold text-blue-700 dark:text-blue-400">
                                                {stats.acceptedQuotes}/{stats.totalQuotes}
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
                                        <Link href={`/devis/create?client_id=${client.id}`}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Nouveau devis
                                        </Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <Link href={`/clients/${client.id}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Modifier le client
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

                {activeTab === 'quotes' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Devis ({client.devis.length})
                                </CardTitle>
                                <Button asChild>
                                    <Link href={`/devis/create?client_id=${client.id}`}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Nouveau devis
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {client.devis.length > 0 ? (
                                <div className="rounded-md border table-responsive">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Numéro</TableHead>
                                                <TableHead>Objet</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Statut</TableHead>
                                                <TableHead className="text-right">Montant</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {client.devis.map((devis) => (
                                                <TableRow key={devis.id} className="group">
                                                    <TableCell className="font-medium">
                                                        <Link
                                                            href={`/devis/${devis.id}`}
                                                            className="text-primary hover:underline"
                                                        >
                                                            {devis.numero_devis}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="max-w-xs truncate">
                                                            {devis.objet}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{formatDateShort(devis.date_devis)}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={getStatusVariant(devis.statut)}
                                                            className="flex items-center gap-1 w-fit"
                                                        >
                                                            {getStatusIcon(devis.statut)}
                                                            {formatStatut(devis.statut)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatPrice(devis.montant_ttc)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1 table-actions">
                                                            <Button size="sm" variant="ghost" asChild>
                                                                <Link href={`/devis/${devis.id}`}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button size="sm" variant="ghost" asChild>
                                                                <Link href={`/devis/${devis.id}/edit`}>
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
                                        <FileText className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-2">Aucun devis</h3>
                                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                        Ce client n'a pas encore de devis. Commencez par créer son premier devis.
                                    </p>
                                    <Button asChild>
                                        <Link href={`/devis/create?client_id=${client.id}`}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Créer un devis
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
                                        <p className="text-sm font-medium text-muted-foreground">Total Devis</p>
                                        <p className="text-2xl font-bold">{stats.totalQuotes}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/20 rounded-lg flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                                        <p className="text-sm font-medium text-muted-foreground">Devis Acceptés</p>
                                        <p className="text-2xl font-bold">{stats.acceptedQuotes}</p>
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

                        {/* Répartition des statuts */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Répartition des devis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                                            <span className="text-sm">Acceptés</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{stats.acceptedQuotes}</span>
                                            <div className="w-20 h-2 bg-muted rounded-full">
                                                <div
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${stats.totalQuotes > 0 ? (stats.acceptedQuotes / stats.totalQuotes) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                            <span className="text-sm">En attente</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{stats.pendingQuotes}</span>
                                            <div className="w-20 h-2 bg-muted rounded-full">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${stats.totalQuotes > 0 ? (stats.pendingQuotes / stats.totalQuotes) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                                            <span className="text-sm">Refusés</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{stats.rejectedQuotes}</span>
                                            <div className="w-20 h-2 bg-muted rounded-full">
                                                <div
                                                    className="h-full bg-red-500 rounded-full"
                                                    style={{ width: `${stats.totalQuotes > 0 ? (stats.rejectedQuotes / stats.totalQuotes) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Informations supplémentaires */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Informations commerciales</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Panier moyen</p>
                                        <p className="text-lg font-semibold">{formatPrice(stats.averageQuoteValue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Dernier devis</p>
                                        <p className="text-lg font-semibold">
                                            {client.devis.length > 0
                                                ? formatDateShort(client.devis[0].date_devis)
                                                : 'Aucun'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Prochaines actions recommandées</p>
                                    <div className="space-y-2">
                                        {stats.pendingQuotes > 0 && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-orange-500" />
                                                <span>Relancer {stats.pendingQuotes} devis en attente</span>
                                            </div>
                                        )}
                                        {stats.totalQuotes === 0 && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <FileText className="h-4 w-4 text-blue-500" />
                                                <span>Créer le premier devis pour ce client</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-green-500" />
                                            <span>Envoyer une newsletter personnalisée</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'emails' && (
                    <div className="space-y-6">
                        {/* Composer un nouvel email */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Send className="h-5 w-5" />
                                        Nouvel email pour {client.prenom} {client.nom}
                                    </CardTitle>
                                    {!isComposingEmail && (
                                        <Button onClick={() => setIsComposingEmail(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Composer
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            {isComposingEmail && (
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span><strong>À :</strong> {client.email}</span>
                                        <span><strong>De :</strong> {auth.user.name}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email-subject">Objet</Label>
                                        <Input
                                            id="email-subject"
                                            value={emailForm.objet}
                                            onChange={(e) => setEmailForm(prev => ({ ...prev, objet: e.target.value }))}
                                            placeholder="Objet de l'email..."
                                            disabled={isSendingEmail}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email-content">Message</Label>
                                        <Textarea
                                            id="email-content"
                                            value={emailForm.contenu}
                                            onChange={(e) => setEmailForm(prev => ({ ...prev, contenu: e.target.value }))}
                                            placeholder="Tapez votre message ici..."
                                            rows={8}
                                            disabled={isSendingEmail}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={handleSendEmail}
                                            disabled={isSendingEmail}
                                        >
                                            {isSendingEmail ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Envoi en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Envoyer
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsComposingEmail(false);
                                                setEmailForm({ objet: '', contenu: '' });
                                            }}
                                            disabled={isSendingEmail}
                                        >
                                            Annuler
                                        </Button>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* Historique des emails */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Historique de mes emails
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Emails que vous avez envoyés à ce client ({userEmails.length})
                                </p>
                            </CardHeader>
                            <CardContent>
                                {userEmails.length > 0 ? (
                                    <div className="space-y-4">
                                        {userEmails.map((email) => (
                                            <div key={email.id} className="border rounded-lg p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <h4 className="font-medium">{email.objet}</h4>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <span>Envoyé le {formatEmailDate(email.date_envoi)}</span>
                                                            <Badge
                                                                variant={email.statut === 'envoye' ? 'default' : 'destructive'}
                                                                className="text-xs"
                                                            >
                                                                {email.statut === 'envoye' ? (
                                                                    <>
                                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                                        Envoyé
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="mr-1 h-3 w-3" />
                                                                        Échec
                                                                    </>
                                                                )}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-muted-foreground bg-muted/30 rounded p-3">
                                                    <p className="whitespace-pre-wrap">{email.contenu}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                        <h3 className="mt-4 text-lg font-medium">Aucun email envoyé</h3>
                                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                            Vous n'avez pas encore envoyé d'email à ce client. Commencez par composer votre premier message.
                                        </p>
                                        <Button onClick={() => setIsComposingEmail(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Composer un email
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
