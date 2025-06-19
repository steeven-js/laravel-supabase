import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Mail,
    CheckCircle,
    AlertTriangle,
    User,
    Building2,
    Receipt,
    Send,
    Eye,
    Shield,
    CheckCircle2,
    Sparkles,
    Copy,
    Info,
    Euro
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
        entreprise?: {
            nom: string;
            nom_commercial?: string;
        };
    };
    objet: string;
    montant_ht: number;
    montant_ttc: number;
    taux_tva: number;
    statut: string;
    date_facture: string;
    date_echeance: string;
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
    {
        title: 'Envoyer par email',
        href: `/factures/${facture.id}/envoyer-email`,
    },
];

export default function EnvoyerEmailFacture({ facture }: Props) {
    const [etapeActuelle, setEtapeActuelle] = useState(1);
    const totalEtapes = 3;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const { data, setData, post, processing, errors } = useForm({
        message_client: `Bonjour ${facture.client.prenom},\n\nVeuillez trouver ci-joint votre facture ${facture.numero_facture} d'un montant de ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(facture.montant_ttc)} pour : ${facture.objet}.\n\nDate d'échéance : ${new Date(facture.date_echeance).toLocaleDateString('fr-FR')}\n\nMerci de procéder au règlement dans les délais indiqués.\n\nCordialement`,
        envoyer_copie_admin: true as boolean,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Ne rien faire ici - cette fonction ne doit pas déclencher l'envoi
    };

    const handleEnvoyerEmail = () => {
        // Cette fonction ne se déclenche QUE sur clic explicite du bouton final
        post(`/factures/${facture.id}/envoyer-email`, {
            onSuccess: () => {
                toast.success('Email envoyé avec succès');
            },
            onError: () => {
                toast.error('Une erreur est survenue lors de l\'envoi');
            }
        });
    };

    const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
        setData('envoyer_copie_admin', Boolean(checked));
    };

    const etapesSuivante = () => {
        if (etapeActuelle < totalEtapes) {
            setEtapeActuelle(etapeActuelle + 1);
        }
    };

    const etapePrecedente = () => {
        if (etapeActuelle > 1) {
            setEtapeActuelle(etapeActuelle - 1);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copié dans le presse-papiers');
    };

    const getStatutStyle = (statut: string) => {
        switch (statut) {
            case 'payee': return 'bg-green-100 text-green-800 border-green-200';
            case 'envoyee': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'en_retard': return 'bg-red-100 text-red-800 border-red-200';
            case 'annulee': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'brouillon': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatStatut = (statut: string) => {
        switch (statut) {
            case 'brouillon': return 'Brouillon';
            case 'envoyee': return 'Envoyée';
            case 'payee': return 'Payée';
            case 'en_retard': return 'En retard';
            case 'annulee': return 'Annulée';
            default: return statut;
        }
    };

    const etapes = [
        {
            id: 1,
            title: 'Vérification',
            description: 'Informations de la facture',
            icon: CheckCircle2,
            color: 'text-blue-600'
        },
        {
            id: 2,
            title: 'Message',
            description: 'Personnalisation',
            icon: Mail,
            color: 'text-purple-600'
        },
        {
            id: 3,
            title: 'Envoi',
            description: 'Confirmation finale',
            icon: Send,
            color: 'text-green-600'
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs(facture)}>
            <Head title={`Envoyer ${facture.numero_facture} par email`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête modernisé */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <Button variant="outline" size="sm" asChild className="shrink-0">
                                        <Link href={`/factures/${facture.id}`}>
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Retour à la facture
                                        </Link>
                                    </Button>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-3xl font-bold tracking-tight">
                                                Envoyer par email
                                            </h1>
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20">
                                                <Receipt className="mr-2 h-4 w-4" />
                                                {facture.numero_facture}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground">
                                            Envoyer la facture à votre client par email avec un message personnalisé
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <Badge className={`${getStatutStyle(facture.statut)} px-3 py-1 border`}>
                                        {formatStatut(facture.statut)}
                                    </Badge>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/factures/${facture.id}/pdf`} target="_blank">
                                            <Eye className="mr-2 h-4 w-4" />
                                            Voir PDF
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Indicateur de progression modernisé */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between relative">
                            {/* Ligne de progression */}
                            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${((etapeActuelle - 1) / (totalEtapes - 1)) * 100}%` }}
                                />
                            </div>

                            {etapes.map((etape, index) => {
                                const IconComponent = etape.icon;
                                const isActive = etapeActuelle === etape.id;
                                const isCompleted = etapeActuelle > etape.id;

                                return (
                                    <div
                                        key={etape.id}
                                        className="flex flex-col items-center relative z-10"
                                    >
                                        <div className={`
                                            w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300
                                            ${isCompleted
                                                ? 'bg-green-500 text-white shadow-lg'
                                                : isActive
                                                    ? 'bg-white border-2 border-blue-500 text-blue-500 shadow-lg'
                                                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                                            }
                                        `}>
                                            <IconComponent className="h-5 w-5" />
                                        </div>
                                        <div className="text-center min-w-0">
                                            <h3 className={`text-sm font-medium mb-1 ${
                                                isActive || isCompleted
                                                    ? 'text-gray-900 dark:text-gray-100'
                                                    : 'text-gray-500'
                                            }`}>
                                                {etape.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                {etape.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Contenu principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Étape 1: Vérification */}
                            {etapeActuelle === 1 && (
                                <Card className="border-0 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                            Vérification des informations
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Assurez-vous que toutes les informations sont correctes avant l'envoi
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Informations de la facture */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                                                        <Receipt className="h-4 w-4" />
                                                        Facture
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-blue-700 dark:text-blue-300">Numéro:</span>
                                                            <span className="font-medium text-blue-900 dark:text-blue-100">
                                                                {facture.numero_facture}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-blue-700 dark:text-blue-300">Date:</span>
                                                            <span className="font-medium text-blue-900 dark:text-blue-100">
                                                                {formatDate(facture.date_facture)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-blue-700 dark:text-blue-300">Échéance:</span>
                                                            <span className="font-medium text-blue-900 dark:text-blue-100">
                                                                {formatDate(facture.date_echeance)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-blue-700 dark:text-blue-300">Statut:</span>
                                                            <Badge className={`${getStatutStyle(facture.statut)} text-xs px-2 py-1`}>
                                                                {formatStatut(facture.statut)}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                                                        <Euro className="h-4 w-4" />
                                                        Montants
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-green-700 dark:text-green-300">HT:</span>
                                                            <span className="font-medium text-green-900 dark:text-green-100">
                                                                {formatPrice(facture.montant_ht)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-green-700 dark:text-green-300">TVA ({facture.taux_tva}%):</span>
                                                            <span className="font-medium text-green-900 dark:text-green-100">
                                                                {formatPrice(facture.montant_ttc - facture.montant_ht)}
                                                            </span>
                                                        </div>
                                                        <Separator className="my-2" />
                                                        <div className="flex justify-between">
                                                            <span className="text-green-700 dark:text-green-300 font-medium">Total TTC:</span>
                                                            <span className="font-bold text-green-900 dark:text-green-100 text-lg">
                                                                {formatPrice(facture.montant_ttc)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                                                {facture.client.entreprise ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                                Client destinataire
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-purple-700 dark:text-purple-300">Nom:</span>
                                                    <p className="font-medium text-purple-900 dark:text-purple-100">
                                                        {facture.client.prenom} {facture.client.nom}
                                                    </p>
                                                </div>
                                                {facture.client.entreprise && (
                                                    <div>
                                                        <span className="text-purple-700 dark:text-purple-300">Entreprise:</span>
                                                        <p className="font-medium text-purple-900 dark:text-purple-100">
                                                            {facture.client.entreprise.nom_commercial || facture.client.entreprise.nom}
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="md:col-span-2">
                                                    <span className="text-purple-700 dark:text-purple-300">Email:</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="font-medium text-purple-900 dark:text-purple-100">
                                                            {facture.client.email}
                                                        </p>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(facture.client.email)}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                            <div className="flex items-start gap-3">
                                                <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                                                <div>
                                                    <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                                                        Objet de la facture
                                                    </h4>
                                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                                        {facture.objet}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Étape 2: Message */}
                            {etapeActuelle === 2 && (
                                <Card className="border-0 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2">
                                            <Mail className="h-5 w-5 text-purple-600" />
                                            Personnalisation du message
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Adaptez le message qui accompagnera votre facture
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="message_client" className="text-base font-medium">
                                                Message pour le client
                                            </Label>
                                            <Textarea
                                                id="message_client"
                                                value={data.message_client}
                                                onChange={(e) => setData('message_client', e.target.value)}
                                                placeholder="Tapez votre message personnalisé..."
                                                rows={8}
                                                className="resize-none"
                                            />
                                            {errors.message_client && (
                                                <p className="text-sm text-red-600">{errors.message_client}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Ce message sera inclus dans l'email envoyé avec votre facture.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-base font-medium">Options d'envoi</Label>
                                            <div className="space-y-3">
                                                <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                                    <Checkbox
                                                        id="envoyer_copie_admin"
                                                        checked={data.envoyer_copie_admin}
                                                        onCheckedChange={handleCheckboxChange}
                                                        className="mt-1"
                                                    />
                                                    <div className="space-y-1">
                                                        <Label
                                                            htmlFor="envoyer_copie_admin"
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                        >
                                                            Recevoir une copie par email
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Une copie de l'email sera envoyée à votre adresse d'administrateur
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Étape 3: Confirmation */}
                            {etapeActuelle === 3 && (
                                <Card className="border-0 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2">
                                            <Send className="h-5 w-5 text-green-600" />
                                            Confirmation d'envoi
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Vérifiez une dernière fois avant l'envoi définitif
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                                                    <CheckCircle className="h-6 w-6 text-white" />
                                                </div>
                                                <div className="space-y-3 flex-1">
                                                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                                                        Prêt pour l'envoi !
                                                    </h3>
                                                    <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                                                        <p>• Facture: <strong>{facture.numero_facture}</strong></p>
                                                        <p>• Destinataire: <strong>{facture.client.email}</strong></p>
                                                        <p>• Montant: <strong>{formatPrice(facture.montant_ttc)}</strong></p>
                                                        {data.envoyer_copie_admin && (
                                                            <p>• Copie administrateur: <strong>Oui</strong></p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                                                <div className="text-sm text-amber-800 dark:text-amber-200">
                                                    <p className="font-medium mb-1">Attention</p>
                                                    <p>
                                                        Une fois envoyée, la facture sera automatiquement marquée comme "envoyée".
                                                        Assurez-vous que toutes les informations sont correctes.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Navigation entre les étapes */}
                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={etapePrecedente}
                                            disabled={etapeActuelle === 1}
                                            className="flex items-center gap-2"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Précédent
                                        </Button>

                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>Étape {etapeActuelle} sur {totalEtapes}</span>
                                        </div>

                                        {etapeActuelle < totalEtapes ? (
                                            <Button
                                                type="button"
                                                onClick={etapesSuivante}
                                                className="flex items-center gap-2"
                                            >
                                                Suivant
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                onClick={handleEnvoyerEmail}
                                                disabled={processing}
                                                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                                            >
                                                {processing ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Envoi en cours...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="h-4 w-4" />
                                                        Envoyer la facture
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </div>

                    {/* Sidebar avec informations */}
                    <div className="space-y-6">
                        <Card className="border-0 shadow-sm sticky top-6">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Shield className="h-5 w-5 text-blue-600" />
                                    Rappel important
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                        <p>Le PDF de la facture sera automatiquement joint à l'email</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                        <p>Le statut de la facture sera mis à jour après envoi</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                        <p>L'historique d'envoi sera automatiquement enregistré</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                                    <p className="text-xs text-blue-800 dark:text-blue-200">
                                        💡 <strong>Conseil:</strong> Personnalisez votre message pour une meilleure relation client
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
