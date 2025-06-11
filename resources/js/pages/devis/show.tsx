import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, FileText, CheckCircle, XCircle, Clock, AlertCircle, Calendar, Euro, User, Building2, Receipt, Mail, MailCheck, MailX, Download, Eye } from 'lucide-react';

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

const getStatusEnvoiVariant = (statutEnvoi: string) => {
    switch (statutEnvoi) {
        case 'envoye':
            return 'default';
        case 'echec_envoi':
            return 'destructive';
        default:
            return 'secondary';
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

    const isExpired = new Date(devis.date_validite) < new Date();

    return (
        <AppLayout breadcrumbs={breadcrumbs(devis)}>
            <Head title={devis.numero_devis} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/devis">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{devis.numero_devis}</h1>
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
                            <p className="text-muted-foreground">
                                {devis.objet}
                            </p>
                            {devis.facture && (
                                <p className="text-sm text-green-600 font-medium">
                                    Transformé en facture : {devis.facture.numero_facture}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Bouton PDF */}
                        <Button variant="outline" asChild>
                            <Link href={`/devis/${devis.id}/pdf`} target="_blank">
                                <Eye className="mr-2 h-4 w-4" />
                                Voir PDF
                            </Link>
                        </Button>

                        <Button variant="outline" asChild>
                            <Link href={`/devis/${devis.id}/telecharger-pdf`}>
                                <Download className="mr-2 h-4 w-4" />
                                Télécharger PDF
                            </Link>
                        </Button>

                        {devis.peut_etre_envoye && (
                            <Button variant="default" className="bg-blue-600 hover:bg-blue-700" asChild>
                                <Link href={`/devis/${devis.id}/envoyer-email`}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    {devis.statut_envoi === 'envoye' ? 'Renvoyer par email' : 'Envoyer par email'}
                                </Link>
                            </Button>
                        )}

                        {devis.facture ? (
                            <Button variant="outline" asChild>
                                <Link href={`/factures/${devis.facture.id}`}>
                                    <Receipt className="mr-2 h-4 w-4" />
                                    Voir la facture
                                </Link>
                            </Button>
                        ) : devis.statut === 'accepte' && (devis.peut_etre_transforme_en_facture ?? true) ? (
                            <Button variant="default" asChild className="bg-green-600 hover:bg-green-700">
                                <Link href={`/devis/${devis.id}/transformer-facture`}>
                                    <Receipt className="mr-2 h-4 w-4" />
                                    Transformer en facture
                                </Link>
                            </Button>
                        ) : null}

                        <Button variant="outline" asChild>
                            <Link href={`/devis/${devis.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Informations client */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Client</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <Link
                                        href={`/clients/${devis.client.id}`}
                                        className="font-medium hover:underline"
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

                            {devis.client.entreprise && (
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <Link
                                            href={`/entreprises/${devis.client.entreprise.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {devis.client.entreprise.nom_commercial || devis.client.entreprise.nom}
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Informations devis */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <div className="text-sm text-muted-foreground">Date d'émission</div>
                                    <div>{formatDate(devis.date_devis)}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <div className="text-sm text-muted-foreground">Date de validité</div>
                                    <div className={isExpired ? 'text-destructive' : ''}>
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
                                        <div>{formatDate(devis.date_envoi_client)}</div>
                                    </div>
                                </div>
                            )}

                            <div className="text-sm text-muted-foreground">
                                Créé le {formatDateShort(devis.created_at)}
                                {devis.updated_at !== devis.created_at && (
                                    <div>Modifié le {formatDateShort(devis.updated_at)}</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Montants */}
                <Card>
                    <CardHeader>
                        <CardTitle>Montants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between text-lg">
                                <span>Montant HT :</span>
                                <span className="font-medium">{formatPrice(devis.montant_ht)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>TVA ({devis.taux_tva}%) :</span>
                                <span>{formatPrice(devis.montant_ttc - devis.montant_ht)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold border-t pt-4">
                                <span>Montant TTC :</span>
                                <span className="text-primary">{formatPrice(devis.montant_ttc)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                {devis.description && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="whitespace-pre-wrap text-sm">
                                {devis.description}
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
                            <div className="whitespace-pre-wrap text-sm">
                                {devis.conditions}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Notes */}
                {devis.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="whitespace-pre-wrap text-sm">
                                {devis.notes}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
