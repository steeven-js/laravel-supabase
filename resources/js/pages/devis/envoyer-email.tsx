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
    FileText,
    Send,
    Eye,
    Settings,
    Clock,
    Shield,
    CheckCircle2,
    Sparkles,
    Copy,
    Info
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Devis {
    id: number;
    numero_devis: string;
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
    statut_envoi: string;
}

interface Props {
    devis: Devis;
}

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
    {
        title: 'Envoyer par email',
        href: `/devis/${devis.id}/envoyer-email`,
    },
];

export default function EnvoyerEmail({ devis }: Props) {
    const [etapeActuelle, setEtapeActuelle] = useState(1);
    const totalEtapes = 3;

    const { data, setData, post, processing, errors } = useForm({
        message_client: `Bonjour ${devis.client.prenom},\n\nVeuillez trouver ci-joint votre devis ${devis.numero_devis} pour ${devis.objet}.\n\nN'hésitez pas à me contacter si vous avez des questions.\n\nCordialement`,
        envoyer_copie_admin: true as boolean,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Ne rien faire ici - cette fonction ne doit pas déclencher l'envoi
    };

    const handleEnvoyerEmail = () => {
        // Cette fonction ne se déclenche QUE sur clic explicite du bouton final
        post(`/devis/${devis.id}/envoyer-email`, {
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const getStatutStyle = (statut: string) => {
        switch (statut) {
            case 'accepte': return 'bg-green-100 text-green-800 border-green-200';
            case 'envoye': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'refuse': return 'bg-red-100 text-red-800 border-red-200';
            case 'expire': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatStatut = (statut: string) => {
        switch (statut) {
            case 'brouillon': return 'Brouillon';
            case 'envoye': return 'Envoyé';
            case 'accepte': return 'Accepté';
            case 'refuse': return 'Refusé';
            case 'expire': return 'Expiré';
            default: return statut;
        }
    };

    const etapes = [
        {
            id: 1,
            title: 'Vérification',
            description: 'Informations du devis',
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
        <AppLayout breadcrumbs={breadcrumbs(devis)}>
            <Head title={`Envoyer ${devis.numero_devis} par email`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête modernisé */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-green-500/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <Button variant="outline" size="sm" asChild className="shrink-0">
                                        <Link href={`/devis/${devis.id}`}>
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Retour au devis
                                        </Link>
                                    </Button>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-3xl font-bold tracking-tight">
                                                Envoyer par email
                                            </h1>
                                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                                                <Mail className="h-3 w-3 mr-1" />
                                                Email
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{devis.numero_devis}</span>
                                            <span className="text-muted-foreground">•</span>
                                            <span className="text-muted-foreground">{devis.objet}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">
                                                Pour {devis.client.prenom} {devis.client.nom}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(devis.client.email)}
                                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                <Copy className="h-3 w-3" />
                                                {devis.client.email}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge className={`${getStatutStyle(devis.statut)} border`}>
                                        {formatStatut(devis.statut)}
                                    </Badge>
                                    <Badge variant="outline">
                                        {formatPrice(devis.montant_ttc)}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Indicateur d'étapes modernisé */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            {etapes.map((etape, index) => {
                                const Icon = etape.icon;
                                const isActive = etapeActuelle === etape.id;
                                const isCompleted = etapeActuelle > etape.id;
                                const isClickable = etapeActuelle >= etape.id;

                                return (
                                    <div key={etape.id} className="flex items-center flex-1">
                                        <div className="flex flex-col items-center">
                                            <button
                                                onClick={() => isClickable && setEtapeActuelle(etape.id as 1 | 2 | 3)}
                                                disabled={!isClickable}
                                                className={`
                                                    flex items-center justify-center w-12 h-12 rounded-full text-sm font-medium transition-all duration-200
                                                    ${isActive
                                                        ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                                                        : isCompleted
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            : 'bg-muted text-muted-foreground'
                                                    }
                                                    ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                                                `}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle className="w-6 h-6" />
                                                ) : (
                                                    <Icon className="w-6 h-6" />
                                                )}
                                            </button>
                                            <div className="mt-2 text-center">
                                                <div className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                                    {etape.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {etape.description}
                                                </div>
                                            </div>
                                        </div>
                                        {index < etapes.length - 1 && (
                                            <div className={`
                                                flex-1 h-0.5 mx-4 transition-colors duration-200
                                                ${isCompleted ? 'bg-green-300' : isActive ? 'bg-primary/30' : 'bg-muted'}
                                            `} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit}>
                    {/* Étape 1: Vérification des informations */}
                    {etapeActuelle === 1 && (
                        <Card className="transition-all duration-300 animate-in fade-in-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                    Vérification des informations
                                </CardTitle>
                                <p className="text-muted-foreground">
                                    Vérifiez les informations du destinataire et du devis avant l'envoi
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Informations destinataire */}
                                    <Card className="border-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                Destinataire
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Nom complet</span>
                                                <span className="font-medium">{devis.client.prenom} {devis.client.nom}</span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Email</span>
                                                <button
                                                    onClick={() => copyToClipboard(devis.client.email)}
                                                    className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
                                                >
                                                    {devis.client.email}
                                                    <Copy className="h-3 w-3" />
                                                </button>
                                            </div>
                                            {devis.client.entreprise && (
                                                <>
                                                    <Separator />
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Building2 className="w-3 h-3" />
                                                            Entreprise
                                                        </span>
                                                        <span className="font-medium">
                                                            {devis.client.entreprise.nom_commercial || devis.client.entreprise.nom}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Détails du devis */}
                                    <Card className="border-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                                    <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                </div>
                                                Détails du devis
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Numéro</span>
                                                <Badge variant="outline" className="font-mono">
                                                    {devis.numero_devis}
                                                </Badge>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm text-muted-foreground">Objet</span>
                                                <span className="font-medium text-right max-w-[200px]">{devis.objet}</span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Montant HT</span>
                                                <span className="font-medium">{formatPrice(devis.montant_ht)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">TVA ({devis.taux_tva}%)</span>
                                                <span className="font-medium">{formatPrice(devis.montant_ttc - devis.montant_ht)}</span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">Montant TTC</span>
                                                <span className="font-bold text-lg text-primary">{formatPrice(devis.montant_ttc)}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Information importante */}
                                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                                                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                                    Information sur l'envoi
                                                </h4>
                                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                                    Un email sera envoyé à <strong>{devis.client.email}</strong> avec le devis en pièce jointe au format PDF.
                                                    Le statut du devis sera automatiquement mis à jour vers "Envoyé".
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    )}

                    {/* Étape 2: Personnalisation du message */}
                    {etapeActuelle === 2 && (
                        <Card className="transition-all duration-300 animate-in fade-in-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-purple-600" />
                                    Personnalisation du message
                                </CardTitle>
                                <p className="text-muted-foreground">
                                    Rédigez un message personnalisé qui accompagnera votre devis
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="message_client" className="text-base font-medium">
                                        Message personnalisé
                                    </Label>
                                    <Textarea
                                        id="message_client"
                                        value={data.message_client}
                                        onChange={(e) => setData('message_client', e.target.value)}
                                        placeholder="Votre message personnalisé..."
                                        className="min-h-[150px] text-sm"
                                    />
                                    {errors.message_client && (
                                        <div className="flex items-center gap-2 text-sm text-destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            {errors.message_client}
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Ce message apparaîtra dans le corps de l'email envoyé au client
                                    </p>
                                </div>

                                {/* Options d'envoi */}
                                <Card className="border-0 bg-muted/30">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Settings className="w-4 h-4" />
                                            Options d'envoi
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-start space-x-3">
                                            <Checkbox
                                                id="envoyer_copie_admin"
                                                checked={data.envoyer_copie_admin}
                                                onCheckedChange={handleCheckboxChange}
                                                className="mt-1"
                                            />
                                            <div className="space-y-1">
                                                <Label htmlFor="envoyer_copie_admin" className="text-sm font-medium cursor-pointer">
                                                    Recevoir une copie de confirmation
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Vous recevrez une copie de l'email envoyé au client pour vos archives
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Aperçu de l'email */}
                                <Card className="border-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Eye className="w-4 h-4 text-purple-600" />
                                            Aperçu de l'email
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">À :</span>
                                                    <span className="ml-2 font-medium">{devis.client.email}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Objet :</span>
                                                    <span className="ml-2 font-medium">Votre devis {devis.numero_devis}</span>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <span className="text-muted-foreground">Pièce jointe :</span>
                                                    <Badge variant="outline" className="ml-2">
                                                        📎 devis-{devis.numero_devis}.pdf
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Separator />
                                            <div>
                                                <div className="text-sm font-medium mb-2">Message :</div>
                                                <div className="bg-muted/50 p-3 rounded text-sm whitespace-pre-wrap">
                                                    {data.message_client}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    )}

                    {/* Étape 3: Confirmation finale */}
                    {etapeActuelle === 3 && (
                        <Card className="transition-all duration-300 animate-in fade-in-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Send className="w-5 h-5 text-green-600" />
                                    Confirmation finale
                                </CardTitle>
                                <p className="text-muted-foreground">
                                    Vérifiez une dernière fois avant d'envoyer le devis
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Récapitulatif */}
                                <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            Récapitulatif de l'envoi
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="font-medium mb-3 text-green-900 dark:text-green-100">Destinataire :</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-green-600" />
                                                        <span>{devis.client.prenom} {devis.client.nom}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-green-600" />
                                                        <span>{devis.client.email}</span>
                                                    </div>
                                                    {devis.client.entreprise && (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="w-4 h-4 text-green-600" />
                                                            <span>{devis.client.entreprise.nom_commercial || devis.client.entreprise.nom}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-medium mb-3 text-green-900 dark:text-green-100">Actions prévues :</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        <span>Envoi de l'email au client</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        <span>Génération du PDF du devis</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        <span>Mise à jour du statut d'envoi</span>
                                                    </div>
                                                    {data.envoyer_copie_admin && (
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                            <span>Envoi copie à l'admin</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Avertissement important */}
                                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full">
                                                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                                                    Dernière vérification
                                                </h4>
                                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                                    L'email ne sera envoyé qu'après avoir cliqué sur le bouton "Envoyer le devis" ci-dessous.
                                                    Une fois l'email envoyé, le statut du devis sera automatiquement mis à jour et vous serez redirigé vers la page du devis.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    )}

                    {/* Navigation entre les étapes */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={etapePrecedente}
                                    disabled={etapeActuelle === 1}
                                    className="min-w-[120px]"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Précédent
                                </Button>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    Étape {etapeActuelle} sur {totalEtapes}
                                </div>

                                {etapeActuelle < totalEtapes ? (
                                    <Button
                                        type="button"
                                        onClick={etapesSuivante}
                                        className="min-w-[120px]"
                                    >
                                        Suivant
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleEnvoyerEmail}
                                        disabled={processing}
                                        className="bg-green-600 hover:bg-green-700 min-w-[150px]"
                                    >
                                        {processing ? (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                                                Envoi en cours...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" />
                                                Envoyer le devis
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
