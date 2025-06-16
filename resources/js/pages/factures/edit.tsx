import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Receipt, Save, Calculator, User, FileText, Euro, Eye } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

interface Client {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    entreprise?: {
        id: number;
        nom: string;
        nom_commercial?: string;
    };
}

interface Facture {
    id: number;
    numero_facture: string;
    client_id: number;
    objet: string;
    description?: string;
    statut: 'brouillon' | 'en_attente' | 'envoyee' | 'payee' | 'en_retard' | 'annulee';
    date_facture: string;
    date_echeance: string;
    montant_ht: number;
    montant_ttc: number;
    taux_tva: number;
    conditions_paiement?: string;
    notes?: string;
    client: Client;
}

interface Props {
    facture: Facture;
    clients: Client[];
}

const breadcrumbs = (facture: Facture): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Factures',
        href: '/factures',
    },
    {
        title: facture.numero_facture,
        href: `/factures/${facture.id}`,
    },
    {
        title: 'Modifier',
        href: `/factures/${facture.id}/edit`,
    },
];

export default function FactureEdit({ facture, clients }: Props) {
    const { data, setData, put, processing, errors, reset } = useForm({
        numero_facture: facture.numero_facture,
        client_id: facture.client_id.toString(),
        date_facture: facture.date_facture,
        date_echeance: facture.date_echeance,
        objet: facture.objet,
        description: facture.description || '',
        montant_ht: facture.montant_ht.toString(),
        taux_tva: facture.taux_tva.toString(),
        conditions_paiement: facture.conditions_paiement || 'Paiement à 30 jours',
        notes: facture.notes || '',
    });

    const [selectedClient, setSelectedClient] = useState<Client | null>(facture.client);

    // Calculs automatiques
    const montantHT = useMemo(() => {
        return parseFloat(data.montant_ht) || 0;
    }, [data.montant_ht]);

    const tauxTVA = useMemo(() => {
        return parseFloat(data.taux_tva) || 0;
    }, [data.taux_tva]);

    const montantTVA = useMemo(() => {
        return (montantHT * tauxTVA) / 100;
    }, [montantHT, tauxTVA]);

    const montantTTC = useMemo(() => {
        return montantHT + montantTVA;
    }, [montantHT, montantTVA]);

    const handleClientChange = (clientId: string) => {
        setData('client_id', clientId);
        const client = clients.find(c => c.id.toString() === clientId);
        setSelectedClient(client || null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('factures.update', facture.id), {
            onSuccess: () => {
                toast.success('Facture modifiée avec succès !');
            },
            onError: () => {
                toast.error('Une erreur est survenue lors de la modification de la facture');
            }
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const getStatusStyles = (statut: string) => {
        switch (statut) {
            case 'payee':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'envoyee':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'en_retard':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'annulee':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'brouillon':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'en_attente':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatStatut = (statut: string) => {
        switch (statut) {
            case 'brouillon':
                return 'Brouillon';
            case 'en_attente':
                return 'En attente';
            case 'envoyee':
                return 'Envoyée';
            case 'payee':
                return 'Payée';
            case 'en_retard':
                return 'En retard';
            case 'annulee':
                return 'Annulée';
            default:
                return statut;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(facture)}>
            <Head title={`Modifier ${facture.numero_facture}`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Bouton retour */}
                <div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/factures/${facture.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                </div>

                {/* En-tête avec indicateur de modifications */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Modifier la facture</h1>
                            <p className="text-muted-foreground">
                                Modifiez les informations de la facture {facture.numero_facture}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className={`${getStatusStyles(facture.statut)} px-3 py-1`}>
                            {formatStatut(facture.statut)}
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/factures/${facture.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir la facture
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Alerte si pas en brouillon ou en attente */}
                {!['brouillon', 'en_attente'].includes(facture.statut) && (
                    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                        <CardContent className="p-4">
                            <p className="text-amber-800 dark:text-amber-200 text-sm">
                                ⚠️ Cette facture a le statut "{formatStatut(facture.statut)}".
                                Les modifications peuvent avoir un impact sur la comptabilité.
                            </p>
                        </CardContent>
                    </Card>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Formulaire principal */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Informations de base */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Informations générales
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="numero_facture">Numéro de facture</Label>
                                            <Input
                                                id="numero_facture"
                                                value={data.numero_facture}
                                                onChange={(e) => setData('numero_facture', e.target.value)}
                                                disabled
                                                className="bg-muted"
                                            />
                                            {errors.numero_facture && (
                                                <p className="text-sm text-red-600">{errors.numero_facture}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="client_id">Client</Label>
                                            <Select value={data.client_id} onValueChange={handleClientChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un client" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {clients.map((client) => (
                                                        <SelectItem key={client.id} value={client.id.toString()}>
                                                            <div className="flex flex-col">
                                                                <span>{client.prenom} {client.nom}</span>
                                                                {client.entreprise && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {client.entreprise.nom_commercial || client.entreprise.nom}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.client_id && (
                                                <p className="text-sm text-red-600">{errors.client_id}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="date_facture">Date de facture</Label>
                                            <Input
                                                id="date_facture"
                                                type="date"
                                                value={data.date_facture}
                                                onChange={(e) => setData('date_facture', e.target.value)}
                                            />
                                            {errors.date_facture && (
                                                <p className="text-sm text-red-600">{errors.date_facture}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="date_echeance">Date d'échéance</Label>
                                            <Input
                                                id="date_echeance"
                                                type="date"
                                                value={data.date_echeance}
                                                onChange={(e) => setData('date_echeance', e.target.value)}
                                            />
                                            {errors.date_echeance && (
                                                <p className="text-sm text-red-600">{errors.date_echeance}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="objet">Objet de la facture</Label>
                                        <Input
                                            id="objet"
                                            value={data.objet}
                                            onChange={(e) => setData('objet', e.target.value)}
                                            placeholder="Prestation de développement web..."
                                        />
                                        {errors.objet && (
                                            <p className="text-sm text-red-600">{errors.objet}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description détaillée</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Décrivez en détail les services fournis..."
                                            rows={4}
                                        />
                                        {errors.description && (
                                            <p className="text-sm text-red-600">{errors.description}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Montants */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Euro className="h-5 w-5" />
                                        Montants et TVA
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="montant_ht">Montant HT (€)</Label>
                                            <Input
                                                id="montant_ht"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.montant_ht}
                                                onChange={(e) => setData('montant_ht', e.target.value)}
                                                placeholder="1000.00"
                                            />
                                            {errors.montant_ht && (
                                                <p className="text-sm text-red-600">{errors.montant_ht}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="taux_tva">Taux TVA (%)</Label>
                                            <Select value={data.taux_tva} onValueChange={(value) => setData('taux_tva', value)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">0% (Exonéré)</SelectItem>
                                                    <SelectItem value="5.5">5,5% (Taux réduit)</SelectItem>
                                                    <SelectItem value="10">10% (Taux intermédiaire)</SelectItem>
                                                    <SelectItem value="20">20% (Taux normal)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.taux_tva && (
                                                <p className="text-sm text-red-600">{errors.taux_tva}</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Conditions et notes */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Conditions et notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="conditions_paiement">Conditions de paiement</Label>
                                        <Textarea
                                            id="conditions_paiement"
                                            value={data.conditions_paiement}
                                            onChange={(e) => setData('conditions_paiement', e.target.value)}
                                            placeholder="Paiement à 30 jours..."
                                            rows={2}
                                        />
                                        {errors.conditions_paiement && (
                                            <p className="text-sm text-red-600">{errors.conditions_paiement}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Notes additionnelles</Label>
                                        <Textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="Notes internes ou remarques..."
                                            rows={3}
                                        />
                                        {errors.notes && (
                                            <p className="text-sm text-red-600">{errors.notes}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Résumé des calculs */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calculator className="h-5 w-5" />
                                        Résumé financier
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm text-muted-foreground">Montant HT</span>
                                            <span className="font-medium">{formatPrice(montantHT)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm text-muted-foreground">TVA ({tauxTVA}%)</span>
                                            <span className="font-medium">{formatPrice(montantTVA)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 bg-green-50 dark:bg-green-950/20 px-3 rounded-lg">
                                            <span className="font-semibold text-green-700 dark:text-green-300">Total TTC</span>
                                            <span className="text-xl font-bold text-green-700 dark:text-green-300">
                                                {formatPrice(montantTTC)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Informations client */}
                            {selectedClient && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Client sélectionné
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="text-center">
                                            <h3 className="font-semibold">{selectedClient.prenom} {selectedClient.nom}</h3>
                                            {selectedClient.entreprise && (
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedClient.entreprise.nom_commercial || selectedClient.entreprise.nom}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">Email:</span>
                                                <span>{selectedClient.email}</span>
                                            </div>
                                            {selectedClient.telephone && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">Tél:</span>
                                                    <span>{selectedClient.telephone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Actions */}
                            <Card>
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={processing}
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Modification...' : 'Enregistrer les modifications'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => reset()}
                                        >
                                            Annuler les modifications
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
