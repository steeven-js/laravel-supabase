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
    Calculator,
    Sparkles,
    FileCheck
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
    entreprise?: {
        nom: string;
        nom_commercial?: string;
    };
}

interface Props {
    clients: Client[];
}

export default function DevisCreate({ clients }: Props) {
    const [activeSection, setActiveSection] = useState<'basic' | 'dates' | 'amounts' | 'details'>('basic');
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        client_id: '',
        objet: '',
        description: '',
        date_devis: new Date().toISOString().split('T')[0],
        date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 jours
        montant_ht: '',
        taux_tva: '20',
        conditions: '',
        notes: '',
    });

    // Surveiller la completion des sections
    useEffect(() => {
        const newCompleted = new Set<string>();

        // Section basic
        if (data.client_id && data.objet) {
            newCompleted.add('basic');
        }

        // Section dates
        if (data.date_devis && data.date_validite) {
            newCompleted.add('dates');
        }

        // Section amounts
        if (data.montant_ht) {
            newCompleted.add('amounts');
        }

        // Section details (toujours complète car optionnelle)
        newCompleted.add('details');

        setCompletedSections(newCompleted);
    }, [data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/devis', {
            onSuccess: () => {
                toast.success('Devis créé avec succès');
            },
            onError: () => {
                toast.error('Une erreur est survenue lors de la création');
            }
        });
    };

    const handleClearForm = () => {
        setData({
            client_id: '',
            objet: '',
            description: '',
            date_devis: new Date().toISOString().split('T')[0],
            date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            montant_ht: '',
            taux_tva: '20',
            conditions: '',
            notes: '',
        });
        clearErrors();
        setActiveSection('basic');
        toast.info('Formulaire réinitialisé');
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
            required: true,
            description: 'Client et objet du devis'
        },
        {
            id: 'dates',
            label: 'Dates',
            icon: Calendar,
            required: true,
            description: 'Dates de création et validité'
        },
        {
            id: 'amounts',
            label: 'Montants & TVA',
            icon: Euro,
            required: true,
            description: 'Montant HT et taux de TVA'
        },
        {
            id: 'details',
            label: 'Détails & Notes',
            icon: StickyNote,
            required: false,
            description: 'Description et conditions'
        }
    ] as const;

    const isFormValid = data.client_id && data.objet && data.date_devis && data.date_validite && data.montant_ht;
    const progressPercentage = Math.round((completedSections.size / sections.length) * 100);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Créer un devis" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête avec progress */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <Button variant="outline" size="sm" asChild className="shrink-0">
                                        <Link href="/devis">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Retour
                                        </Link>
                                    </Button>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-3xl font-bold tracking-tight">
                                                Créer un devis
                                            </h1>
                                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                                                <Sparkles className="h-3 w-3 mr-1" />
                                                Nouveau
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground">
                                            Créez un nouveau devis pour un client
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-muted rounded-full h-2 max-w-[200px]">
                                                <div
                                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${progressPercentage}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {progressPercentage}% complété
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button variant="outline" size="sm" onClick={handleClearForm}>
                                        <X className="mr-2 h-4 w-4" />
                                        Réinitialiser
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSubmit}
                                        disabled={processing || !isFormValid}
                                        className="min-w-[140px]"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing ? 'Création...' : 'Créer le devis'}
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
                            <CardTitle className="text-base">Progression</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <nav className="space-y-1">
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    const isActive = activeSection === section.id;
                                    const isCompleted = completedSections.has(section.id);
                                    const hasErrors = Object.keys(errors).some(field => {
                                        if (section.id === 'basic') return ['client_id', 'objet'].includes(field);
                                        if (section.id === 'dates') return ['date_devis', 'date_validite'].includes(field);
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
                                            <div className="relative">
                                                <Icon className="h-4 w-4" />
                                                {isCompleted && !hasErrors && (
                                                    <Check className="absolute -top-1 -right-1 h-3 w-3 text-green-500 bg-background rounded-full" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">{section.label}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {section.description}
                                                </div>
                                            </div>
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
                                            Sélectionnez le client et définissez l'objet du devis
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="client_id" className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Client
                                                <span className="text-destructive">*</span>
                                                {renderFieldIcon(getFieldStatus('client_id', data.client_id))}
                                            </Label>
                                            <Select
                                                value={data.client_id}
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

                                        <div className="space-y-2">
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

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description détaillée</Label>
                                            <Textarea
                                                id="description"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                placeholder="Description détaillée du devis..."
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
                                    </CardContent>
                                </Card>
                            )}

                            {/* Section Dates */}
                            {activeSection === 'dates' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="h-5 w-5" />
                                            Dates importantes
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Définissez les dates d'émission et de validité du devis
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
                                                <p className="text-xs text-muted-foreground">
                                                    Date d'émission du devis (par défaut aujourd'hui)
                                                </p>
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
                                                    Date limite d'acceptation (par défaut +30 jours)
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                                                        Conseil pour les dates
                                                    </h4>
                                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                        La date de validité doit être postérieure à la date du devis.
                                                        Un délai de 30 jours est généralement recommandé pour laisser
                                                        suffisamment de temps au client pour prendre sa décision.
                                                    </p>
                                                </div>
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
                                            Définissez le montant hors taxes et le taux de TVA applicable
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
                                                    Montant hors taxes en euros
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
                                                <p className="text-xs text-muted-foreground">
                                                    Taux de TVA applicable (20% par défaut)
                                                </p>
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
                                            Ajoutez des conditions générales et des notes pour le devis
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
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
                                            <p className="text-xs text-muted-foreground">
                                                Ces conditions apparaîtront sur le PDF du devis
                                            </p>
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

                                        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <FileCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-medium text-green-900 dark:text-green-100">
                                                        Prêt à créer votre devis ?
                                                    </h4>
                                                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                                        Vérifiez que toutes les informations sont correctes avant de créer le devis.
                                                        Vous pourrez toujours le modifier par la suite si nécessaire.
                                                    </p>
                                                </div>
                                            </div>
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
