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
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Calendar,
    Euro,
    User,
    Building2,
    Receipt,
    Mail,
    Download,
    Eye,
    Copy,
    Share,
    Info,
    DollarSign,
    FileCheck,
    CreditCard,
    AlertTriangle,
    ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Facture {
    id: number;
    numero_facture: string;
    client: {
        id: number;
        nom: string;
        prenom: string;
        email: string;
        telephone?: string;
        entreprise?: {
            id: number;
            nom: string;
            nom_commercial?: string;
        };
    };
    devis?: {
        id: number;
        numero_devis: string;
    };
    objet: string;
    description?: string;
    statut: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee';
    date_facture: string;
    date_echeance: string;
    date_paiement?: string;
    montant_ht: number;
    montant_ttc: number;
    taux_tva: number;
    conditions_paiement?: string;
    notes?: string;
    mode_paiement?: string;
    reference_paiement?: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    facture: Facture;
}

const getStatusStyles = (statut: string) => {
    switch (statut) {
        case 'payee':
            return 'bg-green-600 text-white hover:bg-green-700';
        case 'envoyee':
            return 'bg-blue-600 text-white hover:bg-blue-700';
        case 'en_retard':
            return 'bg-red-600 text-white hover:bg-red-700';
        case 'annulee':
            return 'bg-gray-600 text-white hover:bg-gray-700';
        case 'brouillon':
            return 'bg-yellow-600 text-white hover:bg-yellow-700';
        default:
            return 'bg-gray-600 text-white hover:bg-gray-700';
    }
};

const getStatusIcon = (statut: string) => {
    switch (statut) {
        case 'payee':
            return <CheckCircle className="h-4 w-4" />;
        case 'envoyee':
            return <Clock className="h-4 w-4" />;
        case 'en_retard':
            return <AlertCircle className="h-4 w-4" />;
        case 'annulee':
            return <XCircle className="h-4 w-4" />;
        case 'brouillon':
            return <FileText className="h-4 w-4" />;
        default:
            return <Receipt className="h-4 w-4" />;
    }
};

const formatStatut = (statut: string) => {
    switch (statut) {
        case 'brouillon':
            return 'Brouillon';
        case 'envoyee':
            return 'Envoyée';
        case 'payee':
            return 'Payée';
        case 'en_retard':
            return 'En retard';
        case 'annulee':
            return 'Annulée';
        default:
            return statut;
    }
};

const breadcrumbs = (facture: Facture): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Factures',
        href: '/factures',
    },
    {
        title: facture.numero_facture,
        href: `/factures/${facture.id}`,
    },
];

export default function FactureShow({ facture }: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'documents'>('overview');

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

    const isRetard = () => {
        return new Date(facture.date_echeance) < new Date() &&
               !['payee', 'annulee'].includes(facture.statut);
    };

    const getDelaiPaiement = () => {
        const dateEcheance = new Date(facture.date_echeance);
        const aujourdhui = new Date();
        const diffTime = dateEcheance.getTime() - aujourdhui.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return `En retard de ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
        } else if (diffDays === 0) {
            return 'Échéance aujourd\'hui';
        } else {
            return `${diffDays} jour${diffDays > 1 ? 's' : ''} restant${diffDays > 1 ? 's' : ''}`;
        }
    };

    const handleMarquerPayee = () => {
        router.patch(`/factures/${facture.id}/marquer-payee`, {}, {
            onSuccess: () => {
                toast.success('Facture marquée comme payée');
            },
            onError: () => {
                toast.error('Erreur lors de la mise à jour');
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(facture)}>
            <Head title={`Facture ${facture.numero_facture}`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/factures">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour aux factures
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-bold tracking-tight">{facture.numero_facture}</h1>
                                <Badge className={`${getStatusStyles(facture.statut)} border-0`}>
                                    <span className="flex items-center gap-1">
                                        {getStatusIcon(facture.statut)}
                                        {formatStatut(facture.statut)}
                                    </span>
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">{facture.objet}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {facture.statut === 'brouillon' && (
                            <Button variant="outline" asChild>
                                <Link href={`/factures/${facture.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Modifier
                                </Link>
                            </Button>
                        )}

                        {facture.statut === 'envoyee' && (
                            <Button
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={handleMarquerPayee}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marquer comme payée
                            </Button>
                        )}

                        <Button variant="outline" asChild>
                            <a href={`/factures/${facture.id}/pdf`} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" />
                                Voir PDF
                            </a>
                        </Button>

                        <Button variant="outline" asChild>
                            <a href={`/factures/${facture.id}/telecharger-pdf`}>
                                <Download className="mr-2 h-4 w-4" />
                                Télécharger
                            </a>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => copyToClipboard(facture.numero_facture, 'Numéro de facture')}
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Copier
                        </Button>
                    </div>
                </div>

                {/* Alerte retard */}
                {isRetard() && (
                    <Card className="border-red-200 bg-red-50 dark:bg-red-950/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <div>
                                    <h4 className="font-medium text-red-900 dark:text-red-100">
                                        Facture en retard de paiement
                                    </h4>
                                    <p className="text-sm text-red-700 dark:text-red-200">
                                        {getDelaiPaiement()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Onglets */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex space-x-1">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    activeTab === 'overview'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                <Info className="w-4 h-4 inline mr-2" />
                                Vue d'ensemble
                            </button>
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    activeTab === 'details'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                <FileText className="w-4 h-4 inline mr-2" />
                                Détails
                            </button>
                            <button
                                onClick={() => setActiveTab('documents')}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    activeTab === 'documents'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                <FileCheck className="w-4 h-4 inline mr-2" />
                                Documents
                            </button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Contenu des onglets */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Contenu principal */}
                    <div className="xl:col-span-3 space-y-6">
                        {activeTab === 'overview' && (
                            <>
                                {/* Résumé financier */}
                                <Card className="border-0 shadow-md">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Euro className="w-5 h-5 text-green-600" />
                                            Résumé financier
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="text-center p-4 bg-muted/30 rounded-lg">
                                                <div className="text-2xl font-bold text-muted-foreground mb-1">
                                                    {formatPrice(facture.montant_ht)}
                                                </div>
                                                <p className="text-sm text-muted-foreground">Montant HT</p>
                                            </div>
                                            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                                <div className="text-2xl font-bold text-blue-600 mb-1">
                                                    {formatPrice(facture.montant_ttc - facture.montant_ht)}
                                                </div>
                                                <p className="text-sm text-muted-foreground">TVA ({facture.taux_tva}%)</p>
                                            </div>
                                            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                                <div className="text-2xl font-bold text-green-600 mb-1">
                                                    {formatPrice(facture.montant_ttc)}
                                                </div>
                                                <p className="text-sm text-muted-foreground">Montant TTC</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Informations principales */}
                                <Card className="border-0 shadow-md">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                            Informations de facturation
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center py-2 border-b border-muted">
                                                    <span className="font-medium">Date d'émission</span>
                                                    <span>{formatDate(facture.date_facture)}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-muted">
                                                    <span className="font-medium">Date d'échéance</span>
                                                    <span className={isRetard() ? 'text-red-600 font-semibold' : ''}>
                                                        {formatDate(facture.date_echeance)}
                                                    </span>
                                                </div>
                                                {facture.date_paiement && (
                                                    <div className="flex justify-between items-center py-2 border-b border-muted">
                                                        <span className="font-medium">Date de paiement</span>
                                                        <span className="text-green-600">{formatDate(facture.date_paiement)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center py-2 border-b border-muted">
                                                    <span className="font-medium">Délai de paiement</span>
                                                    <span className={isRetard() ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                                                        {getDelaiPaiement()}
                                                    </span>
                                                </div>
                                                {facture.mode_paiement && (
                                                    <div className="flex justify-between items-center py-2 border-b border-muted">
                                                        <span className="font-medium">Mode de paiement</span>
                                                        <span>{facture.mode_paiement}</span>
                                                    </div>
                                                )}
                                                {facture.reference_paiement && (
                                                    <div className="flex justify-between items-center py-2 border-b border-muted">
                                                        <span className="font-medium">Référence</span>
                                                        <span>{facture.reference_paiement}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {activeTab === 'details' && (
                            <Card className="border-0 shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Détails de la facture
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {facture.description && (
                                        <div>
                                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                <Info className="w-4 h-4" />
                                                Description
                                            </h3>
                                            <div className="bg-muted/30 p-4 rounded-lg">
                                                <p className="whitespace-pre-wrap">{facture.description}</p>
                                            </div>
                                        </div>
                                    )}

                                    {facture.conditions_paiement && (
                                        <div>
                                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                <CreditCard className="w-4 h-4" />
                                                Conditions de paiement
                                            </h3>
                                            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                                                <p className="whitespace-pre-wrap">{facture.conditions_paiement}</p>
                                            </div>
                                        </div>
                                    )}

                                    {facture.notes && (
                                        <div>
                                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                Notes
                                            </h3>
                                            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                                                <p className="whitespace-pre-wrap">{facture.notes}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'documents' && (
                            <Card className="border-0 shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileCheck className="w-5 h-5" />
                                        Documents et actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Button variant="outline" className="h-auto p-4 justify-start" asChild>
                                            <a href={`/factures/${facture.id}/pdf`} target="_blank" rel="noopener noreferrer">
                                                <div className="flex items-center gap-3">
                                                    <Eye className="w-5 h-5" />
                                                    <div>
                                                        <div className="font-medium">Aperçu PDF</div>
                                                        <div className="text-sm text-muted-foreground">Voir la facture en PDF</div>
                                                    </div>
                                                </div>
                                            </a>
                                        </Button>

                                        <Button variant="outline" className="h-auto p-4 justify-start" asChild>
                                            <a href={`/factures/${facture.id}/telecharger-pdf`}>
                                                <div className="flex items-center gap-3">
                                                    <Download className="w-5 h-5" />
                                                    <div>
                                                        <div className="font-medium">Télécharger PDF</div>
                                                        <div className="text-sm text-muted-foreground">Enregistrer localement</div>
                                                    </div>
                                                </div>
                                            </a>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="h-auto p-4 justify-start"
                                            onClick={() => copyToClipboard(facture.numero_facture, 'Numéro de facture')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Copy className="w-5 h-5" />
                                                <div>
                                                    <div className="font-medium">Copier référence</div>
                                                    <div className="text-sm text-muted-foreground">Copier le numéro</div>
                                                </div>
                                            </div>
                                        </Button>

                                        <Button variant="outline" className="h-auto p-4 justify-start">
                                            <div className="flex items-center gap-3">
                                                <Share className="w-5 h-5" />
                                                <div>
                                                    <div className="font-medium">Partager</div>
                                                    <div className="text-sm text-muted-foreground">Envoyer par email</div>
                                                </div>
                                            </div>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Informations client */}
                        <Card className="border-0 shadow-md">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    Client
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                        {facture.client.entreprise ? (
                                            <Building2 className="w-6 h-6 text-blue-600" />
                                        ) : (
                                            <User className="w-6 h-6 text-blue-600" />
                                        )}
                                    </div>
                                    <h3 className="font-semibold">{facture.client.prenom} {facture.client.nom}</h3>
                                    {facture.client.entreprise && (
                                        <p className="text-sm text-muted-foreground">
                                            {facture.client.entreprise.nom_commercial || facture.client.entreprise.nom}
                                        </p>
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <span>{facture.client.email}</span>
                                    </div>
                                    {facture.client.telephone && (
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 text-muted-foreground">📞</span>
                                            <span>{facture.client.telephone}</span>
                                        </div>
                                    )}
                                </div>

                                <Button variant="outline" size="sm" asChild className="w-full">
                                    <Link href={`/clients/${facture.client.id}`}>
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Voir le profil
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Devis associé */}
                        {facture.devis && (
                            <Card className="border-0 shadow-md">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2">
                                        <Receipt className="w-5 h-5 text-purple-600" />
                                        Devis associé
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Receipt className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <h3 className="font-semibold">{facture.devis.numero_devis}</h3>
                                        <p className="text-sm text-muted-foreground">Devis transformé en facture</p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild className="w-full">
                                        <Link href={`/devis/${facture.devis.id}`}>
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Voir le devis
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Actions rapides */}
                        <Card className="border-0 shadow-md">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    Actions rapides
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {facture.statut === 'brouillon' && (
                                    <Button variant="outline" size="sm" asChild className="w-full">
                                        <Link href={`/factures/${facture.id}/edit`}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Modifier
                                        </Link>
                                    </Button>
                                )}

                                {facture.statut === 'envoyee' && (
                                    <Button
                                        size="sm"
                                        className="w-full bg-green-600 hover:bg-green-700"
                                        onClick={handleMarquerPayee}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Marquer payée
                                    </Button>
                                )}

                                <Button variant="outline" size="sm" asChild className="w-full">
                                    <a href={`/factures/${facture.id}/telecharger-pdf`}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Télécharger
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
