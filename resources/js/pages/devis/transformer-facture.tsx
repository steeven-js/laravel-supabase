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
    FileText,
    Mail,
    CheckCircle,
    AlertTriangle,
    User,
    Building2,
    Calendar,
    Settings,
    Eye,
    Clock,
    Shield,
    CheckCircle2,
    Sparkles,
    Copy,
    Info,
    Receipt,
    RefreshCw,
    CreditCard
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
}

interface Props {
    devis: Devis;
    numero_facture_propose: string;
    date_facture_defaut: string;
    date_echeance_defaut: string;
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
        title: 'Transformer en facture',
        href: `/devis/${devis.id}/transformer-facture`,
    },
];

export default function TransformerFacture({
    devis,
    numero_facture_propose,
    date_facture_defaut,
    date_echeance_defaut
}: Props) {
    const [etapeActuelle, setEtapeActuelle] = useState(1);
    const totalEtapes = 4;

    const { data, setData, post, processing, errors } = useForm({
        date_facture: date_facture_defaut,
        date_echeance: date_echeance_defaut,
        conditions_paiement: 'Paiement à 30 jours par virement bancaire.',
        notes_facture: '',
        envoyer_email_client: true as boolean,
        envoyer_email_admin: true as boolean,
        message_client: `Bonjour ${devis.client.prenom},\n\nVeuillez trouver ci-joint votre facture suite à l'acceptation du devis ${devis.numero_devis}.\n\nCordialement`,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Ne rien faire ici - cette fonction ne doit pas déclencher la transformation
    };

    const handleTransformerFacture = () => {
        // Cette fonction ne se déclenche QUE sur clic explicite du bouton final
        post(`/devis/${devis.id}/confirmer-transformation`, {
            onSuccess: () => {
                toast.success('Facture créée avec succès');
            },
            onError: () => {
                toast.error('Une erreur est survenue lors de la transformation');
            }
        });
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

    const etapes = [
        {
            id: 1,
            title: 'Récapitulatif',
            description: 'Informations du devis',
            icon: CheckCircle2,
            color: 'text-blue-600'
        },
        {
            id: 2,
            title: 'Paramètres',
            description: 'Configuration facture',
            icon: Settings,
            color: 'text-purple-600'
        },
        {
            id: 3,
            title: 'Notifications',
            description: 'Configuration emails',
            icon: Mail,
            color: 'text-orange-600'
        },
        {
            id: 4,
            title: 'Transformation',
            description: 'Confirmation finale',
            icon: Receipt,
            color: 'text-green-600'
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs(devis)}>
            <Head title={`Transformer ${devis.numero_devis} en facture`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête modernisé */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-lg" />
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
                                                Transformer en facture
                                            </h1>
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20">
                                                <Receipt className="h-3 w-3 mr-1" />
                                                Facture
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{devis.numero_devis}</span>
                                            <span className="text-muted-foreground">→</span>
                                            <span className="font-medium text-green-600">{numero_facture_propose}</span>
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
                                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                        Devis
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
                                                onClick={() => isClickable && setEtapeActuelle(etape.id)}
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
                    {/* Étape 1: Récapitulatif du devis */}
                    {etapeActuelle === 1 && (
                        <Card className="transition-all duration-300 animate-in fade-in-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                    Récapitulatif du devis
                                </CardTitle>
                                <p className="text-muted-foreground">
                                    Vérifiez les informations du devis qui sera transformé en facture
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Informations client */}
                                    <Card className="border-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                Informations client
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
                                                <span className="text-sm text-muted-foreground">Numéro devis</span>
                                                <Badge variant="outline" className="font-mono">
                                                    {devis.numero_devis}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Numéro facture</span>
                                                <Badge className="font-mono bg-green-100 text-green-800 border-green-200">
                                                    {numero_facture_propose}
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
                                                    Information sur la transformation
                                                </h4>
                                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                                    En validant cette transformation, une facture sera créée avec le numéro <strong>{numero_facture_propose}</strong>.
                                                    Cette action est irréversible et le devis ne pourra plus être modifié.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    )}

                    {/* Étape 2: Paramètres de la facture */}
                    {etapeActuelle === 2 && (
                        <Card className="transition-all duration-300 animate-in fade-in-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-purple-600" />
                                    Paramètres de la facture
                                </CardTitle>
                                <p className="text-muted-foreground">
                                    Configurez les dates et conditions de la nouvelle facture
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="date_facture" className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Date de facture
                                            <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="date_facture"
                                            type="date"
                                            value={data.date_facture}
                                            onChange={(e) => setData('date_facture', e.target.value)}
                                            required
                                            className={errors.date_facture ? 'border-destructive' : ''}
                                        />
                                        {errors.date_facture && (
                                            <div className="flex items-center gap-2 text-sm text-destructive">
                                                <AlertTriangle className="h-4 w-4" />
                                                {errors.date_facture}
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Date d'émission de la facture (par défaut aujourd'hui)
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="date_echeance" className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Date d'échéance
                                            <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="date_echeance"
                                            type="date"
                                            value={data.date_echeance}
                                            onChange={(e) => setData('date_echeance', e.target.value)}
                                            required
                                            className={errors.date_echeance ? 'border-destructive' : ''}
                                        />
                                        {errors.date_echeance && (
                                            <div className="flex items-center gap-2 text-sm text-destructive">
                                                <AlertTriangle className="h-4 w-4" />
                                                {errors.date_echeance}
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Date limite de paiement (par défaut +30 jours)
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="conditions_paiement" className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        Conditions de paiement
                                    </Label>
                                    <Textarea
                                        id="conditions_paiement"
                                        value={data.conditions_paiement}
                                        onChange={(e) => setData('conditions_paiement', e.target.value)}
                                        placeholder="Conditions de paiement..."
                                        className="min-h-[80px]"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Ces conditions apparaîtront sur la facture PDF
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="notes_facture">Notes sur la facture</Label>
                                    <Textarea
                                        id="notes_facture"
                                        value={data.notes_facture}
                                        onChange={(e) => setData('notes_facture', e.target.value)}
                                        placeholder="Notes additionnelles pour la facture..."
                                        className="min-h-[80px]"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Notes internes non visibles sur la facture PDF
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Étape 3: Configuration des emails */}
                    {etapeActuelle === 3 && (
                        <Card className="transition-all duration-300 animate-in fade-in-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-orange-600" />
                                    Configuration des notifications
                                </CardTitle>
                                <p className="text-muted-foreground">
                                    Choisissez les notifications à envoyer lors de la création de la facture
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Email client */}
                                <Card className="border-0 bg-muted/30">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start space-x-3">
                                            <Checkbox
                                                id="envoyer_email_client"
                                                checked={data.envoyer_email_client}
                                                onCheckedChange={(checked) => setData('envoyer_email_client', checked as boolean)}
                                                className="mt-1"
                                            />
                                            <div className="space-y-1 flex-1">
                                                <Label htmlFor="envoyer_email_client" className="text-base font-medium cursor-pointer">
                                                    Envoyer un email au client
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Notifier {devis.client.prenom} {devis.client.nom} ({devis.client.email}) avec la facture en pièce jointe
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    {data.envoyer_email_client && (
                                        <CardContent>
                                            <div className="space-y-3">
                                                <Label htmlFor="message_client">Message personnalisé pour le client</Label>
                                                <Textarea
                                                    id="message_client"
                                                    value={data.message_client}
                                                    onChange={(e) => setData('message_client', e.target.value)}
                                                    placeholder="Message à inclure dans l'email au client..."
                                                    className="min-h-[100px]"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Ce message apparaîtra dans le corps de l'email
                                                </p>
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>

                                {/* Email admin */}
                                <Card className="border-0 bg-muted/30">
                                    <CardContent className="p-4">
                                        <div className="flex items-start space-x-3">
                                            <Checkbox
                                                id="envoyer_email_admin"
                                                checked={data.envoyer_email_admin}
                                                onCheckedChange={(checked) => setData('envoyer_email_admin', checked as boolean)}
                                                className="mt-1"
                                            />
                                            <div className="space-y-1">
                                                <Label htmlFor="envoyer_email_admin" className="text-base font-medium cursor-pointer">
                                                    Envoyer un email de confirmation à l'administrateur
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Recevoir une notification de confirmation de la création de facture
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Aperçu des notifications */}
                                <Card className="border-0 bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-950/20 dark:to-red-950/20">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Eye className="w-4 h-4 text-orange-600" />
                                            Aperçu des notifications
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {data.envoyer_email_client && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    <span>Email au client avec la facture en pièce jointe</span>
                                                </div>
                                            )}
                                            {data.envoyer_email_admin && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    <span>Email de confirmation à l'administrateur</span>
                                                </div>
                                            )}
                                            {!data.envoyer_email_client && !data.envoyer_email_admin && (
                                                <div className="text-sm text-muted-foreground">
                                                    Aucune notification ne sera envoyée
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    )}

                    {/* Étape 4: Confirmation finale */}
                    {etapeActuelle === 4 && (
                        <Card className="transition-all duration-300 animate-in fade-in-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-green-600" />
                                    Confirmation finale
                                </CardTitle>
                                <p className="text-muted-foreground">
                                    Vérifiez une dernière fois avant de créer la facture
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
                                            Récapitulatif de la transformation
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="font-medium mb-3 text-green-900 dark:text-green-100">Facture à créer :</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Receipt className="w-4 h-4 text-green-600" />
                                                        <span><strong>Numéro :</strong> {numero_facture_propose}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-green-600" />
                                                        <span><strong>Date :</strong> {new Date(data.date_facture).toLocaleDateString('fr-FR')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-green-600" />
                                                        <span><strong>Échéance :</strong> {new Date(data.date_echeance).toLocaleDateString('fr-FR')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="w-4 h-4 text-green-600" />
                                                        <span><strong>Montant :</strong> {formatPrice(devis.montant_ttc)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-medium mb-3 text-green-900 dark:text-green-100">Actions prévues :</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        <span>Création de la facture</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        <span>Liaison avec le devis {devis.numero_devis}</span>
                                                    </div>
                                                    {data.envoyer_email_client && (
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                            <span>Envoi email au client</span>
                                                        </div>
                                                    )}
                                                    {data.envoyer_email_admin && (
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                            <span>Envoi email à l'admin</span>
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
                                                    Action irréversible
                                                </h4>
                                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                                    Cette action est irréversible. Une fois la facture créée, vous ne pourrez plus modifier le devis original.
                                                    La transformation ne se fera qu'après avoir cliqué sur le bouton "Créer la facture" ci-dessous.
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
                                        onClick={handleTransformerFacture}
                                        disabled={processing}
                                        className="bg-green-600 hover:bg-green-700 min-w-[160px]"
                                    >
                                        {processing ? (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                                                Transformation...
                                            </>
                                        ) : (
                                            <>
                                                <Receipt className="mr-2 h-4 w-4" />
                                                Créer la facture
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
