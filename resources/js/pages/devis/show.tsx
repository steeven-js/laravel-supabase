import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
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
    MailCheck,
    MailX,
    Download,
    Eye,
    Copy,
    Share,
    Info,
    DollarSign,
    FileCheck
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Devis {
    id: number;
    numero_devis: string;
    objet: string;
    statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
    statut_envoi: 'non_envoye' | 'envoye' | 'echec_envoi';
    date_devis: string;
    date_validite: string;
    date_envoi_client?: string;
    date_envoi_admin?: string;
    montant_ht: number;
    taux_tva: number;
    montant_ttc: number;
    notes?: string;
    description?: string;
    conditions?: string;
    peut_etre_transforme_en_facture?: boolean;
    peut_etre_envoye?: boolean;
    facture?: {
        id: number;
        numero_facture: string;
    };
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
    created_at: string;
    updated_at: string;
}

interface Props {
    devis: Devis;
}

const getStatusStyles = (statut: string) => {
    switch (statut) {
        case 'accepte':
            return 'bg-green-600 text-white hover:bg-green-700';
        case 'envoye':
            return 'bg-blue-600 text-white hover:bg-blue-700';
        case 'refuse':
            return 'bg-red-600 text-white hover:bg-red-700';
        case 'expire':
            return 'bg-orange-600 text-white hover:bg-orange-700';
        case 'brouillon':
            return 'bg-gray-600 text-white hover:bg-gray-700';
        default:
            return 'bg-gray-600 text-white hover:bg-gray-700';
    }
};

const getStatusIcon = (statut: string) => {
    switch (statut) {
        case 'accepte':
            return <CheckCircle className="h-4 w-4" />;
        case 'envoye':
            return <Clock className="h-4 w-4" />;
        case 'refuse':
            return <XCircle className="h-4 w-4" />;
        case 'expire':
            return <AlertCircle className="h-4 w-4" />;
        default:
            return <FileText className="h-4 w-4" />;
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

const getStatusEnvoiStyles = (statutEnvoi: string) => {
    switch (statutEnvoi) {
        case 'envoye':
            return 'bg-emerald-600 text-white hover:bg-emerald-700';
        case 'echec_envoi':
            return 'bg-red-600 text-white hover:bg-red-700';
        case 'non_envoye':
            return 'bg-amber-600 text-white hover:bg-amber-700';
        default:
            return 'bg-gray-600 text-white hover:bg-gray-700';
    }
};

const getStatusEnvoiIcon = (statutEnvoi: string) => {
    switch (statutEnvoi) {
        case 'envoye':
            return <MailCheck className="h-4 w-4" />;
        case 'echec_envoi':
            return <MailX className="h-4 w-4" />;
        default:
            return <Mail className="h-4 w-4" />;
    }
};

const formatStatutEnvoi = (statutEnvoi: string) => {
    switch (statutEnvoi) {
        case 'non_envoye':
            return 'Non envoyé';
        case 'envoye':
            return 'Envoyé';
        case 'echec_envoi':
            return 'Échec envoi';
        default:
            return statutEnvoi;
    }
};

const breadcrumbs = (devis: Devis): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Devis',
        href: '/devis',
    },
    {
        title: devis.numero_devis,
        href: `/devis/${devis.id}`,
    },
];

export default function DevisShow({ devis }: Props) {
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

    const isExpired = new Date(devis.date_validite) < new Date();

    const tabs = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: Info },
        { id: 'details', label: 'Détails', icon: FileCheck },
        { id: 'documents', label: 'Documents', icon: Download }
    ] as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs(devis)}>
            <Head title={devis.numero_devis} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête avec informations principales */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <Button variant="outline" size="sm" asChild className="shrink-0">
                                        <Link href="/devis">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Retour
                                        </Link>
                                    </Button>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-3xl font-bold tracking-tight">
                                                {devis.numero_devis}
                                            </h1>
                                            <Badge className={`${getStatusStyles(devis.statut)} border-0`}>
                                                <span className="flex items-center gap-1">
                                                    {getStatusIcon(devis.statut)}
                                                    {formatStatut(devis.statut)}
                                                </span>
                                            </Badge>
                                            <Badge className={`${getStatusEnvoiStyles(devis.statut_envoi)} border-0 text-xs`}>
                                                <span className="flex items-center gap-1">
                                                    {getStatusEnvoiIcon(devis.statut_envoi)}
                                                    {formatStatutEnvoi(devis.statut_envoi)}
                                                </span>
                                            </Badge>
                                            {isExpired && devis.statut === 'envoye' && (
                                                <Badge variant="destructive">Expiré</Badge>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-medium text-foreground">
                                                {devis.objet}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    Créé le {formatDate(devis.date_devis)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Euro className="h-4 w-4" />
                                                    {formatPrice(devis.montant_ttc)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <User className="h-4 w-4" />
                                                    {devis.client.prenom} {devis.client.nom}
                                                </div>
                                            </div>
                                            {devis.facture && (
                                                <p className="text-sm text-green-600 font-medium">
                                                    Transformé en facture : {devis.facture.numero_facture}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                    <Button variant="outline" size="sm">
                                        <Share className="mr-2 h-4 w-4" />
                                        Partager
                                    </Button>

                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/devis/${devis.id}/pdf`} target="_blank">
                                            <Eye className="mr-2 h-4 w-4" />
                                            Voir PDF
                                        </Link>
                                    </Button>

                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/devis/${devis.id}/telecharger-pdf`}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Télécharger PDF
                                        </Link>
                                    </Button>

                                    {devis.peut_etre_envoye && (
                                        <Button variant="default" className="bg-blue-600 hover:bg-blue-700" size="sm" asChild>
                                            <Link href={`/devis/${devis.id}/envoyer-email`}>
                                                <Mail className="mr-2 h-4 w-4" />
                                                {devis.statut_envoi === 'envoye' ? 'Renvoyer' : 'Envoyer'}
                                            </Link>
                                        </Button>
                                    )}

                                    {devis.facture ? (
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/factures/${devis.facture.id}`}>
                                                <Receipt className="mr-2 h-4 w-4" />
                                                Voir facture
                                            </Link>
                                        </Button>
                                    ) : devis.statut === 'accepte' && (devis.peut_etre_transforme_en_facture ?? true) ? (
                                        <Button variant="default" size="sm" asChild className="bg-green-600 hover:bg-green-700">
                                            <Link href={`/devis/${devis.id}/transformer-facture`}>
                                                <Receipt className="mr-2 h-4 w-4" />
                                                Transformer
                                            </Link>
                                        </Button>
                                    ) : null}

                                    <Button asChild>
                                        <Link href={`/devis/${devis.id}/edit`}>
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
                        {/* Informations principales */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Informations client */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Informations client
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <Link
                                                        href={`/clients/${devis.client.id}`}
                                                        className="font-medium hover:underline text-primary"
                                                    >
                                                        {devis.client.prenom} {devis.client.nom}
                                                    </Link>
                                                    <div className="text-sm text-muted-foreground">
                                                        {devis.client.email}
                                                    </div>
                                                    {devis.client.telephone && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {devis.client.telephone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(devis.client.email, 'Email client')}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {devis.client.entreprise && (
                                        <>
                                            <Separator />
                                            <div className="flex items-center gap-3">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">Entreprise</p>
                                                    <Link
                                                        href={`/entreprises/${devis.client.entreprise.id}`}
                                                        className="text-sm text-primary hover:underline"
                                                    >
                                                        {devis.client.entreprise.nom_commercial || devis.client.entreprise.nom}
                                                    </Link>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Montants */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Montants
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-lg">
                                            <span>Montant HT :</span>
                                            <span className="font-medium">{formatPrice(devis.montant_ht)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>TVA ({devis.taux_tva}%) :</span>
                                            <span>{formatPrice(devis.montant_ttc - devis.montant_ht)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-center text-xl font-bold">
                                            <span>Montant TTC :</span>
                                            <span className="text-primary">{formatPrice(devis.montant_ttc)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Panneau latéral */}
                        <div className="space-y-6">
                            {/* Informations dates */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        Dates importantes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="text-sm text-muted-foreground">Date d'émission</div>
                                            <div className="font-medium">{formatDate(devis.date_devis)}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="text-sm text-muted-foreground">Date de validité</div>
                                            <div className={`font-medium ${isExpired ? 'text-destructive' : ''}`}>
                                                {formatDate(devis.date_validite)}
                                                {isExpired && ' (Expiré)'}
                                            </div>
                                        </div>
                                    </div>

                                    {devis.date_envoi_client && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <div className="text-sm text-muted-foreground">Envoyé au client</div>
                                                <div className="font-medium">{formatDate(devis.date_envoi_client)}</div>
                                            </div>
                                        </div>
                                    )}

                                    <Separator />
                                    <div className="text-xs text-muted-foreground">
                                        <div>Créé le {formatDateShort(devis.created_at)}</div>
                                        {devis.updated_at !== devis.created_at && (
                                            <div>Modifié le {formatDateShort(devis.updated_at)}</div>
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
                                        <Link href={`/devis/${devis.id}/pdf`} target="_blank">
                                            <Eye className="mr-2 h-4 w-4" />
                                            Prévisualiser PDF
                                        </Link>
                                    </Button>

                                    <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                        <Link href={`/devis/${devis.id}/telecharger-pdf`}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Télécharger PDF
                                        </Link>
                                    </Button>

                                    {devis.peut_etre_envoye && (
                                        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                            <Link href={`/devis/${devis.id}/envoyer-email`}>
                                                <Mail className="mr-2 h-4 w-4" />
                                                Envoyer par email
                                            </Link>
                                        </Button>
                                    )}

                                    <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                        <Link href={`/clients/${devis.client.id}`}>
                                            <User className="mr-2 h-4 w-4" />
                                            Voir le client
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'details' && (
                    <div className="space-y-6">
                        {/* Description */}
                        {devis.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-muted/50 rounded-lg p-4">
                                        <div className="whitespace-pre-wrap text-sm">
                                            {devis.description}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Conditions */}
                        {devis.conditions && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Conditions générales</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-muted/50 rounded-lg p-4">
                                        <div className="whitespace-pre-wrap text-sm">
                                            {devis.conditions}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Notes */}
                        {devis.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notes internes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-muted/50 rounded-lg p-4">
                                        <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                                            {devis.notes}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {!devis.description && !devis.conditions && !devis.notes && (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <FileText className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                                    <h3 className="font-medium mb-2">Aucun détail disponible</h3>
                                    <p className="text-muted-foreground">Ce devis n'a pas de description, conditions ou notes.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Documents disponibles</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-100 rounded-lg">
                                                <FileText className="h-6 w-6 text-red-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium">PDF du devis</h4>
                                                <p className="text-sm text-muted-foreground">Document officiel</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/devis/${devis.id}/pdf`} target="_blank">
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/devis/${devis.id}/telecharger-pdf`}>
                                                        <Download className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>

                                    {devis.facture && (
                                        <Card className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <Receipt className="h-6 w-6 text-green-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium">Facture associée</h4>
                                                    <p className="text-sm text-muted-foreground">{devis.facture.numero_facture}</p>
                                                </div>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/factures/${devis.facture.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </Card>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
