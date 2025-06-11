import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Mail, CheckCircle, AlertTriangle, User, Building2 } from 'lucide-react';
import { useState } from 'react';

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
        envoyer_copie_admin: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Ne rien faire ici - cette fonction ne doit pas déclencher l'envoi
    };

    const handleEnvoyerEmail = () => {
        // Cette fonction ne se déclenche QUE sur clic explicite du bouton final
        post(`/devis/${devis.id}/envoyer-email`);
    };

    const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
        setData('envoyer_copie_admin', checked === true);
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(devis)}>
            <Head title={`Envoyer ${devis.numero_devis} par email`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/devis/${devis.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour au devis
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Envoyer par email</h1>
                        <p className="text-muted-foreground">
                            Devis {devis.numero_devis} - {devis.objet}
                        </p>
                    </div>
                </div>

                {/* Indicateur d'étapes */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-4">
                        {[1, 2, 3].map((etape) => (
                            <div key={etape} className="flex items-center">
                                <div className={`
                                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                                    ${etape <= etapeActuelle
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                    }
                                `}>
                                    {etape < etapeActuelle ? (
                                        <CheckCircle className="w-4 h-4" />
                                    ) : (
                                        etape
                                    )}
                                </div>
                                {etape < 3 && (
                                    <div className={`
                                        w-12 h-0.5 mx-2
                                        ${etape < etapeActuelle ? 'bg-primary' : 'bg-muted'}
                                    `} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Étape 1: Vérification des informations */}
                    {etapeActuelle === 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5" />
                                    Étape 1: Vérification des informations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Destinataire
                                        </h3>
                                        <div className="space-y-1 text-sm bg-muted p-3 rounded-lg">
                                            <p><strong>Nom :</strong> {devis.client.prenom} {devis.client.nom}</p>
                                            <p><strong>Email :</strong> {devis.client.email}</p>
                                            {devis.client.entreprise && (
                                                <p className="flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" />
                                                    <strong>Entreprise :</strong> {devis.client.entreprise.nom_commercial || devis.client.entreprise.nom}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Détails du devis</h3>
                                        <div className="space-y-1 text-sm bg-muted p-3 rounded-lg">
                                            <p><strong>Numéro :</strong> {devis.numero_devis}</p>
                                            <p><strong>Objet :</strong> {devis.objet}</p>
                                            <p><strong>Montant HT :</strong> {formatPrice(devis.montant_ht)}</p>
                                            <p><strong>TVA ({devis.taux_tva}%) :</strong> {formatPrice(devis.montant_ttc - devis.montant_ht)}</p>
                                            <p><strong>Montant TTC :</strong> <span className="font-semibold">{formatPrice(devis.montant_ttc)}</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-blue-900">Information</h4>
                                            <p className="text-sm text-blue-700">
                                                Un email sera envoyé à <strong>{devis.client.email}</strong> avec le devis en pièce jointe au format PDF.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Étape 2: Personnalisation du message */}
                    {etapeActuelle === 2 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5" />
                                    Étape 2: Personnalisation du message
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="message_client">Message personnalisé</Label>
                                    <textarea
                                        id="message_client"
                                        className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={data.message_client}
                                        onChange={(e) => setData('message_client', e.target.value)}
                                        placeholder="Votre message personnalisé..."
                                    />
                                    {errors.message_client && (
                                        <div className="text-sm text-destructive">{errors.message_client}</div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="envoyer_copie_admin"
                                            checked={data.envoyer_copie_admin}
                                            onCheckedChange={handleCheckboxChange}
                                        />
                                        <Label htmlFor="envoyer_copie_admin" className="text-sm font-medium">
                                            Recevoir une copie de confirmation
                                        </Label>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2">Aperçu de l'email</h4>
                                    <div className="text-sm space-y-1 bg-white p-3 rounded border">
                                        <p><strong>À :</strong> {devis.client.email}</p>
                                        <p><strong>Objet :</strong> Votre devis {devis.numero_devis}</p>
                                        <p><strong>Pièce jointe :</strong> devis-{devis.numero_devis}.pdf</p>
                                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                            <div className="whitespace-pre-wrap">{data.message_client}</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Étape 3: Confirmation finale */}
                    {etapeActuelle === 3 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Étape 3: Confirmation finale
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-green-900 mb-3">Récapitulatif de l'envoi</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <h4 className="font-medium mb-2">Destinataire :</h4>
                                            <ul className="space-y-1">
                                                <li><strong>Nom :</strong> {devis.client.prenom} {devis.client.nom}</li>
                                                <li><strong>Email :</strong> {devis.client.email}</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Actions prévues :</h4>
                                            <ul className="space-y-1">
                                                <li>✅ Envoi de l'email au client</li>
                                                <li>✅ Génération du PDF du devis</li>
                                                <li>✅ Mise à jour du statut d'envoi</li>
                                                {data.envoyer_copie_admin && <li>✅ Envoi copie à l'admin</li>}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-yellow-900">Important</h4>
                                            <p className="text-sm text-yellow-700">
                                                L'email ne sera envoyé qu'après avoir cliqué sur le bouton "Envoyer le devis" ci-dessous.
                                                Une fois l'email envoyé, le statut du devis sera automatiquement
                                                mis à jour vers "Envoyé" et vous serez redirigé vers la liste des devis.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Navigation entre les étapes */}
                    <div className="flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={etapePrecedente}
                            disabled={etapeActuelle === 1}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Précédent
                        </Button>

                        {etapeActuelle < totalEtapes ? (
                            <Button
                                type="button"
                                onClick={etapesSuivante}
                            >
                                Suivant
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleEnvoyerEmail}
                                disabled={processing}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {processing ? 'Envoi en cours...' : 'Envoyer le devis'}
                                <Mail className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
