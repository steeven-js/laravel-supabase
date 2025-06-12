import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Receipt, Save, Calculator, User, Calendar, FileText, Euro } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Factures',
        href: '/factures',
    },
    {
        title: 'Nouvelle facture',
        href: '/factures/create',
    },
];

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

interface Props {
    clients: Client[];
    numero_facture: string;
}

export default function FactureCreate({ clients, numero_facture }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        numero_facture: numero_facture,
        client_id: '',
        date_facture: new Date().toISOString().split('T')[0],
        date_echeance: '',
        objet: '',
        description: '',
        montant_ht: '',
        taux_tva: '20.00',
        conditions_paiement: 'Paiement à 30 jours',
        notes: '',
    });

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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

    // Mise à jour de la date d'échéance automatiquement (30 jours par défaut)
    useEffect(() => {
        if (data.date_facture) {
            const dateFacture = new Date(data.date_facture);
            const dateEcheance = new Date(dateFacture);
            dateEcheance.setDate(dateEcheance.getDate() + 30);
            setData('date_echeance', dateEcheance.toISOString().split('T')[0]);
        }
    }, [data.date_facture]);

    const handleClientChange = (clientId: string) => {
        setData('client_id', clientId);
        const client = clients.find(c => c.id.toString() === clientId);
        setSelectedClient(client || null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('factures.store'), {
            onSuccess: () => {
                toast.success('Facture créée avec succès !');
            },
            onError: () => {
                toast.error('Une erreur est survenue lors de la création de la facture');
            }
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvelle facture" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/factures">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour aux factures
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Nouvelle facture</h1>
                            <p className="text-muted-foreground">
                                Créez une nouvelle facture pour votre client
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="px-4 py-2">
                        <Receipt className="mr-2 h-4 w-4" />
                        {data.numero_facture}
                    </Badge>
                </div>

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
                                            {processing ? 'Création...' : 'Créer la facture'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => reset()}
                                        >
                                            Réinitialiser
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
