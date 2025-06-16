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
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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

interface Administrateur {
    id: number;
    name: string;
    email: string;
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

interface Devis {
    id: number;
    numero_devis: string;
    administrateur_id?: number;
    client_id: number;
    objet: string;
    statut: 'brouillon' | 'en_attente' | 'envoye' | 'accepte' | 'refuse' | 'expire';
    date_devis: string;
    date_validite: string;
    montant_ht: number;
    taux_tva: number;
    montant_ttc: number;
    notes?: string;
    description?: string;
    conditions?: string;
    archive: boolean;
    lignes: LigneDevis[];
    client: Client;
}

interface Props {
    devis: Devis;
    clients: Client[];
    services: Service[];
    administrateurs: Administrateur[];
    madinia?: {
        name: string;
        telephone?: string;
        email?: string;
        adresse?: string;
        pays?: string;
        siret?: string;
    };
}

const getStatusStyles = (statut: string) => {
    switch (statut) {
        case 'accepte':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'envoye':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'refuse':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'expire':
            return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'brouillon':
            return 'bg-gray-100 text-gray-800 border-gray-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getStatusIcon = (statut: string) => {
    switch (statut) {
        case 'accepte':
            return <CheckCircle className="h-4 w-4" />;
        case 'envoye':
            return <Clock className="h-4 w-4" />;
        case 'refuse':
            return <XCircle className="h-4 w-4" />;
        case 'expire':
            return <AlertCircle className="h-4 w-4" />;
        default:
            return <FileText className="h-4 w-4" />;
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

export default function DevisEdit({ devis, clients, services, administrateurs, madinia }: Props) {
    const [lignes, setLignes] = useState<LigneDevis[]>(devis.lignes || []);
    const [selectedClient, setSelectedClient] = useState<Client | null>(devis.client);

    const { data, setData, patch, processing, errors } = useForm({
        numero_devis: devis.numero_devis || '',
        administrateur_id: devis.administrateur_id?.toString() || '',
        client_id: devis.client_id?.toString() || '',
        objet: devis.objet || '',
        statut: devis.statut || 'brouillon',
        date_devis: devis.date_devis || '',
        date_validite: devis.date_validite || '',
        notes: devis.notes || '',
        description: devis.description || '',
        conditions: devis.conditions || '',
        archive: devis.archive || false,
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

        patch(`/devis/${devis.id}`, {
            onSuccess: () => {
                toast.success('Devis modifié avec succès');
            },
            onError: () => {
                toast.error('Une erreur est survenue lors de la modification');
            }
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const truncateText = (text: string, maxLength: number = 40) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const { sousTotal, totalTva, total } = calculateTotals();

    return (
        <AppLayout breadcrumbs={breadcrumbs(devis)}>
            <Head title={`Modifier ${devis.numero_devis}`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Bouton retour */}
                <div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/devis/${devis.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                </div>

                {/* En-tête avec indicateur de modifications */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <Edit3 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Modifier le devis</h1>
                                <p className="text-sm text-gray-600">Devis {devis.numero_devis}</p>
                            </div>
                        </div>
                    </div>
                    <Badge className={`${getStatusStyles(devis.statut)} px-3 py-1`}>
                        <span className="flex items-center gap-1">
                            {getStatusIcon(devis.statut)}
                            {formatStatut(devis.statut)}
                        </span>
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

                                    <div>
                                        <Label htmlFor="administrateur_id">Administrateur assigné *</Label>
                                        <Select value={data.administrateur_id || ''} onValueChange={(value) => setData('administrateur_id', value)}>
                                            <SelectTrigger className="w-full mt-1">
                                                <SelectValue placeholder="Sélectionner un administrateur" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {administrateurs.map((admin) => (
                                                    <SelectItem key={admin.id} value={admin.id.toString()}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-left">{admin.name}</span>
                                                            <span className="text-xs text-gray-500">{admin.email}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.administrateur_id && (
                                            <p className="text-sm text-red-500 mt-1">{errors.administrateur_id}</p>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div>
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
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 text-gray-400" />
                                                    <span className="text-gray-600 text-sm">
                                                        {data.administrateur_id ? (() => {
                                                            const admin = administrateurs.find(a => a.id.toString() === data.administrateur_id);
                                                            return admin ? admin.email : 'd.brault@madin-ia.com';
                                                        })() : 'd.brault@madin-ia.com'}
                                                    </span>
                                                </div>
                                            </div>
                                            {madinia?.siret && (
                                                <div className="text-xs text-gray-500 mt-2">
                                                    SIRET: {madinia.siret}
                                                </div>
                                            )}
                                        </div>

                                        {data.administrateur_id && (
                                            <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                                                {(() => {
                                                    const admin = administrateurs.find(a => a.id.toString() === data.administrateur_id);
                                                    return admin ? (
                                                        <>
                                                            <p className="font-medium text-gray-900">{admin.name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="h-3 w-3 text-gray-400" />
                                                                <span className="text-gray-600">{admin.email}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="font-medium text-gray-900">David Brault</p>
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="h-3 w-3 text-gray-400" />
                                                                <span className="text-gray-600">d.brault@madin-ia.com</span>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
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
                                        value={data.date_devis || ''}
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
                                        value={data.date_validite || ''}
                                        onChange={(e) => setData('date_validite', e.target.value)}
                                        className="mt-1"
                                    />
                                    {errors.date_validite && (
                                        <p className="text-sm text-red-500 mt-1">{errors.date_validite}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="numero_devis">Numéro de devis</Label>
                                    <Input
                                        id="numero_devis"
                                        value={data.numero_devis || ''}
                                        onChange={(e) => setData('numero_devis', e.target.value)}
                                        className="mt-1"
                                    />
                                    {errors.numero_devis && (
                                        <p className="text-sm text-red-500 mt-1">{errors.numero_devis}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                <div className="bg-gradient-to-r from-slate-50 to-amber-50 dark:from-slate-900/50 dark:to-amber-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                                            <Settings className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <Label htmlFor="statut" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            Statut du devis
                                        </Label>
                                        <Badge variant="outline" className="ml-auto text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700">
                                            Important
                                        </Badge>
                                    </div>
                                    <div>
                                        <Select value={data.statut || ''} onValueChange={(value) => setData('statut', value as 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire')}>
                                            <SelectTrigger className="w-full h-11 border border-slate-300 dark:border-slate-600 hover:border-amber-400 dark:hover:border-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <Settings className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                    <SelectValue placeholder="Sélectionner un statut" />
                                                </div>
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
                                            <p className="text-sm text-red-500 mt-2">{errors.statut}</p>
                                        )}
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                                            Ce changement aura un impact immédiat sur le devis
                                        </p>
                                    </div>
                                </div>
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
                                                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">TVA</th>
                                                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Total</th>
                                                <th className="px-3 py-3 w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {lignes.map((ligne, index) => (
                                                <tr key={ligne.id || index} className="hover:bg-gray-50">
                                                    <td className="px-3 py-3 text-xs text-gray-500">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <Select
                                                            value={ligne.service_id?.toString() || ''}
                                                            onValueChange={(value) => updateLigne(index, 'service_id', value)}
                                                        >
                                                            <SelectTrigger className="w-full text-xs">
                                                                {ligne.service_id ? (
                                                                    <span className="text-xs font-medium">
                                                                        {(() => {
                                                                            const selectedService = services.find(s => s.id === ligne.service_id);
                                                                            return selectedService ? truncateText(selectedService.nom, 45) : 'Service non trouvé';
                                                                        })()}
                                                                    </span>
                                                                ) : (
                                                                    <SelectValue placeholder="Sélectionner..." />
                                                                )}
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {services.map((service) => (
                                                                    <SelectItem key={service.id} value={service.id.toString()}>
                                                                        <div className="flex flex-col py-1">
                                                                            <span className="text-sm font-medium">{service.nom}</span>
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
                                                            className="text-right text-xs w-full min-w-[80px]"
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
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                            className="flex-1 sm:flex-none"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || lignes.length === 0}
                            className="flex-1 sm:flex-none"
                        >
                            {processing ? (
                                <>
                                    <Calculator className="mr-2 h-4 w-4 animate-spin" />
                                    Modification...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Enregistrer les modifications
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
