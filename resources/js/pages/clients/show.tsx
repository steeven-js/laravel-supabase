import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, FileText, Building2, MapPin, Phone, Mail } from 'lucide-react';

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
    actif: boolean;
    notes?: string;
    entreprise?: {
        id: number;
        nom: string;
        nom_commercial?: string;
    };
    devis: Array<{
        id: number;
        numero_devis: string;
        objet: string;
        statut: string;
        date_devis: string;
        montant_ttc: number;
    }>;
    created_at: string;
}

interface Props {
    client: Client;
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
];

export default function ClientsShow({ client }: Props) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const getStatusVariant = (statut: string) => {
        switch (statut) {
            case 'accepte':
                return 'default';
            case 'envoye':
                return 'outline';
            case 'refuse':
                return 'destructive';
            case 'expire':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const formatStatut = (statut: string) => {
        switch (statut) {
            case 'brouillon':
                return 'Brouillon';
            case 'envoye':
                return 'Envoyé';
            case 'accepte':
                return 'Accepté';
            case 'refuse':
                return 'Refusé';
            case 'expire':
                return 'Expiré';
            default:
                return statut;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(client)}>
            <Head title={`${client.prenom} ${client.nom}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/clients">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{client.prenom} {client.nom}</h1>
                                <Badge variant={client.actif ? 'default' : 'secondary'}>
                                    {client.actif ? 'Actif' : 'Inactif'}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">
                                Client créé le {formatDate(client.created_at)}
                            </p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href={`/clients/${client.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Informations personnelles */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations personnelles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{client.email}</span>
                            </div>

                            {client.telephone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{client.telephone}</span>
                                </div>
                            )}

                            {(client.adresse || client.ville) && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        {client.adresse && <div>{client.adresse}</div>}
                                        {client.ville && (
                                            <div>
                                                {client.code_postal && `${client.code_postal} `}
                                                {client.ville}
                                                {client.pays && client.pays !== 'France' && `, ${client.pays}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {client.entreprise && (
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <Link
                                        href={`/entreprises/${client.entreprise.id}`}
                                        className="text-primary hover:underline"
                                    >
                                        {client.entreprise.nom_commercial || client.entreprise.nom}
                                    </Link>
                                </div>
                            )}

                            {client.notes && (
                                <div className="pt-4 border-t">
                                    <h4 className="font-medium mb-2">Notes</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {client.notes}
                                    </p>
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
                                <span className="text-muted-foreground">Total devis</span>
                                <span className="font-medium">{client.devis.length}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Devis acceptés</span>
                                <span className="font-medium">
                                    {client.devis.filter(d => d.statut === 'accepte').length}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">CA total</span>
                                <span className="font-medium">
                                    {formatPrice(
                                        client.devis
                                            .filter(d => d.statut === 'accepte')
                                            .reduce((sum, d) => sum + d.montant_ttc, 0)
                                    )}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Liste des devis */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>
                                Devis ({client.devis.length})
                            </CardTitle>
                            <Button asChild>
                                <Link href={`/devis/create?client_id=${client.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Nouveau devis
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {client.devis.length > 0 ? (
                            <div className="divide-y">
                                {client.devis.map((devis) => (
                                    <div key={devis.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={`/devis/${devis.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {devis.numero_devis}
                                                </Link>
                                                <Badge variant={getStatusVariant(devis.statut)}>
                                                    {formatStatut(devis.statut)}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {devis.objet}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatDate(devis.date_devis)} • {formatPrice(devis.montant_ttc)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="font-medium mb-2">Aucun devis</h3>
                                <p className="text-muted-foreground mb-4">
                                    Ce client n'a pas encore de devis
                                </p>
                                <Button asChild>
                                    <Link href={`/devis/create?client_id=${client.id}`}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Créer un devis
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
