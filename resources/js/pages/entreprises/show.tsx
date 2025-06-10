import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Users, Building2, MapPin, Phone, Mail, Globe } from 'lucide-react';

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
    active: boolean;
    notes?: string;
    clients: Array<{
        id: number;
        nom: string;
        prenom: string;
        email: string;
        devis: Array<{
            id: number;
            numero_devis: string;
            statut: string;
            montant_ttc: number;
        }>;
    }>;
    created_at: string;
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
];

export default function EntreprisesShow({ entreprise }: Props) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(entreprise)}>
            <Head title={entreprise.nom_commercial || entreprise.nom} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/entreprises">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{entreprise.nom_commercial || entreprise.nom}</h1>
                                <Badge variant={entreprise.active ? 'default' : 'secondary'}>
                                    {entreprise.active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">
                                Entreprise créée le {formatDate(entreprise.created_at)}
                            </p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href={`/entreprises/${entreprise.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Informations générales */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations générales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {entreprise.nom_commercial && entreprise.nom_commercial !== entreprise.nom && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Nom officiel</span>
                                    <div>{entreprise.nom}</div>
                                </div>
                            )}

                            {entreprise.secteur_activite && (
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span>{entreprise.secteur_activite}</span>
                                </div>
                            )}

                            {entreprise.siret && (
                                <div>
                                    <span className="text-sm text-muted-foreground">SIRET</span>
                                    <div className="font-mono">{entreprise.siret}</div>
                                </div>
                            )}

                            {entreprise.email && (
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{entreprise.email}</span>
                                </div>
                            )}

                            {entreprise.telephone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{entreprise.telephone}</span>
                                </div>
                            )}

                            {entreprise.site_web && (
                                <div className="flex items-center gap-3">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <a href={entreprise.site_web} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        {entreprise.site_web}
                                    </a>
                                </div>
                            )}

                            {(entreprise.adresse || entreprise.ville) && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        {entreprise.adresse && <div>{entreprise.adresse}</div>}
                                        {entreprise.ville && (
                                            <div>
                                                {entreprise.code_postal && `${entreprise.code_postal} `}
                                                {entreprise.ville}
                                                {entreprise.pays && entreprise.pays !== 'France' && `, ${entreprise.pays}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Statistiques */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Statistiques</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Clients</span>
                                <span className="font-medium">{entreprise.clients.length}</span>
                            </div>

                            {entreprise.nombre_employes && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Employés</span>
                                    <span className="font-medium">{entreprise.nombre_employes}</span>
                                </div>
                            )}

                            {entreprise.chiffre_affaires && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">CA annuel</span>
                                    <span className="font-medium">{formatPrice(entreprise.chiffre_affaires)}</span>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total devis</span>
                                <span className="font-medium">
                                    {entreprise.clients.reduce((total, client) => total + client.devis.length, 0)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Liste des clients */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Clients ({entreprise.clients.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {entreprise.clients.length > 0 ? (
                            <div className="divide-y">
                                {entreprise.clients.map((client) => (
                                    <div key={client.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                                        <div className="flex-1 space-y-1">
                                            <Link
                                                href={`/clients/${client.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {client.prenom} {client.nom}
                                            </Link>
                                            <div className="text-sm text-muted-foreground">
                                                {client.email}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {client.devis.length} devis
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="font-medium mb-2">Aucun client</h3>
                                <p className="text-muted-foreground">
                                    Cette entreprise n'a pas encore de clients associés
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
