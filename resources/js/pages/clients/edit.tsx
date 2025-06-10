import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Client {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    code_postal?: string;
    pays?: string;
    entreprise_id?: number;
    actif: boolean;
    notes?: string;
}

interface Entreprise {
    id: number;
    nom: string;
    nom_commercial?: string;
}

interface Props {
    client: Client;
    entreprises: Entreprise[];
}

const breadcrumbs = (client: Client): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Clients',
        href: '/clients',
    },
    {
        title: `${client.prenom} ${client.nom}`,
        href: `/clients/${client.id}`,
    },
    {
        title: 'Modifier',
        href: `/clients/${client.id}/edit`,
    },
];

export default function ClientsEdit({ client, entreprises }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        nom: client.nom || '',
        prenom: client.prenom || '',
        email: client.email || '',
        telephone: client.telephone || '',
        adresse: client.adresse || '',
        ville: client.ville || '',
        code_postal: client.code_postal || '',
        pays: client.pays || 'France',
        entreprise_id: client.entreprise_id?.toString() || 'none',
        actif: client.actif,
        notes: client.notes || '',
    });

        const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/clients/${client.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(client)}>
            <Head title={`Modifier ${client.prenom} ${client.nom}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/clients/${client.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Modifier {client.prenom} {client.nom}</h1>
                        <p className="text-muted-foreground">
                            Modifiez les informations du client
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informations du client</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="prenom">Prénom *</Label>
                                    <Input
                                        id="prenom"
                                        value={data.prenom}
                                        onChange={(e) => setData('prenom', e.target.value)}
                                        placeholder="Jean"
                                        required
                                    />
                                    {errors.prenom && (
                                        <div className="text-sm text-destructive">{errors.prenom}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nom">Nom *</Label>
                                    <Input
                                        id="nom"
                                        value={data.nom}
                                        onChange={(e) => setData('nom', e.target.value)}
                                        placeholder="Dupont"
                                        required
                                    />
                                    {errors.nom && (
                                        <div className="text-sm text-destructive">{errors.nom}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="jean.dupont@example.com"
                                        required
                                    />
                                    {errors.email && (
                                        <div className="text-sm text-destructive">{errors.email}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="telephone">Téléphone</Label>
                                    <Input
                                        id="telephone"
                                        value={data.telephone}
                                        onChange={(e) => setData('telephone', e.target.value)}
                                        placeholder="01 23 45 67 89"
                                    />
                                    {errors.telephone && (
                                        <div className="text-sm text-destructive">{errors.telephone}</div>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="entreprise_id">Entreprise</Label>
                                    <Select
                                        value={data.entreprise_id || 'none'}
                                        onValueChange={(value) => setData('entreprise_id', value === 'none' ? '' : value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner une entreprise" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucune entreprise</SelectItem>
                                            {entreprises.map((entreprise) => (
                                                <SelectItem key={entreprise.id} value={entreprise.id.toString()}>
                                                    {entreprise.nom_commercial || entreprise.nom}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.entreprise_id && (
                                        <div className="text-sm text-destructive">{errors.entreprise_id}</div>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="adresse">Adresse</Label>
                                    <Input
                                        id="adresse"
                                        value={data.adresse}
                                        onChange={(e) => setData('adresse', e.target.value)}
                                        placeholder="123 rue de la Paix"
                                    />
                                    {errors.adresse && (
                                        <div className="text-sm text-destructive">{errors.adresse}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ville">Ville</Label>
                                    <Input
                                        id="ville"
                                        value={data.ville}
                                        onChange={(e) => setData('ville', e.target.value)}
                                        placeholder="Paris"
                                    />
                                    {errors.ville && (
                                        <div className="text-sm text-destructive">{errors.ville}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="code_postal">Code postal</Label>
                                    <Input
                                        id="code_postal"
                                        value={data.code_postal}
                                        onChange={(e) => setData('code_postal', e.target.value)}
                                        placeholder="75001"
                                    />
                                    {errors.code_postal && (
                                        <div className="text-sm text-destructive">{errors.code_postal}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pays">Pays</Label>
                                    <Input
                                        id="pays"
                                        value={data.pays}
                                        onChange={(e) => setData('pays', e.target.value)}
                                        placeholder="France"
                                    />
                                    {errors.pays && (
                                        <div className="text-sm text-destructive">{errors.pays}</div>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="actif"
                                            checked={data.actif}
                                            onCheckedChange={(checked) => setData('actif', !!checked)}
                                        />
                                        <Label htmlFor="actif">Client actif</Label>
                                    </div>
                                    {errors.actif && (
                                        <div className="text-sm text-destructive">{errors.actif}</div>
                                    )}
                                </div>

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
                                    <Link href={`/clients/${client.id}`}>Annuler</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Modification...' : 'Modifier le client'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
