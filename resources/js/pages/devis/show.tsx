import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowLeft,
    Edit,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Receipt,
    Mail,
    MailCheck,
    MailX,
    Eye,
    Phone,
    Printer,
    Send,
    Settings,
    X
} from 'lucide-react';
import { PDFDownloadLink, pdf, Document, Page, Text, PDFViewer } from '@react-pdf/renderer';
import DevisPdfPreview from '@/components/pdf/DevisPdfPreview';
import { Tooltip } from '@/components/ui/tooltip';

interface LigneDevis {
    id: number;
    service_id?: number;
    quantite: number;
    prix_unitaire_ht: number;
    taux_tva: number;
    montant_ht: number;
    montant_tva: number;
    montant_ttc: number;
    ordre: number;
    description_personnalisee?: string;
    service?: {
        id: number;
        nom: string;
        description: string;
        code: string;
    };
}

interface Devis {
    id: number;
    numero_devis: string;
    emetteur?: string;
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
    pdf_url_supabase?: string;
    lignes?: LigneDevis[];
    facture?: {
        id: number;
        numero_facture: string;
    };
    administrateur?: {
        id: number;
        name: string;
        email: string;
    };
    client: {
        id: number;
        nom: string;
        prenom: string;
        email: string;
        telephone?: string;
        adresse?: string;
        ville?: string;
        code_postal?: string;
        entreprise?: {
            id: number;
            nom: string;
            nom_commercial?: string;
            adresse?: string;
            ville?: string;
            code_postal?: string;
        };
    };
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
    devis: Devis;
    historique: HistoriqueAction[];
    madinia?: Madinia;
}

const getStatusStyles = (statut: string) => {
    switch (statut) {
        case 'accepte':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'envoye':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'refuse':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'expire':
            return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'brouillon':
            return 'bg-gray-100 text-gray-800 border-gray-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
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
            return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'echec_envoi':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'non_envoye':
            return 'bg-amber-100 text-amber-800 border-amber-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
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
        title: devis.administrateur ? `${devis.numero_devis} - ${devis.administrateur.name}` : devis.numero_devis,
        href: `/devis/${devis.id}`,
    },
];

export default function DevisShow({ devis, historique, madinia }: Props) {
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const formatDateShort = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const isExpired = new Date(devis.date_validite) < new Date();

    const handleStatutChange = (nouveauStatut: string) => {
        router.patch(`/devis/${devis.id}/changer-statut`, { statut: nouveauStatut });
    };

    const statutOptions = [
        { value: 'brouillon', label: 'Brouillon', icon: '📝' },
        { value: 'envoye', label: 'Envoyé', icon: '📧' },
        { value: 'accepte', label: 'Accepté', icon: '✅' },
        { value: 'refuse', label: 'Refusé', icon: '⛔' },
        { value: 'expire', label: 'Expiré', icon: '⏰' },
    ];

    // Utiliser les lignes de devis réelles ou créer des données de démonstration
    const lignesDevis: LigneDevis[] = devis.lignes || [
        {
            id: 1,
            quantite: 1,
            prix_unitaire_ht: devis.montant_ht,
            taux_tva: devis.taux_tva || 20,
            montant_ht: devis.montant_ht,
            montant_tva: devis.montant_ttc - devis.montant_ht,
            montant_ttc: devis.montant_ttc,
            ordre: 1,
            service: {
                id: 1,
                nom: "Prestation de service",
                description: devis.description || "Service personnalisé",
                code: "SERVICE"
            }
        }
    ];

    // Helper functions for historique
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
                return <Receipt className="h-4 w-4" />;
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

    const handlePreviewPdf = () => {
        // Vérifications de sécurité approfondies
        if (!devis || !devis.numero_devis || !devis.client) {
            console.error('Données du devis manquantes');
            alert('Données du devis incomplètes. Impossible de générer l\'aperçu.');
            return;
        }

        // Ouvrir le modal
        setIsPdfModalOpen(true);
    };

    // Préparer les données sécurisées pour le PDF
    const getSafeDevisData = () => {
        return {
            ...devis,
            // Convertir les strings en numbers pour les montants
            montant_ht: Number(devis.montant_ht) || 0,
            montant_ttc: Number(devis.montant_ttc) || 0,
            taux_tva: Number(devis.taux_tva) || 0,
            statut: devis.statut || 'brouillon',
            date_devis: devis.date_devis || new Date().toISOString(),
            date_validite: devis.date_validite || new Date().toISOString(),
            // Traiter les lignes avec conversion des montants
            lignes: (devis.lignes || []).map(ligne => ({
                ...ligne,
                quantite: Number(ligne.quantite) || 1,
                prix_unitaire_ht: Number(ligne.prix_unitaire_ht) || 0,
                montant_ht: Number(ligne.montant_ht) || 0,
                montant_ttc: Number(ligne.montant_ttc) || 0,
                montant_tva: Number(ligne.montant_tva) || 0,
                taux_tva: Number(ligne.taux_tva) || 0,
            })),
            client: {
                ...devis.client,
                nom: devis.client.nom || '',
                prenom: devis.client.prenom || '',
                email: devis.client.email || ''
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
                devis ? <DevisPdfPreview devis={devis} madinia={madinia} /> : <span />
            }
            fileName={`${devis?.numero_devis || 'devis'}.pdf`}
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
        <AppLayout breadcrumbs={breadcrumbs(devis)}>
            <Head title={devis.numero_devis} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Bouton retour */}
                <div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/devis">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour aux devis
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
                                    Devis {devis.numero_devis}
                                </h1>
                                {devis.administrateur && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>Assigné à <strong>{devis.administrateur.name}</strong></span>
                                    </div>
                                )}
                            </div>

                            {/* Statuts organisés */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Statut principal */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Settings className="h-4 w-4 text-amber-600" />
                                        <span className="text-sm font-medium text-gray-700">
                                            Statut du devis
                                        </span>
                                    </div>
                                    <Select value={devis.statut} onValueChange={handleStatutChange}>
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

                                {/* Statut d'envoi */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Mail className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">
                                            Statut d'envoi
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center h-10">
                                        <Badge className={`${getStatusEnvoiStyles(devis.statut_envoi)} px-3 py-2 text-xs font-medium`}>
                                            <span className="flex items-center gap-2">
                                                {getStatusEnvoiIcon(devis.statut_envoi)}
                                                {formatStatutEnvoi(devis.statut_envoi)}
                                            </span>
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Actions organisées */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            {/* Actions principales */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Button asChild className="h-10 px-4">
                                    <Link href={`/devis/${devis.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Link>
                                </Button>
                                {devis.peut_etre_envoye && (
                                    <Button className="bg-green-600 hover:bg-green-700 h-10 px-4" asChild>
                                        <Link href={`/devis/${devis.id}/envoyer-email`}>
                                            <Send className="mr-2 h-4 w-4" />
                                            {devis.statut_envoi === 'envoye' ? 'Renvoyer' : 'Envoyer'}
                                        </Link>
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

                {/* Header de statut uniforme pour tous les devis */}
                <Card className="w-full max-w-5xl mx-auto">
                    <CardContent className="p-8">
                        {devis.facture ? (
                            // Devis déjà transformé en facture
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1 text-green-700">✅ Devis transformé en facture</h3>
                                    <p className="text-sm text-gray-600">
                                        Ce devis a été transformé en facture {devis.facture.numero_facture}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" asChild>
                                        <Link href={`/factures/${devis.facture.id}`}>
                                            <Receipt className="mr-2 h-4 w-4" />
                                            Voir la facture {devis.facture.numero_facture}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ) : devis.statut === 'accepte' ? (
                            // Devis accepté, peut être transformé
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1 text-green-700">🎉 Devis accepté</h3>
                                    <p className="text-sm text-gray-600">
                                        Ce devis peut maintenant être transformé en facture
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button className="bg-green-600 hover:bg-green-700" asChild>
                                        <Link href={`/devis/${devis.id}/transformer-facture`}>
                                            <Receipt className="mr-2 h-4 w-4" />
                                            Transformer en facture
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ) : devis.statut === 'envoye' ? (
                            // Devis envoyé
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1 text-blue-700">📧 Devis envoyé</h3>
                                    <p className="text-sm text-gray-600">
                                        Le devis a été envoyé au client le {devis.date_envoi_client ? new Date(devis.date_envoi_client).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'N/A'} et attend sa validation
                                    </p>
                                </div>
                            </div>
                        ) : devis.statut === 'brouillon' ? (
                            // Devis en brouillon
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1 text-gray-700">📝 Devis en brouillon</h3>
                                    <p className="text-sm text-gray-600">
                                        Ce devis est en cours de préparation et peut être modifié
                                    </p>
                                </div>
                            </div>
                        ) : devis.statut === 'refuse' ? (
                            // Devis refusé
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1 text-red-700">❌ Devis refusé</h3>
                                    <p className="text-sm text-gray-600">
                                        Ce devis a été refusé par le client
                                    </p>
                                </div>
                            </div>
                        ) : devis.statut === 'expire' ? (
                            // Devis expiré
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1 text-orange-700">⏰ Devis expiré</h3>
                                    <p className="text-sm text-gray-600">
                                        Ce devis a dépassé sa date de validité
                                    </p>
                                </div>
                            </div>
                        ) : (
                            // Statut par défaut
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1 text-gray-700">📄 Devis</h3>
                                    <p className="text-sm text-gray-600">
                                        Statut du devis
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main devis details card */}
                <Card className="w-full max-w-5xl mx-auto bg-white shadow-lg">
                    <CardContent className="p-12 lg:p-16">
                        {/* Header section with logo and title */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-green-600">DEVIS</h1>
                                        <p className="text-sm text-gray-600">Document commercial</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`px-4 py-2 rounded-lg inline-block mb-2 ${getStatusStyles(devis.statut)}`}>
                                    <span className="text-sm font-medium">
                                        {formatStatut(devis.statut)}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">{devis.numero_devis}</h2>
                            </div>
                        </div>

                        {/* From and To sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* From section */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Devis de</h3>
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
                                        {madinia?.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-600">{madinia.email}</span>
                                            </div>
                                        )}
                                        {devis.administrateur && (
                                            <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-md">
                                                <Mail className="h-4 w-4 text-blue-500" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-blue-900">
                                                        {devis.administrateur.name}
                                                    </span>
                                                    <span className="text-xs text-blue-600">
                                                        {devis.administrateur.email}
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
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Devis pour</h3>
                                <div className="space-y-1">
                                    <p className="font-semibold text-gray-900">
                                        {devis.client.prenom} {devis.client.nom}
                                    </p>
                                    {devis.client.entreprise && (
                                        <p className="text-gray-600">
                                            {devis.client.entreprise.nom_commercial || devis.client.entreprise.nom}
                                        </p>
                                    )}
                                    {devis.client.adresse && (
                                        <p className="text-gray-600">{devis.client.adresse}</p>
                                    )}
                                    {(devis.client.code_postal || devis.client.ville) && (
                                        <p className="text-gray-600">
                                            {devis.client.code_postal} {devis.client.ville}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">{devis.client.email}</span>
                                    </div>
                                    {devis.client.telephone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">{devis.client.telephone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Date information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600">Date de création</p>
                                <p className="font-semibold">{formatDateShort(devis.date_devis)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Date d'échéance</p>
                                <p className={`font-semibold ${isExpired ? 'text-red-600' : ''}`}>
                                    {formatDateShort(devis.date_validite)}
                                </p>
                            </div>
                            {devis.date_envoi_client && (
                                <div>
                                    <p className="text-sm text-gray-600">Date d'envoi</p>
                                    <p className="font-semibold">{formatDateShort(devis.date_envoi_client)}</p>
                                </div>
                            )}
                        </div>

                        {/* Object */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Objet du devis</h3>
                            <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">{devis.objet}</p>
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
                                        {lignesDevis.map((ligne, index) => (
                                            <tr key={ligne.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    <div className="font-medium">
                                                        {ligne.service?.nom || 'Service personnalisé'}
                                                    </div>
                                                    <div className="text-gray-500 text-xs mt-1">
                                                        {ligne.description_personnalisee || ligne.service?.description || 'Prestation de service'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                    {ligne.quantite}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                    {formatPrice(ligne.prix_unitaire_ht)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                    {formatPrice(ligne.montant_ht)}
                                                </td>
                                            </tr>
                                        ))}
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
                                        <span className="font-medium">{formatPrice(devis.montant_ht)}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-600">TVA ({Number(devis.taux_tva || 0).toFixed(1)}%)</span>
                                        <span className="font-medium">{formatPrice(devis.montant_ttc - devis.montant_ht)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between py-3 text-lg font-bold">
                                        <span>Total TTC</span>
                                        <span className="text-2xl">{formatPrice(devis.montant_ttc)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes section */}
                        {devis.notes && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{devis.notes}</p>
                                </div>
                            </div>
                        )}

                        {/* Footer with support and legal info */}
                        <div className="border-t pt-6">
                            <div className="text-center mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Ce devis est valable jusqu'au {new Date(devis.date_validite).toLocaleDateString('fr-FR')}. Pour toute modification ou demande d'information complémentaire, n'hésitez pas à nous contacter.
                                </p>
                                <div className="flex justify-center items-center gap-4 text-sm text-gray-500">
                                    <span>Vous avez une question ?</span>
                                    <a href={`mailto:${madinia?.email || 'support@madinia.com'}`} className="text-blue-600 hover:underline">
                                        {madinia?.email || 'support@madinia.com'}
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
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-700 mb-1">Coordonnées bancaires</p>
                                        {madinia?.nom_banque && (
                                            <p>{madinia.nom_banque}</p>
                                        )}
                                        {madinia?.iban_bic_swift && (
                                            <p>IBAN/BIC : {madinia.iban_bic_swift}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-700 mb-1">Contact</p>
                                        <p>{madinia?.name || 'Madin.IA'}</p>
                                        {madinia?.site_web && (
                                            <a href={madinia.site_web} target="_blank" className="text-blue-600 hover:underline">
                                                {madinia.site_web}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Historique des actions */}
                <Card className="w-full max-w-5xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Historique des actions
                        </CardTitle>
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
                                                {action.donnees_supplementaires?.numero_facture && (
                                                    <span>• Facture {action.donnees_supplementaires.numero_facture}</span>
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
                            <div className="text-center py-8 text-gray-500">
                                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>Aucune action enregistrée pour ce devis</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal d'aperçu PDF */}
            {isPdfModalOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl">
                        {/* Header du modal */}
                        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Aperçu du devis {devis.numero_devis}
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
                                <DevisPdfPreview
                                    devis={getSafeDevisData()}
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
