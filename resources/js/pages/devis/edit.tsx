import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Devis {
    id: number;
    numero_devis: string;
    client_id: number;
    objet: string;
    statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
    date_devis: string;
    date_validite: string;
    montant_ht: number;
    taux_tva: number;
    montant_ttc: number;
    notes?: string;
}

interface Client {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    entreprise?: {
        nom: string;
        nom_commercial?: string;
    };
}

interface Props {
    devis: Devis;
    clients: Client[];
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
        title: 'Modifier',
        href: `/devis/${devis.id}/edit`,
    },
];

export default function DevisEdit({ devis, clients }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        client_id: devis.client_id.toString(),
        objet: devis.objet || '',
        statut: devis.statut,
        date_devis: devis.date_devis?.split('T')[0] || '',
        date_validite: devis.date_validite?.split('T')[0] || '',
        montant_ht: devis.montant_ht?.toString() || '',
        taux_tva: devis.taux_tva?.toString() || '20',
        notes: devis.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/devis/${devis.id}`);
    };

    const montantTTC = data.montant_ht ?
        parseFloat(data.montant_ht) * (1 + parseFloat(data.taux_tva) / 100) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs(devis)}>
            <Head title={`Modifier ${devis.numero_devis}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/devis/${devis.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Modifier {devis.numero_devis}</h1>
                        <p className="text-muted-foreground">
                            Modifiez les informations du devis
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informations du devis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="client_id">Client *</Label>
                                    <Select
                                        value={data.client_id}
                                        onValueChange={(value) => setData('client_id', value)}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map((client) => (
                                                <SelectItem key={client.id} value={client.id.toString()}>
                                                    {client.prenom} {client.nom}
                                                    {client.entreprise && (
                                                        <span className="text-muted-foreground ml-2">
                                                            ({client.entreprise.nom_commercial || client.entreprise.nom})
                                                        </span>
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.client_id && (
                                        <div className="text-sm text-destructive">{errors.client_id}</div>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="objet">Objet du devis *</Label>
                                    <Input
                                        id="objet"
                                        value={data.objet}
                                        onChange={(e) => setData('objet', e.target.value)}
                                        placeholder="Développement application web"
                                        required
                                    />
                                    {errors.objet && (
                                        <div className="text-sm text-destructive">{errors.objet}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="statut">Statut</Label>
                                    <Select
                                        value={data.statut}
                                        onValueChange={(value) => setData('statut', value as typeof data.statut)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Statut du devis" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="brouillon">Brouillon</SelectItem>
                                            <SelectItem value="envoye">Envoyé</SelectItem>
                                            <SelectItem value="accepte">Accepté</SelectItem>
                                            <SelectItem value="refuse">Refusé</SelectItem>
                                            <SelectItem value="expire">Expiré</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.statut && (
                                        <div className="text-sm text-destructive">{errors.statut}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date_devis">Date du devis *</Label>
                                    <Input
                                        id="date_devis"
                                        type="date"
                                        value={data.date_devis}
                                        onChange={(e) => setData('date_devis', e.target.value)}
                                        required
                                    />
                                    {errors.date_devis && (
                                        <div className="text-sm text-destructive">{errors.date_devis}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date_validite">Date de validité *</Label>
                                    <Input
                                        id="date_validite"
                                        type="date"
                                        value={data.date_validite}
                                        onChange={(e) => setData('date_validite', e.target.value)}
                                        required
                                    />
                                    {errors.date_validite && (
                                        <div className="text-sm text-destructive">{errors.date_validite}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="montant_ht">Montant HT (€) *</Label>
                                    <Input
                                        id="montant_ht"
                                        type="number"
                                        value={data.montant_ht}
                                        onChange={(e) => setData('montant_ht', e.target.value)}
                                        placeholder="5000.00"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                    {errors.montant_ht && (
                                        <div className="text-sm text-destructive">{errors.montant_ht}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="taux_tva">Taux TVA (%)</Label>
                                    <Select
                                        value={data.taux_tva}
                                        onValueChange={(value) => setData('taux_tva', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Taux TVA" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">0% (exonéré)</SelectItem>
                                            <SelectItem value="5.5">5,5% (réduit)</SelectItem>
                                            <SelectItem value="10">10% (intermédiaire)</SelectItem>
                                            <SelectItem value="20">20% (normal)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.taux_tva && (
                                        <div className="text-sm text-destructive">{errors.taux_tva}</div>
                                    )}
                                </div>

                                {data.montant_ht && (
                                    <div className="space-y-2 md:col-span-2">
                                        <div className="bg-muted p-4 rounded-lg">
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Montant HT :</span>
                                                    <span>{parseFloat(data.montant_ht).toFixed(2)} €</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>TVA ({data.taux_tva}%) :</span>
                                                    <span>{(montantTTC - parseFloat(data.montant_ht)).toFixed(2)} €</span>
                                                </div>
                                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                                    <span>Montant TTC :</span>
                                                    <span>{montantTTC.toFixed(2)} €</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <textarea
                                        id="notes"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Notes additionnelles..."
                                    />
                                    {errors.notes && (
                                        <div className="text-sm text-destructive">{errors.notes}</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4">
                                <Button variant="outline" asChild>
                                    <Link href={`/devis/${devis.id}`}>Annuler</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Modification...' : 'Modifier le devis'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}