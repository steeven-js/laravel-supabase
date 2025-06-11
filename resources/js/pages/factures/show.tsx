import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileText, Mail, Download, Edit, Check, AlertTriangle } from 'lucide-react';

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
    statut: string;
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
    const getStatutColor = (statut: string) => {
        switch (statut) {
            case 'brouillon':
                return 'bg-gray-100 text-gray-800';
            case 'envoyee':
                return 'bg-blue-100 text-blue-800';
            case 'payee':
                return 'bg-green-100 text-green-800';
            case 'en_retard':
                return 'bg-red-100 text-red-800';
            case 'annulee':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatutLabel = (statut: string) => {
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(facture)}>
            <Head title={`Facture ${facture.numero_facture}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/factures">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour aux factures
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Facture {facture.numero_facture}</h1>
                            <p className="text-muted-foreground">{facture.objet}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {facture.statut === 'brouillon' && (
                            <Button variant="outline" asChild>
                                <Link href={`/factures/${facture.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Modifier
                                </Link>
                            </Button>
                        )}

                        {facture.statut === 'brouillon' && (
                            <Button variant="default">
                                <Mail className="mr-2 h-4 w-4" />
                                Envoyer
                            </Button>
                        )}

                        {facture.statut === 'envoyee' && (
                            <Button variant="default" className="bg-green-600 hover:bg-green-700">
                                <Check className="mr-2 h-4 w-4" />
                                Marquer comme payée
                            </Button>
                        )}

                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger PDF
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Informations principales */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Détails de la facture
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-semibold mb-2">Informations générales</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Numéro :</span>
                                                <span className="font-medium">{facture.numero_facture}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Date :</span>
                                                <span>{formatDate(facture.date_facture)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Échéance :</span>
                                                <span>{formatDate(facture.date_echeance)}</span>
                                            </div>
                                            {facture.date_paiement && (
                                                <div className="flex justify-between">
                                                    <span>Date de paiement :</span>
                                                    <span>{formatDate(facture.date_paiement)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span>Statut :</span>
                                                <Badge className={getStatutColor(facture.statut)}>
                                                    {getStatutLabel(facture.statut)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Montants</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Montant HT :</span>
                                                <span>{formatPrice(facture.montant_ht)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>TVA ({facture.taux_tva}%) :</span>
                                                <span>{formatPrice(facture.montant_ttc - facture.montant_ht)}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2 font-semibold">
                                                <span>Montant TTC :</span>
                                                <span>{formatPrice(facture.montant_ttc)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {facture.description && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Description</h3>
                                        <p className="text-sm whitespace-pre-wrap">{facture.description}</p>
                                    </div>
                                )}

                                {facture.conditions_paiement && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Conditions de paiement</h3>
                                        <p className="text-sm whitespace-pre-wrap">{facture.conditions_paiement}</p>
                                    </div>
                                )}

                                {facture.notes && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Notes</h3>
                                        <p className="text-sm whitespace-pre-wrap">{facture.notes}</p>
                                    </div>
                                )}

                                {facture.mode_paiement && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Informations de paiement</h3>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span>Mode de paiement :</span>
                                                <span>{facture.mode_paiement}</span>
                                            </div>
                                            {facture.reference_paiement && (
                                                <div className="flex justify-between">
                                                    <span>Référence :</span>
                                                    <span>{facture.reference_paiement}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Informations client */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Client</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="font-medium">{facture.client.prenom} {facture.client.nom}</p>
                                    {facture.client.entreprise && (
                                        <p className="text-sm text-muted-foreground">
                                            {facture.client.entreprise.nom_commercial || facture.client.entreprise.nom}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1 text-sm">
                                    <p>📧 {facture.client.email}</p>
                                    {facture.client.telephone && <p>📞 {facture.client.telephone}</p>}
                                </div>
                                <Button variant="outline" size="sm" asChild className="w-full">
                                    <Link href={`/clients/${facture.client.id}`}>
                                        Voir le client
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Devis associé */}
                        {facture.devis && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Devis associé</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p className="font-medium">{facture.devis.numero_devis}</p>
                                        <Button variant="outline" size="sm" asChild className="w-full">
                                            <Link href={`/devis/${facture.devis.id}`}>
                                                Voir le devis
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Alerte retard */}
                        {facture.statut === 'en_retard' && (
                            <Card className="border-red-200">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-red-900">Facture en retard</h4>
                                            <p className="text-sm text-red-700">
                                                Cette facture a dépassé sa date d'échéance.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
