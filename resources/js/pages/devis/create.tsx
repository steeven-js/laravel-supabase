import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Calendar } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Devis',
        href: '/devis',
    },
    {
        title: 'Créer',
        href: '/devis/create',
    },
];

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
    clients: Client[];
}

export default function DevisCreate({ clients }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        client_id: '',
        objet: '',
        date_devis: new Date().toISOString().split('T')[0],
        date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 jours
        montant_ht: '',
        taux_tva: '20',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/devis');
    };

    const montantTTC = data.montant_ht ?
        parseFloat(data.montant_ht) * (1 + parseFloat(data.taux_tva) / 100) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Créer un devis" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/devis">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Créer un devis</h1>
                        <p className="text-muted-foreground">
                            Créez un nouveau devis pour un client
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
                                    <Link href="/devis">Annuler</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Création...' : 'Créer le devis'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
