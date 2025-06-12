import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    FileText,
    User,
    Plus,
    Trash2,
    Edit3,
    Calculator,
    Mail,
    Phone,
    MapPin,
    DraftingCompass
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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
    telephone?: string;
    adresse?: string;
    ville?: string;
    code_postal?: string;
    entreprise?: {
        id: number;
        nom: string;
        nom_commercial?: string;
        adresse?: string;
        ville?: string;
        code_postal?: string;
    };
}

interface Service {
    id: number;
    nom: string;
    code: string;
    description: string;
    prix_ht: number;
    qte_defaut: number;
}

interface LigneDevis {
    id?: number;
    service_id?: number;
    service?: Service;
    quantite: number;
    prix_unitaire_ht: number;
    taux_tva: number;
    montant_ht: number;
    montant_tva: number;
    montant_ttc: number;
    description_personnalisee?: string;
    ordre: number;
}

interface Props {
    clients: Client[];
    services: Service[];
    numero_devis: string;
    madinia?: {
        name: string;
        telephone?: string;
        email?: string;
        adresse?: string;
        pays?: string;
        siret?: string;
    };
}

export default function DevisCreate({ clients, services, numero_devis, madinia }: Props) {
    const [lignes, setLignes] = useState<LigneDevis[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        client_id: '',
        objet: '',
        description: '',
        date_devis: new Date().toISOString().split('T')[0],
        date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        conditions: '',
        lignes: [] as any[],
    });

    useEffect(() => {
        if (data.client_id) {
            const client = clients.find(c => c.id.toString() === data.client_id);
            setSelectedClient(client || null);
        }
    }, [data.client_id, clients]);

    useEffect(() => {
        setData('lignes', lignes as any);
    }, [lignes]);

    const addLigne = () => {
        const newLigne: LigneDevis = {
            service_id: undefined,
            quantite: 1,
            prix_unitaire_ht: 0,
            taux_tva: 20,
            montant_ht: 0,
            montant_tva: 0,
            montant_ttc: 0,
            description_personnalisee: '',
            ordre: lignes.length + 1,
        };
        setLignes([...lignes, newLigne]);
    };

    const updateLigne = (index: number, field: keyof LigneDevis, value: any) => {
        const newLignes = [...lignes];
        const ligne = { ...newLignes[index] };

        if (field === 'service_id') {
            const service = services.find(s => s.id.toString() === value);
            if (service) {
                ligne.service_id = service.id;
                ligne.service = service;
                ligne.prix_unitaire_ht = service.prix_ht;
                ligne.quantite = service.qte_defaut || 1;
                ligne.description_personnalisee = service.description;
            }
        } else {
            (ligne as any)[field] = value;
        }

        // Recalculer les montants
        if (['quantite', 'prix_unitaire_ht', 'taux_tva'].includes(field) || field === 'service_id') {
            ligne.montant_ht = ligne.quantite * ligne.prix_unitaire_ht;
            ligne.montant_tva = ligne.montant_ht * (ligne.taux_tva / 100);
            ligne.montant_ttc = ligne.montant_ht + ligne.montant_tva;
        }

        newLignes[index] = ligne;
        setLignes(newLignes);
    };

    const removeLigne = (index: number) => {
        const newLignes = lignes.filter((_, i) => i !== index);
        // Réorganiser les ordres
        newLignes.forEach((ligne, i) => {
            ligne.ordre = i + 1;
        });
        setLignes(newLignes);
    };

    const calculateTotals = () => {
        const sousTotal = lignes.reduce((sum, ligne) => sum + ligne.montant_ht, 0);
        const totalTva = lignes.reduce((sum, ligne) => sum + ligne.montant_tva, 0);
        const total = lignes.reduce((sum, ligne) => sum + ligne.montant_ttc, 0);

        return { sousTotal, totalTva, total };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (lignes.length === 0) {
            toast.error('Veuillez ajouter au moins une ligne au devis');
            return;
        }

        post('/devis', {
            onSuccess: () => {
                toast.success('Devis créé avec succès');
            },
            onError: () => {
                toast.error('Une erreur est survenue lors de la création');
            }
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const { sousTotal, totalTva, total } = calculateTotals();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Créer un devis" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Bouton retour */}
                <div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/devis">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Créer un devis</h1>
                                <p className="text-sm text-gray-600">Nouveau devis #{numero_devis}</p>
                            </div>
                        </div>
                    </div>
                    <Badge variant="outline" className="px-3 py-1">
                        <DraftingCompass className="mr-1 h-3 w-3" />
                        Brouillon
                    </Badge>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* From/To Section */}
                    <Card>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* From */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Edit3 className="h-4 w-4 text-gray-400" />
                                        <h3 className="text-sm font-semibold text-gray-700">Devis de</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-semibold text-gray-900">
                                            {madinia?.name || 'Madin.IA'}
                                        </p>
                                        {madinia?.adresse && (
                                            <p className="text-gray-600 text-sm">{madinia.adresse}</p>
                                        )}
                                        {madinia?.pays && (
                                            <p className="text-gray-600 text-sm">{madinia.pays}</p>
                                        )}
                                        <div className="flex flex-col gap-1 mt-3">
                                            {madinia?.telephone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 text-gray-400" />
                                                    <span className="text-gray-600 text-sm">{madinia.telephone}</span>
                                                </div>
                                            )}
                                            {madinia?.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 text-gray-400" />
                                                    <span className="text-gray-600 text-sm">{madinia.email}</span>
                                                </div>
                                            )}
                                        </div>
                                        {madinia?.siret && (
                                            <div className="text-xs text-gray-500 mt-2">
                                                SIRET: {madinia.siret}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* To */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <h3 className="text-sm font-semibold text-gray-700">Devis pour</h3>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <Label htmlFor="client_id">Client *</Label>
                                            <Select value={data.client_id || ''} onValueChange={(value) => setData('client_id', value)}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Sélectionner un client" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {clients.map((client) => (
                                                        <SelectItem key={client.id} value={client.id.toString()}>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">
                                                                    {client.prenom} {client.nom}
                                                                </span>
                                                                {client.entreprise && (
                                                                    <span className="text-xs text-gray-500">
                                                                        {client.entreprise.nom_commercial || client.entreprise.nom}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.client_id && (
                                                <p className="text-sm text-red-500 mt-1">{errors.client_id}</p>
                                            )}
                                        </div>

                                        {selectedClient && (
                                            <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                                                <p className="font-medium text-gray-900">
                                                    {selectedClient.prenom} {selectedClient.nom}
                                                </p>
                                                {selectedClient.entreprise && (
                                                    <p className="text-gray-600">
                                                        {selectedClient.entreprise.nom_commercial || selectedClient.entreprise.nom}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 text-gray-400" />
                                                    <span className="text-gray-600">{selectedClient.email}</span>
                                                </div>
                                                {selectedClient.telephone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3 w-3 text-gray-400" />
                                                        <span className="text-gray-600">{selectedClient.telephone}</span>
                                                    </div>
                                                )}
                                                {(selectedClient.adresse || selectedClient.ville) && (
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
                                                        <div className="text-gray-600">
                                                            {selectedClient.adresse && <div>{selectedClient.adresse}</div>}
                                                            {(selectedClient.code_postal || selectedClient.ville) && (
                                                                <div>{selectedClient.code_postal} {selectedClient.ville}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Devis Details */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <Label htmlFor="date_devis">Date de création</Label>
                                    <Input
                                        id="date_devis"
                                        type="date"
                                        value={data.date_devis}
                                        onChange={(e) => setData('date_devis', e.target.value)}
                                        className="mt-1"
                                    />
                                    {errors.date_devis && (
                                        <p className="text-sm text-red-500 mt-1">{errors.date_devis}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="date_validite">Date d'échéance</Label>
                                    <Input
                                        id="date_validite"
                                        type="date"
                                        value={data.date_validite}
                                        onChange={(e) => setData('date_validite', e.target.value)}
                                        className="mt-1"
                                    />
                                    {errors.date_validite && (
                                        <p className="text-sm text-red-500 mt-1">{errors.date_validite}</p>
                                    )}
                                </div>

                                <div>
                                    <Label>Numéro de devis</Label>
                                    <Input
                                        value={numero_devis}
                                        disabled
                                        className="mt-1 bg-gray-50"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="objet">Objet du devis *</Label>
                                <Input
                                    id="objet"
                                    value={data.objet || ''}
                                    onChange={(e) => setData('objet', e.target.value)}
                                    placeholder="Objet du devis..."
                                    className="mt-1"
                                />
                                {errors.objet && (
                                    <p className="text-sm text-red-500 mt-1">{errors.objet}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items Table */}
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Lignes du devis</CardTitle>
                                <Button type="button" onClick={addLigne} size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Ajouter une ligne
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {lignes.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium mb-2">Aucune ligne ajoutée</p>
                                    <p className="text-sm">Cliquez sur "Ajouter une ligne" pour commencer</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">#</th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">Service</th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Qté</th>
                                                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Prix unit.</th>
                                                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">TVA</th>
                                                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Total</th>
                                                <th className="px-3 py-3 w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {lignes.map((ligne, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-3 py-3 text-xs text-gray-500">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <Select
                                                            value={ligne.service_id?.toString() || ''}
                                                            onValueChange={(value) => updateLigne(index, 'service_id', value)}
                                                        >
                                                            <SelectTrigger className="w-full text-xs">
                                                                <SelectValue placeholder="Sélectionner..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {services.map((service) => (
                                                                    <SelectItem key={service.id} value={service.id.toString()}>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-medium">{service.nom}</span>
                                                                            <span className="text-xs text-gray-500">{service.code}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <Textarea
                                                            value={ligne.description_personnalisee || ''}
                                                            onChange={(e) => updateLigne(index, 'description_personnalisee', e.target.value)}
                                                            placeholder="Description..."
                                                            className="min-h-[50px] text-xs"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={ligne.quantite.toString()}
                                                            onChange={(e) => updateLigne(index, 'quantite', parseFloat(e.target.value) || 0)}
                                                            className="text-center text-xs"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={ligne.prix_unitaire_ht.toString()}
                                                            onChange={(e) => updateLigne(index, 'prix_unitaire_ht', parseFloat(e.target.value) || 0)}
                                                            className="text-right text-xs"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.1"
                                                            value={ligne.taux_tva.toString()}
                                                            onChange={(e) => updateLigne(index, 'taux_tva', parseFloat(e.target.value) || 0)}
                                                            className="text-right text-xs"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-medium text-xs">
                                                        {formatPrice(ligne.montant_ttc)}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeLigne(index)}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Totals */}
                    {lignes.length > 0 && (
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex justify-end">
                                    <div className="w-full max-w-sm space-y-3">
                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-600">Sous-total HT</span>
                                            <span className="font-medium">{formatPrice(sousTotal)}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-600">TVA</span>
                                            <span className="font-medium">{formatPrice(totalTva)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between py-3 text-lg font-bold">
                                            <span>Total TTC</span>
                                            <span className="text-2xl">{formatPrice(total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Additional Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Détails complémentaires</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description || ''}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Description détaillée du devis..."
                                    className="mt-1 min-h-[100px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="conditions">Conditions</Label>
                                    <Textarea
                                        id="conditions"
                                        value={data.conditions || ''}
                                        onChange={(e) => setData('conditions', e.target.value)}
                                        placeholder="Conditions particulières..."
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="notes">Notes internes</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes || ''}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Notes internes..."
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                        <Button
                            type="submit"
                            disabled={processing || lignes.length === 0}
                            className="flex-1 sm:flex-none"
                        >
                            {processing ? (
                                <>
                                    <Calculator className="mr-2 h-4 w-4 animate-spin" />
                                    Création...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Créer le devis
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
