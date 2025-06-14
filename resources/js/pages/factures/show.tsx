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
    Mail,
    Download,
    Eye,
    Phone,
    Printer,
    Send,
    FileText,
    Settings,
    User,
    Calendar,
    X
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import FacturePdfPreview from '@/components/pdf/FacturePdfPreview';

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
    administrateur?: {
        id: number;
        name: string;
        email: string;
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

interface Madinia {
    id: number;
    name: string;
    telephone?: string;
    email?: string;
    site_web?: string;
    siret?: string;
    numero_nda?: string;
    pays?: string;
    adresse?: string;
    description?: string;
    nom_compte_bancaire?: string;
    nom_banque?: string;
    numero_compte?: string;
    iban_bic_swift?: string;
}

interface Props {
    facture: Facture;
    madinia?: Madinia;
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

export default function FactureShow({ facture, madinia }: Props) {
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

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

    const handlePreviewPdf = () => {
        // Vérifications de sécurité approfondies
        if (!facture || !facture.numero_facture || !facture.client) {
            console.error('Données de la facture manquantes');
            alert('Données de la facture incomplètes. Impossible de générer l\'aperçu.');
            return;
        }

        // Ouvrir le modal
        setIsPdfModalOpen(true);
    };

    // Préparer les données sécurisées pour le PDF
    const getSafeFactureData = () => {
        return {
            ...facture,
            // Convertir les strings en numbers pour les montants
            montant_ht: Number(facture.montant_ht) || 0,
            montant_ttc: Number(facture.montant_ttc) || 0,
            taux_tva: Number(facture.taux_tva) || 0,
            statut: facture.statut || 'brouillon',
            date_facture: facture.date_facture || new Date().toISOString(),
            date_echeance: facture.date_echeance || new Date().toISOString(),
            client: {
                ...facture.client,
                nom: facture.client.nom || '',
                prenom: facture.client.prenom || '',
                email: facture.client.email || ''
            }
        };
    };

    const getSafeMadiniaData = () => {
        return madinia || {
            name: 'Madin.IA',
            email: 'contact@madinia.fr'
        };
    };

    const renderDownload = (
        <PDFDownloadLink
            document={
                facture ? <FacturePdfPreview facture={facture} madinia={madinia} /> : <span />
            }
            fileName={`${facture?.numero_facture || 'facture'}.pdf`}
            style={{ textDecoration: 'none' }}
        >
            {({ loading }) => (
                <Button variant="outline" size="sm" disabled={loading}>
                    {loading ? (
                        <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Génération...
                        </>
                    ) : (
                        <>
                            <FileText className="mr-2 h-4 w-4" />
                            Télécharger PDF
                        </>
                    )}
                </Button>
            )}
        </PDFDownloadLink>
    );

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

                {/* Header avec actions - Version harmonisée comme devis */}
                <Card className="w-full max-w-5xl mx-auto bg-white shadow-sm border border-gray-200">
                    <CardContent className="p-6">
                        {/* Titre et informations principales */}
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    Facture {facture.numero_facture}
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">{facture.client.prenom} {facture.client.nom}</span>
                                    {facture.client.entreprise && (
                                        <>
                                            <span>•</span>
                                            <span>{facture.client.entreprise.nom_commercial || facture.client.entreprise.nom}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Statuts organisés */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Statut principal */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Settings className="h-4 w-4 text-amber-600" />
                                        <span className="text-sm font-medium text-gray-700">
                                            Statut de la facture
                                        </span>
                                    </div>
                                    <Select value={facture.statut} onValueChange={handleStatutChange}>
                                        <SelectTrigger className="w-full h-10 border-gray-300 hover:border-amber-400 bg-white transition-colors">
                                            <SelectValue placeholder="Sélectionner un statut" />
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

                                {/* Informations de délai */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">
                                            Échéance
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center h-10">
                                        <div className="text-center">
                                            <div className={`text-sm font-medium ${isRetard() ? 'text-red-600' : 'text-gray-900'}`}>
                                                {formatDateShort(facture.date_echeance)}
                                            </div>
                                            <div className={`text-xs ${isRetard() ? 'text-red-500' : 'text-gray-500'}`}>
                                                {getDelaiPaiement()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Actions organisées */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            {/* Actions principales */}
                            <div className="flex flex-wrap items-center gap-2">
                                {facture.statut === 'brouillon' && (
                                    <Button asChild className="h-10 px-4">
                                        <Link href={`/factures/${facture.id}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Modifier
                                        </Link>
                                    </Button>
                                )}
                                {!['payee', 'annulee'].includes(facture.statut) && (
                                    <Button className="bg-green-600 hover:bg-green-700 h-10 px-4" asChild>
                                        <Link href={`/factures/${facture.id}/envoyer-email`}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Envoyer par email
                                        </Link>
                                    </Button>
                                )}
                                {facture.statut === 'envoyee' && (
                                    <Button className="bg-blue-600 hover:bg-blue-700 h-10 px-4" onClick={handleMarquerPayee}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Marquer payée
                                    </Button>
                                )}
                            </div>

                            {/* Actions PDF */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-10 px-4 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                    onClick={handlePreviewPdf}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Aperçu PDF
                                </Button>
                                {renderDownload}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Header de statut uniforme pour toutes les factures */}
                <Card className="w-full max-w-5xl mx-auto">
                    <CardContent className="p-8">
                        {facture.statut === 'payee' ? (
                            // Facture payée
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1 text-green-700">✅ Facture payée</h3>
                                    <p className="text-sm text-gray-600">
                                        Cette facture a été payée le {facture.date_paiement ? formatDateShort(facture.date_paiement) : 'N/A'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-green-600">
                                        {formatPrice(facture.montant_ttc)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Montant payé
                                    </div>
                                </div>
                            </div>
                        ) : facture.statut === 'envoyee' ? (
                            // Facture envoyée
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1 text-blue-700">📧 Facture envoyée</h3>
                                    <p className="text-sm text-gray-600">
                                        Cette facture a été envoyée au client et attend le paiement
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>Émise: {formatDateShort(facture.date_facture)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span className={isRetard() ? 'text-red-600 font-medium' : ''}>
                                                Échéance: {formatDateShort(facture.date_echeance)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {formatPrice(facture.montant_ttc)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        En attente de paiement
                                    </div>
                                </div>
                            </div>
                        ) : facture.statut === 'en_retard' ? (
                            // Facture en retard
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1 text-red-700">⚠️ Facture en retard</h3>
                                    <p className="text-sm text-gray-600">
                                        Cette facture n'a pas été payée dans les délais
                                    </p>
                                    <div className="text-sm text-red-600 font-medium mt-1">
                                        {getDelaiPaiement()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-red-600">
                                        {formatPrice(facture.montant_ttc)}
                                    </div>
                                    <div className="text-sm text-red-500">
                                        Paiement en retard
                                    </div>
                                </div>
                            </div>
                        ) : facture.statut === 'brouillon' ? (
                            // Facture en brouillon
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1 text-gray-700">📝 Facture en brouillon</h3>
                                    <p className="text-sm text-gray-600">
                                        Cette facture est en cours de préparation et peut être modifiée
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-600">
                                        {formatPrice(facture.montant_ttc)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Montant TTC
                                    </div>
                                </div>
                            </div>
                        ) : facture.statut === 'annulee' ? (
                            // Facture annulée
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1 text-gray-700">❌ Facture annulée</h3>
                                    <p className="text-sm text-gray-600">
                                        Cette facture a été annulée
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-500 line-through">
                                        {formatPrice(facture.montant_ttc)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Facture annulée
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Statut par défaut
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1 text-gray-700">📄 Facture</h3>
                                    <p className="text-sm text-gray-600">
                                        Informations sur la facture
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-600">
                                        {formatPrice(facture.montant_ttc)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Montant TTC
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

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
                                    <p className="font-semibold text-gray-900">
                                        {madinia?.name || 'Madin.IA'}
                                    </p>
                                    {madinia?.adresse && (
                                        <p className="text-gray-600">{madinia.adresse}</p>
                                    )}
                                    {madinia?.pays && (
                                        <p className="text-gray-600">{madinia.pays}</p>
                                    )}
                                    <div className="flex flex-col gap-1 mt-2">
                                        {madinia?.telephone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-600">{madinia.telephone}</span>
                                            </div>
                                        )}
                                        {facture.administrateur ? (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-600">{facture.administrateur.email}</span>
                                            </div>
                                        ) : madinia?.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-600">{madinia.email}</span>
                                            </div>
                                        )}
                                        {facture.administrateur && (
                                            <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-md">
                                                <Mail className="h-4 w-4 text-blue-500" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-blue-900">
                                                        {facture.administrateur.name}
                                                    </span>
                                                    <span className="text-xs text-blue-600">
                                                        {facture.administrateur.email}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {madinia?.siret && (
                                        <div className="text-xs text-gray-500 mt-2">
                                            SIRET: {madinia.siret}
                                        </div>
                                    )}
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
                        <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600">Date de facture</p>
                                <p className="font-semibold">{formatDateShort(facture.date_facture)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Date d'échéance</p>
                                <p className={`font-semibold ${isRetard() ? 'text-red-600' : ''}`}>
                                    {formatDateShort(facture.date_echeance)}
                                </p>
                            </div>
                        </div>
                        {facture.date_paiement && (
                            <div className="mb-8 bg-green-50 p-4 rounded-lg text-center">
                                <p className="text-sm text-gray-600">Date de paiement</p>
                                <p className="font-semibold text-green-600">{formatDateShort(facture.date_paiement)}</p>
                            </div>
                        )}

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
                                    <a href={`mailto:${madinia?.email || 'contact@madinia.com'}`} className="text-blue-600 hover:underline">
                                        {madinia?.email || 'contact@madinia.com'}
                                    </a>
                                </div>
                            </div>

                            {/* Legal information */}
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
                                    <div>
                                        <p className="font-medium text-gray-700 mb-1">Informations légales</p>
                                        {madinia?.siret && (
                                            <p>SIRET : {madinia.siret}</p>
                                        )}
                                        {madinia?.numero_nda && (
                                            <p>N° DA : {madinia.numero_nda}</p>
                                        )}
                                        {!madinia?.siret && !madinia?.numero_nda && (
                                            <p className="text-gray-500">Non renseigné</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-700 mb-1">Coordonnées bancaires</p>
                                        {madinia?.nom_banque && (
                                            <p>{madinia.nom_banque}</p>
                                        )}
                                        {madinia?.nom_compte_bancaire && (
                                            <p>{madinia.nom_compte_bancaire}</p>
                                        )}
                                        {madinia?.iban_bic_swift && (
                                            <p>IBAN/BIC : {madinia.iban_bic_swift}</p>
                                        )}
                                        {!madinia?.nom_banque && !madinia?.iban_bic_swift && (
                                            <p className="text-gray-500">Non renseigné</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-700 mb-1">Contact</p>
                                        <p>{madinia?.name || 'Madin.IA'}</p>
                                        {madinia?.site_web && (
                                            <a href={madinia.site_web} target="_blank" className="text-blue-600 hover:underline">
                                                {madinia.site_web.replace(/^https?:\/\//, '')}
                                            </a>
                                        )}
                                        {!madinia?.site_web && (
                                            <span className="text-gray-500">Site web non renseigné</span>
                                        )}
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

            {/* Modal d'aperçu PDF */}
            {isPdfModalOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl">
                        {/* Header du modal */}
                        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Aperçu de la facture {facture.numero_facture}
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsPdfModalOpen(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Contenu du modal - PDFViewer */}
                        <div className="flex-1 overflow-hidden">
                            <PDFViewer
                                width="100%"
                                height="100%"
                                style={{ border: 'none' }}
                                showToolbar={true}
                            >
                                <FacturePdfPreview
                                    facture={getSafeFactureData()}
                                    madinia={getSafeMadiniaData()}
                                />
                            </PDFViewer>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
