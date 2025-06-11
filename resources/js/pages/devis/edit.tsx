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
    Calendar,
    Euro,
    StickyNote,
    AlertCircle,
    Check,
    X,
    Calculator
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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
    description?: string;
    conditions?: string;
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
    const [activeSection, setActiveSection] = useState<'basic' | 'dates' | 'amounts' | 'details'>('basic');
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);

    // Fonction pour formater une date correctement
    const formatDateForInput = (dateValue: any) => {
        if (!dateValue) return '';

        // Si c'est déjà au bon format (YYYY-MM-DD)
        if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateValue;
        }

        // Si c'est une date ISO, extraire la partie date
        if (typeof dateValue === 'string' && dateValue.includes('T')) {
            return dateValue.split('T')[0];
        }

        // Tenter de créer une Date et la formater
        try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch (e) {
            console.warn('Impossible de formater la date:', dateValue);
        }

        return '';
    };

    const { data, setData, patch, processing, errors, isDirty: formIsDirty, reset } = useForm({
        numero_devis: devis.numero_devis || '',
        client_id: devis.client_id?.toString() || '',
        objet: devis.objet || '',
        statut: devis.statut || 'brouillon',
        date_devis: formatDateForInput(devis.date_devis) || new Date().toISOString().split('T')[0],
        date_validite: formatDateForInput(devis.date_validite) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        montant_ht: devis.montant_ht?.toString() || '0',
        taux_tva: devis.taux_tva?.toString() || '20',
        notes: devis.notes || '',
        description: devis.description || '',
        conditions: devis.conditions || '',
    });

    // Surveiller les changements
    useEffect(() => {
        setIsDirty(formIsDirty);
        setShowUnsavedChanges(formIsDirty);
    }, [formIsDirty]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/devis/${devis.id}`, {
            onSuccess: () => {
                toast.success('Devis modifié avec succès');
                setIsDirty(false);
                setShowUnsavedChanges(false);
            },
            onError: () => {
                toast.error('Une erreur est survenue lors de la modification');
            }
        });
    };

    const handleReset = () => {
        reset();
        setIsDirty(false);
        setShowUnsavedChanges(false);
        toast.info('Modifications annulées');
    };

    // Validation en temps réel
    const getFieldError = (field: string) => {
        return errors[field as keyof typeof errors];
    };

    const getFieldStatus = (field: string, value: string) => {
        if (getFieldError(field)) return 'error';
        if (value && !getFieldError(field)) return 'success';
        return 'default';
    };

    const renderFieldIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <Check className="h-4 w-4 text-green-500" />;
            case 'error':
                return <X className="h-4 w-4 text-destructive" />;
            default:
                return null;
        }
    };

    const montantTTC = data.montant_ht ?
        parseFloat(data.montant_ht) * (1 + parseFloat(data.taux_tva) / 100) : 0;

    const sections = [
        {
            id: 'basic',
            label: 'Informations de base',
            icon: FileText,
            required: true
        },
        {
            id: 'dates',
            label: 'Dates & Statut',
            icon: Calendar,
            required: true
        },
        {
            id: 'amounts',
            label: 'Montants & TVA',
            icon: Euro,
            required: true
        },
        {
            id: 'details',
            label: 'Détails & Notes',
            icon: StickyNote,
            required: false
        }
    ] as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs(devis)}>
            <Head title={`Modifier ${devis.numero_devis}`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête avec indicateur de modifications */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <Button variant="outline" size="sm" asChild className="shrink-0">
                                        <Link href={`/devis/${devis.id}`}>
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Retour
                                        </Link>
                                    </Button>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-3xl font-bold tracking-tight">
                                                Modifier {devis.numero_devis}
                                            </h1>
                                            {showUnsavedChanges && (
                                                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    Modifications non sauvegardées
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground">
                                            Modifiez les informations du devis
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {isDirty && (
                                        <Button variant="outline" size="sm" onClick={handleReset}>
                                            <X className="mr-2 h-4 w-4" />
                                            Annuler
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={handleSubmit}
                                        disabled={processing || !isDirty}
                                        className="min-w-[140px]"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing ? 'Sauvegarde...' : 'Sauvegarder'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Navigation des sections */}
                    <Card className="lg:h-fit">
                        <CardHeader>
                            <CardTitle className="text-base">Sections</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <nav className="space-y-1">
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    const isActive = activeSection === section.id;
                                    const hasErrors = Object.keys(errors).some(field => {
                                        if (section.id === 'basic') return ['numero_devis', 'client_id', 'objet'].includes(field);
                                        if (section.id === 'dates') return ['date_devis', 'date_validite', 'statut'].includes(field);
                                        if (section.id === 'amounts') return ['montant_ht', 'taux_tva'].includes(field);
                                        if (section.id === 'details') return ['description', 'conditions', 'notes'].includes(field);
                                        return false;
                                    });

                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                                                isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span className="flex-1">{section.label}</span>
                                            {section.required && (
                                                <span className="text-xs text-destructive">*</span>
                                            )}
                                            {hasErrors && (
                                                <AlertCircle className="h-4 w-4 text-destructive" />
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </CardContent>
                    </Card>

                    {/* Contenu du formulaire */}
                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit}>
                            {/* Section Informations de base */}
                            {activeSection === 'basic' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Informations de base
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Renseignez les informations principales du devis
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="numero_devis" className="flex items-center gap-2">
                                                    Numéro de devis
                                                    <span className="text-destructive">*</span>
                                                    {renderFieldIcon(getFieldStatus('numero_devis', data.numero_devis))}
                                                </Label>
                                                <Input
                                                    id="numero_devis"
                                                    value={data.numero_devis}
                                                    onChange={(e) => setData('numero_devis', e.target.value)}
                                                    placeholder="DEV-2025-0001"
                                                    required
                                                    className={getFieldError('numero_devis') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('numero_devis') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('numero_devis')}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="client_id" className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    Client
                                                    <span className="text-destructive">*</span>
                                                    {renderFieldIcon(getFieldStatus('client_id', data.client_id))}
                                                </Label>
                                                <Select
                                                    value={data.client_id || undefined}
                                                    onValueChange={(value) => setData('client_id', value)}
                                                    required
                                                >
                                                    <SelectTrigger className={getFieldError('client_id') ? 'border-destructive' : ''}>
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
                                                {getFieldError('client_id') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('client_id')}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    Le client qui recevra ce devis
                                                </p>
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="objet" className="flex items-center gap-2">
                                                    Objet du devis
                                                    <span className="text-destructive">*</span>
                                                    {renderFieldIcon(getFieldStatus('objet', data.objet))}
                                                </Label>
                                                <Input
                                                    id="objet"
                                                    value={data.objet}
                                                    onChange={(e) => setData('objet', e.target.value)}
                                                    placeholder="Développement application web"
                                                    required
                                                    className={getFieldError('objet') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('objet') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('objet')}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    Une description courte du service ou produit proposé
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Section Dates & Statut */}
                            {activeSection === 'dates' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="h-5 w-5" />
                                            Dates & Statut
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Définissez les dates importantes et le statut du devis
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="date_devis" className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    Date du devis
                                                    <span className="text-destructive">*</span>
                                                    {renderFieldIcon(getFieldStatus('date_devis', data.date_devis))}
                                                </Label>
                                                <Input
                                                    id="date_devis"
                                                    type="date"
                                                    value={data.date_devis}
                                                    onChange={(e) => setData('date_devis', e.target.value)}
                                                    required
                                                    className={getFieldError('date_devis') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('date_devis') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('date_devis')}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="date_validite" className="flex items-center gap-2">
                                                    Date de validité
                                                    <span className="text-destructive">*</span>
                                                    {renderFieldIcon(getFieldStatus('date_validite', data.date_validite))}
                                                </Label>
                                                <Input
                                                    id="date_validite"
                                                    type="date"
                                                    value={data.date_validite}
                                                    onChange={(e) => setData('date_validite', e.target.value)}
                                                    required
                                                    className={getFieldError('date_validite') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('date_validite') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('date_validite')}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    Date limite d'acceptation du devis
                                                </p>
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="statut">Statut du devis</Label>
                                                <Select
                                                    value={data.statut}
                                                    onValueChange={(value) => setData('statut', value as typeof data.statut)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Statut du devis" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="brouillon">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                                                Brouillon
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="envoye">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                Envoyé
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="accepte">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                                Accepté
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="refuse">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                                Refusé
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="expire">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                                Expiré
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {getFieldError('statut') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('statut')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Section Montants & TVA */}
                            {activeSection === 'amounts' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Euro className="h-5 w-5" />
                                            Montants & TVA
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Définissez les montants et le taux de TVA applicable
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="montant_ht" className="flex items-center gap-2">
                                                    <Euro className="h-4 w-4" />
                                                    Montant HT (€)
                                                    <span className="text-destructive">*</span>
                                                    {renderFieldIcon(getFieldStatus('montant_ht', data.montant_ht))}
                                                </Label>
                                                <Input
                                                    id="montant_ht"
                                                    type="number"
                                                    value={data.montant_ht}
                                                    onChange={(e) => setData('montant_ht', e.target.value)}
                                                    placeholder="5000.00"
                                                    step="0.01"
                                                    min="0"
                                                    required
                                                    className={getFieldError('montant_ht') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('montant_ht') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('montant_ht')}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    Montant hors taxes
                                                </p>
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
                                                {getFieldError('taux_tva') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('taux_tva')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {data.montant_ht && (
                                            <div className="mt-6">
                                                <Separator className="mb-4" />
                                                <div className="bg-muted/50 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Calculator className="h-4 w-4" />
                                                        <h4 className="font-medium">Calcul automatique</h4>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <span>Montant HT :</span>
                                                            <span>{parseFloat(data.montant_ht).toFixed(2)} €</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>TVA ({data.taux_tva}%) :</span>
                                                            <span>{(montantTTC - parseFloat(data.montant_ht)).toFixed(2)} €</span>
                                                        </div>
                                                        <Separator />
                                                        <div className="flex justify-between font-bold text-lg">
                                                            <span>Montant TTC :</span>
                                                            <span className="text-primary">{montantTTC.toFixed(2)} €</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Section Détails & Notes */}
                            {activeSection === 'details' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <StickyNote className="h-5 w-5" />
                                            Détails & Notes
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Ajoutez des détails, conditions et notes pour le devis
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description détaillée</Label>
                                            <Textarea
                                                id="description"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                placeholder="Description détaillée du service ou produit proposé..."
                                                className="min-h-[100px]"
                                            />
                                            {getFieldError('description') && (
                                                <div className="flex items-center gap-2 text-sm text-destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {getFieldError('description')}
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Cette description apparaîtra sur le PDF du devis
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="conditions">Conditions générales</Label>
                                            <Textarea
                                                id="conditions"
                                                value={data.conditions}
                                                onChange={(e) => setData('conditions', e.target.value)}
                                                placeholder="Conditions de paiement, délais, garanties..."
                                                className="min-h-[80px]"
                                            />
                                            {getFieldError('conditions') && (
                                                <div className="flex items-center gap-2 text-sm text-destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {getFieldError('conditions')}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Notes internes</Label>
                                            <Textarea
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                placeholder="Notes internes (non visibles sur le PDF)..."
                                                className="min-h-[80px]"
                                            />
                                            {getFieldError('notes') && (
                                                <div className="flex items-center gap-2 text-sm text-destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {getFieldError('notes')}
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Ces notes ne sont visibles que dans l'interface d'administration
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
