import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, FileText, Mail, CheckCircle, AlertTriangle } from 'lucide-react';
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
        post(`/devis/${devis.id}/confirmer-transformation`);
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
            <Head title={`Transformer ${devis.numero_devis} en facture`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/devis/${devis.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour au devis
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Transformer en facture</h1>
                        <p className="text-muted-foreground">
                            Devis {devis.numero_devis} - {devis.objet}
                        </p>
                    </div>
                </div>

                {/* Indicateur d'étapes */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-4">
                        {[1, 2, 3, 4].map((etape) => (
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
                                {etape < 4 && (
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
                    {/* Étape 1: Récapitulatif du devis */}
                    {etapeActuelle === 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Étape 1: Récapitulatif du devis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-semibold mb-2">Informations client</h3>
                                        <div className="space-y-1 text-sm">
                                            <p><strong>Nom :</strong> {devis.client.prenom} {devis.client.nom}</p>
                                            <p><strong>Email :</strong> {devis.client.email}</p>
                                            {devis.client.entreprise && (
                                                <p><strong>Entreprise :</strong> {devis.client.entreprise.nom_commercial || devis.client.entreprise.nom}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Détails du devis</h3>
                                        <div className="space-y-1 text-sm">
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
                                            <h4 className="font-medium text-blue-900">Information importante</h4>
                                            <p className="text-sm text-blue-700">
                                                En validant cette transformation, une facture sera automatiquement créée
                                                avec le numéro <strong>{numero_facture_propose}</strong>.
                                                Cette action est irréversible.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Étape 2: Paramètres de la facture */}
                    {etapeActuelle === 2 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Étape 2: Paramètres de la facture
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date_facture">Date de facture *</Label>
                                        <Input
                                            id="date_facture"
                                            type="date"
                                            value={data.date_facture}
                                            onChange={(e) => setData('date_facture', e.target.value)}
                                            required
                                        />
                                        {errors.date_facture && (
                                            <div className="text-sm text-destructive">{errors.date_facture}</div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="date_echeance">Date d'échéance *</Label>
                                        <Input
                                            id="date_echeance"
                                            type="date"
                                            value={data.date_echeance}
                                            onChange={(e) => setData('date_echeance', e.target.value)}
                                            required
                                        />
                                        {errors.date_echeance && (
                                            <div className="text-sm text-destructive">{errors.date_echeance}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="conditions_paiement">Conditions de paiement</Label>
                                    <textarea
                                        id="conditions_paiement"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={data.conditions_paiement}
                                        onChange={(e) => setData('conditions_paiement', e.target.value)}
                                        placeholder="Conditions de paiement..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes_facture">Notes sur la facture</Label>
                                    <textarea
                                        id="notes_facture"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={data.notes_facture}
                                        onChange={(e) => setData('notes_facture', e.target.value)}
                                        placeholder="Notes additionnelles pour la facture..."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Étape 3: Configuration des emails */}
                    {etapeActuelle === 3 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5" />
                                    Étape 3: Configuration des emails
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="envoyer_email_client"
                                            checked={data.envoyer_email_client}
                                            onCheckedChange={(checked) => setData('envoyer_email_client', checked as boolean)}
                                        />
                                        <Label htmlFor="envoyer_email_client" className="text-sm font-medium">
                                            Envoyer un email au client ({devis.client.email})
                                        </Label>
                                    </div>

                                    {data.envoyer_email_client && (
                                        <div className="space-y-2 ml-6">
                                            <Label htmlFor="message_client">Message personnalisé pour le client</Label>
                                            <textarea
                                                id="message_client"
                                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={data.message_client}
                                                onChange={(e) => setData('message_client', e.target.value)}
                                                placeholder="Message à inclure dans l'email au client..."
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="envoyer_email_admin"
                                            checked={data.envoyer_email_admin}
                                            onCheckedChange={(checked) => setData('envoyer_email_admin', checked as boolean)}
                                        />
                                        <Label htmlFor="envoyer_email_admin" className="text-sm font-medium">
                                            Envoyer un email de confirmation à l'administrateur
                                        </Label>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2">Aperçu des emails qui seront envoyés :</h4>
                                    <ul className="text-sm space-y-1">
                                        {data.envoyer_email_client && (
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                Email au client avec la facture en pièce jointe
                                            </li>
                                        )}
                                        {data.envoyer_email_admin && (
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                Email de confirmation à l'administrateur
                                            </li>
                                        )}
                                        {!data.envoyer_email_client && !data.envoyer_email_admin && (
                                            <li className="text-muted-foreground">Aucun email ne sera envoyé</li>
                                        )}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Étape 4: Confirmation finale */}
                    {etapeActuelle === 4 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Étape 4: Confirmation finale
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-green-900 mb-3">Récapitulatif de la transformation</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <h4 className="font-medium mb-2">Facture à créer :</h4>
                                            <ul className="space-y-1">
                                                <li><strong>Numéro :</strong> {numero_facture_propose}</li>
                                                <li><strong>Date :</strong> {new Date(data.date_facture).toLocaleDateString('fr-FR')}</li>
                                                <li><strong>Échéance :</strong> {new Date(data.date_echeance).toLocaleDateString('fr-FR')}</li>
                                                <li><strong>Montant :</strong> {formatPrice(devis.montant_ttc)}</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Actions prévues :</h4>
                                            <ul className="space-y-1">
                                                <li>✅ Création de la facture</li>
                                                <li>✅ Liaison avec le devis {devis.numero_devis}</li>
                                                {data.envoyer_email_client && <li>✅ Envoi email au client</li>}
                                                {data.envoyer_email_admin && <li>✅ Envoi email à l'admin</li>}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-yellow-900">Attention</h4>
                                            <p className="text-sm text-yellow-700">
                                                Cette action est irréversible. Une fois la facture créée,
                                                vous ne pourrez plus modifier le devis original.
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
                                type="submit"
                                disabled={processing}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {processing ? 'Transformation...' : 'Confirmer la transformation'}
                                <CheckCircle className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
