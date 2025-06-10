import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Entreprise {
    id: number;
    nom: string;
    nom_commercial?: string;
    siret?: string;
    siren?: string;
    secteur_activite?: string;
    adresse?: string;
    ville?: string;
    code_postal?: string;
    pays?: string;
    telephone?: string;
    email?: string;
    site_web?: string;
    nombre_employes?: number;
    chiffre_affaires?: number;
    notes?: string;
}

interface Props {
    entreprise: Entreprise;
}

const breadcrumbs = (entreprise: Entreprise): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Entreprises',
        href: '/entreprises',
    },
    {
        title: entreprise.nom_commercial || entreprise.nom,
        href: `/entreprises/${entreprise.id}`,
    },
    {
        title: 'Modifier',
        href: `/entreprises/${entreprise.id}/edit`,
    },
];

export default function EntreprisesEdit({ entreprise }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        nom: entreprise.nom || '',
        nom_commercial: entreprise.nom_commercial || '',
        siret: entreprise.siret || '',
        siren: entreprise.siren || '',
        secteur_activite: entreprise.secteur_activite || '',
        adresse: entreprise.adresse || '',
        ville: entreprise.ville || '',
        code_postal: entreprise.code_postal || '',
        pays: entreprise.pays || 'France',
        telephone: entreprise.telephone || '',
        email: entreprise.email || '',
        site_web: entreprise.site_web || '',
        nombre_employes: entreprise.nombre_employes?.toString() || '',
        chiffre_affaires: entreprise.chiffre_affaires?.toString() || '',
        notes: entreprise.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/entreprises/${entreprise.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(entreprise)}>
            <Head title={`Modifier ${entreprise.nom_commercial || entreprise.nom}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/entreprises/${entreprise.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Modifier {entreprise.nom_commercial || entreprise.nom}</h1>
                        <p className="text-muted-foreground">
                            Modifiez les informations de l'entreprise
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informations de l'entreprise</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nom">Nom officiel *</Label>
                                    <Input
                                        id="nom"
                                        value={data.nom}
                                        onChange={(e) => setData('nom', e.target.value)}
                                        placeholder="TechCorp SARL"
                                        required
                                    />
                                    {errors.nom && (
                                        <div className="text-sm text-destructive">{errors.nom}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nom_commercial">Nom commercial</Label>
                                    <Input
                                        id="nom_commercial"
                                        value={data.nom_commercial}
                                        onChange={(e) => setData('nom_commercial', e.target.value)}
                                        placeholder="TechCorp"
                                    />
                                    {errors.nom_commercial && (
                                        <div className="text-sm text-destructive">{errors.nom_commercial}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="siret">SIRET</Label>
                                    <Input
                                        id="siret"
                                        value={data.siret}
                                        onChange={(e) => setData('siret', e.target.value)}
                                        placeholder="12345678901234"
                                        maxLength={14}
                                    />
                                    {errors.siret && (
                                        <div className="text-sm text-destructive">{errors.siret}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="siren">SIREN</Label>
                                    <Input
                                        id="siren"
                                        value={data.siren}
                                        onChange={(e) => setData('siren', e.target.value)}
                                        placeholder="123456789"
                                        maxLength={9}
                                    />
                                    {errors.siren && (
                                        <div className="text-sm text-destructive">{errors.siren}</div>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="secteur_activite">Secteur d'activité</Label>
                                    <Input
                                        id="secteur_activite"
                                        value={data.secteur_activite}
                                        onChange={(e) => setData('secteur_activite', e.target.value)}
                                        placeholder="Informatique, Services, ..."
                                    />
                                    {errors.secteur_activite && (
                                        <div className="text-sm text-destructive">{errors.secteur_activite}</div>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="adresse">Adresse</Label>
                                    <Input
                                        id="adresse"
                                        value={data.adresse}
                                        onChange={(e) => setData('adresse', e.target.value)}
                                        placeholder="123 avenue des Entreprises"
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

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="contact@entreprise.com"
                                    />
                                    {errors.email && (
                                        <div className="text-sm text-destructive">{errors.email}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="site_web">Site web</Label>
                                    <Input
                                        id="site_web"
                                        type="url"
                                        value={data.site_web}
                                        onChange={(e) => setData('site_web', e.target.value)}
                                        placeholder="https://www.entreprise.com"
                                    />
                                    {errors.site_web && (
                                        <div className="text-sm text-destructive">{errors.site_web}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nombre_employes">Nombre d'employés</Label>
                                    <Input
                                        id="nombre_employes"
                                        type="number"
                                        value={data.nombre_employes}
                                        onChange={(e) => setData('nombre_employes', e.target.value)}
                                        placeholder="50"
                                        min="0"
                                    />
                                    {errors.nombre_employes && (
                                        <div className="text-sm text-destructive">{errors.nombre_employes}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="chiffre_affaires">Chiffre d'affaires (€)</Label>
                                    <Input
                                        id="chiffre_affaires"
                                        type="number"
                                        value={data.chiffre_affaires}
                                        onChange={(e) => setData('chiffre_affaires', e.target.value)}
                                        placeholder="1000000"
                                        min="0"
                                        step="0.01"
                                    />
                                    {errors.chiffre_affaires && (
                                        <div className="text-sm text-destructive">{errors.chiffre_affaires}</div>
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
                                    <Link href={`/entreprises/${entreprise.id}`}>Annuler</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Modification...' : 'Modifier l\'entreprise'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
