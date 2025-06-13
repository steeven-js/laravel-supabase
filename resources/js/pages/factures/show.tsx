import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Edit,
    Receipt,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    CreditCard,
    Mail,
    Download,
    Eye,
    Phone,
    Printer,
    Send,
    FileText,
    DollarSign,
    Settings
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
            return 'bg-green-100 text-green-800 border-green-200';
        case 'envoyee':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'en_retard':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'annulee':
            return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'brouillon':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
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

    const handleStatutChange = (nouveauStatut: string) => {
        router.patch(route('factures.changer-statut', facture.id), {
            statut: nouveauStatut
        }, {
            preserveScroll: true,
        });
    };

    const statutOptions = [
        { value: 'brouillon', label: 'Brouillon', icon: '📝' },
        { value: 'envoyee', label: 'Envoyée', icon: '📧' },
        { value: 'payee', label: 'Payée', icon: '✅' },
        { value: 'en_retard', label: 'En retard', icon: '⚠️' },
        { value: 'annulee', label: 'Annulée', icon: '❌' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs(facture)}>
            <Head title={`Facture ${facture.numero_facture}`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Bouton retour */}
                <div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/factures">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour aux factures
                        </Link>
                    </Button>
                </div>

                {/* Header with actions */}
                <div className="space-y-4">
                    {/* Navigation et titre */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-semibold text-gray-900">
                                Facture {facture.numero_facture}
                            </h1>
                        </div>

                        {/* Statuts */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-3">
                                {/* Sélecteur de statut professionnel */}
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                            <Settings className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Modifier le statut
                                        </span>
                                    </div>
                                    <Select value={facture.statut} onValueChange={handleStatutChange}>
                                        <SelectTrigger className="w-52 h-11 border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                <SelectValue placeholder="Sélectionner un statut" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statutOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    <span className="flex items-center gap-2">
                                                        <span>{option.icon}</span>
                                                        <span>{option.label}</span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions groupées */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Actions principales */}
                        <div className="flex flex-wrap items-center gap-2">
                            {facture.statut === 'brouillon' && (
                                <Button asChild className="flex-1 sm:flex-none">
                                    <Link href={`/factures/${facture.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Link>
                                </Button>
                            )}
                            {!['payee', 'annulee'].includes(facture.statut) && (
                                <Button variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 flex-1 sm:flex-none" asChild>
                                    <Link href={`/factures/${facture.id}/envoyer-email`}>
                                        <Send className="mr-2 h-4 w-4" />
                                        Envoyer par email
                                    </Link>
                                </Button>
                            )}
                            {facture.statut === 'envoyee' && (
                                <Button className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none" asChild>
                                    <Link href={`/factures/${facture.id}/marquer-payee`}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Marquer payée
                                    </Link>
                                </Button>
                            )}
                        </div>

                        {/* Actions PDF */}
                        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                                <Printer className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Imprimer</span>
                                <span className="sm:hidden">Print</span>
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild>
                                <Link href={`/factures/${facture.id}/pdf`} target="_blank">
                                    <Eye className="mr-2 h-4 w-4" />
                                    <span className="hidden sm:inline">Voir PDF</span>
                                    <span className="sm:hidden">PDF</span>
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild>
                                <Link href={`/factures/${facture.id}/telecharger-pdf`}>
                                    <Download className="mr-2 h-4 w-4" />
                                    <span className="hidden sm:inline">Télécharger</span>
                                    <span className="sm:hidden">DL</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Invoice-style layout */}
                <Card className="w-full max-w-5xl mx-auto bg-white shadow-lg">
                    <CardContent className="p-12 lg:p-16">
                        {/* Header section with logo and title */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                        <Receipt className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-green-600">FACTURE</h1>
                                        <p className="text-sm text-gray-600">Document comptable</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`px-4 py-2 rounded-lg inline-block mb-2 ${getStatusStyles(facture.statut)}`}>
                                    <span className="text-sm font-medium">
                                        {formatStatut(facture.statut)}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">{facture.numero_facture}</h2>
                            </div>
                        </div>

                        {/* From and To sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* From section */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Facture de</h3>
                                <div className="space-y-1">
                                    <p className="font-semibold text-gray-900">Madin.IA</p>
                                    <p className="text-gray-600">123 Rue de l'Innovation</p>
                                    <p className="text-gray-600">97200 Fort-de-France, Martinique</p>
                                    <div className="flex flex-col gap-1 mt-2">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">+596 696 12 34 56</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">contact@madinia.com</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        SIRET: 123 456 789 00012
                                    </div>
                                </div>
                            </div>

                            {/* To section */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Facturé à</h3>
                                <div className="space-y-1">
                                    <p className="font-semibold text-gray-900">
                                        {facture.client.prenom} {facture.client.nom}
                                    </p>
                                    {facture.client.entreprise && (
                                        <p className="text-gray-600">
                                            {facture.client.entreprise.nom_commercial || facture.client.entreprise.nom}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">{facture.client.email}</span>
                                    </div>
                                    {facture.client.telephone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">{facture.client.telephone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Date information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600">Date de facture</p>
                                <p className="font-semibold">{formatDateShort(facture.date_facture)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Date d'échéance</p>
                                <p className={`font-semibold ${isRetard() ? 'text-red-600' : ''}`}>
                                    {formatDateShort(facture.date_echeance)}
                                </p>
                            </div>
                            {facture.date_paiement && (
                                <div>
                                    <p className="text-sm text-gray-600">Date de paiement</p>
                                    <p className="font-semibold text-green-600">{formatDateShort(facture.date_paiement)}</p>
                                </div>
                            )}
                        </div>

                        {/* Object */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Objet de la facture</h3>
                            <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">{facture.objet}</p>
                        </div>

                        {/* Items table */}
                        <div className="mb-8">
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                #
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Qté
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Prix unitaire
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                1
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <div className="font-medium">
                                                    Prestation de service
                                                </div>
                                                <div className="text-gray-500 text-xs mt-1">
                                                    {facture.description || 'Service personnalisé'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                1
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                {formatPrice(facture.montant_ht)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                {formatPrice(facture.montant_ht)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals section */}
                        <div className="flex justify-end mb-8">
                            <div className="w-full max-w-md">
                                <div className="space-y-2">
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-600">Sous-total HT</span>
                                        <span className="font-medium">{formatPrice(facture.montant_ht)}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-600">TVA ({Number(facture.taux_tva || 0).toFixed(1)}%)</span>
                                        <span className="font-medium">{formatPrice(facture.montant_ttc - facture.montant_ht)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between py-3 text-lg font-bold">
                                        <span>Total TTC</span>
                                        <span className="text-2xl">{formatPrice(facture.montant_ttc)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment info */}
                        {facture.conditions_paiement && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Conditions de paiement</h3>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{facture.conditions_paiement}</p>
                                </div>
                            </div>
                        )}

                        {/* Notes section */}
                        {facture.notes && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{facture.notes}</p>
                                </div>
                            </div>
                        )}

                        {/* Footer with payment info and legal */}
                        <div className="border-t pt-6">
                            <div className="text-center mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Merci pour votre confiance. Pour toute question concernant cette facture, n'hésitez pas à nous contacter.
                                </p>
                                <div className="flex justify-center items-center gap-4 text-sm text-gray-500">
                                    <span>Une question ?</span>
                                    <a href="mailto:contact@madinia.com" className="text-blue-600 hover:underline">
                                        contact@madinia.com
                                    </a>
                                </div>
                            </div>

                            {/* Legal information */}
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
                                    <div>
                                        <p className="font-medium text-gray-700 mb-1">Informations légales</p>
                                        <p>SIRET : 123 456 789 00012</p>
                                        <p>N° DA : 97 97 12345 97</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-700 mb-1">Coordonnées bancaires</p>
                                        <p>Banque de Martinique</p>
                                        <p>IBAN : FR76 1234 5678 9012 3456 7890 123</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-700 mb-1">Contact</p>
                                        <p>Madin.IA</p>
                                        <a href="https://madinia.com" target="_blank" className="text-blue-600 hover:underline">
                                            www.madinia.com
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional actions card for related devis */}
                {facture.devis && (
                    <Card className="w-full max-w-5xl mx-auto">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">Devis associé</h3>
                                    <p className="text-sm text-gray-600">
                                        Cette facture a été générée à partir du devis {facture.devis.numero_devis}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" asChild>
                                        <Link href={`/devis/${facture.devis.id}`}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Voir le devis {facture.devis.numero_devis}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
