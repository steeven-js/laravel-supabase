import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    Package,
    Euro,
    Hash,
    FileText,
    AlertCircle,
    Check,
    X,
    Sparkles,
    Info,
    Calculator,
    Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Services',
        href: '/services',
    },
    {
        title: 'Créer',
        href: '/services/create',
    },
];

export default function ServiceCreate() {
    const [activeSection, setActiveSection] = useState<'basic' | 'pricing' | 'details'>('basic');
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        nom: '',
        code: '',
        description: '',
        prix_ht: '',
        qte_defaut: '1',
        actif: true,
    });

    // Générer automatiquement le code basé sur le nom
    useEffect(() => {
        if (data.nom && !data.code) {
            const generatedCode = data.nom
                .toUpperCase()
                .replace(/[^A-Z0-9\s]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 20);
            setData('code', generatedCode);
        }
    }, [data.nom]);

    // Surveiller la completion des sections
    useEffect(() => {
        const newCompleted = new Set<string>();

        // Section basic
        if (data.nom && data.code) {
            newCompleted.add('basic');
        }

        // Section pricing
        if (data.prix_ht && data.qte_defaut) {
            newCompleted.add('pricing');
        }

        // Section details (toujours complète car optionnelle)
        newCompleted.add('details');

        setCompletedSections(newCompleted);
    }, [data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/services', {
            onSuccess: () => {
                toast.success('Service créé avec succès');
            },
            onError: () => {
                toast.error('Une erreur est survenue lors de la création');
            }
        });
    };

    const handleClearForm = () => {
        setData({
            nom: '',
            code: '',
            description: '',
            prix_ht: '',
            qte_defaut: '1',
            actif: true,
        });
        clearErrors();
        setActiveSection('basic');
        toast.info('Formulaire réinitialisé');
    };

    // Validation en temps réel
    const getFieldError = (field: string) => {
        return errors[field as keyof typeof errors];
    };

    const getFieldStatus = (field: string, value: string | boolean) => {
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

    const sections = [
        {
            id: 'basic',
            label: 'Informations de base',
            icon: Package,
            required: true,
            description: 'Nom et code du service'
        },
        {
            id: 'pricing',
            label: 'Tarification',
            icon: Euro,
            required: true,
            description: 'Prix et quantités'
        },
        {
            id: 'details',
            label: 'Détails & Options',
            icon: Settings,
            required: false,
            description: 'Description et paramètres'
        }
    ] as const;

    const isFormValid = data.nom && data.code && data.prix_ht && data.qte_defaut;
    const progressPercentage = Math.round((completedSections.size / sections.length) * 100);

    // Calcul du prix TTC (20% par défaut)
    const prixTTC = data.prix_ht ? parseFloat(data.prix_ht) * 1.20 : 0;
    const montantLigneDefaut = data.prix_ht && data.qte_defaut ?
        parseFloat(data.prix_ht) * parseInt(data.qte_defaut) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Créer un service" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête avec progress */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <Button variant="outline" size="sm" asChild className="shrink-0">
                                        <Link href="/services">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Retour
                                        </Link>
                                    </Button>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-3xl font-bold tracking-tight">
                                                Créer un service
                                            </h1>
                                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                                                <Sparkles className="h-3 w-3 mr-1" />
                                                Nouveau
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground">
                                            Ajoutez un nouveau service à votre catalogue
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
                                        {processing ? 'Création...' : 'Créer le service'}
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
                                        if (section.id === 'basic') return ['nom', 'code'].includes(field);
                                        if (section.id === 'pricing') return ['prix_ht', 'qte_defaut'].includes(field);
                                        if (section.id === 'details') return ['description'].includes(field);
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
                                            <Package className="h-5 w-5" />
                                            Informations de base
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Définissez le nom et le code du service
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="nom" className="flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                Nom du service
                                                <span className="text-destructive">*</span>
                                                {renderFieldIcon(getFieldStatus('nom', data.nom))}
                                            </Label>
                                            <Input
                                                id="nom"
                                                value={data.nom}
                                                onChange={(e) => setData('nom', e.target.value)}
                                                placeholder="Développement application web"
                                                required
                                                className={getFieldError('nom') ? 'border-destructive' : ''}
                                            />
                                            {getFieldError('nom') && (
                                                <div className="flex items-center gap-2 text-sm text-destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {getFieldError('nom')}
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Le nom qui apparaîtra dans les devis et factures
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="code" className="flex items-center gap-2">
                                                <Hash className="h-4 w-4" />
                                                Code du service
                                                <span className="text-destructive">*</span>
                                                {renderFieldIcon(getFieldStatus('code', data.code))}
                                            </Label>
                                            <Input
                                                id="code"
                                                value={data.code}
                                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                                placeholder="DEV-APP-WEB"
                                                required
                                                className={getFieldError('code') ? 'border-destructive' : ''}
                                            />
                                            {getFieldError('code') && (
                                                <div className="flex items-center gap-2 text-sm text-destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {getFieldError('code')}
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Code unique pour identifier le service (généré automatiquement depuis le nom)
                                            </p>
                                        </div>

                                        {data.nom && data.code && (
                                            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-medium text-green-900 dark:text-green-100">
                                                            Informations validées
                                                        </h4>
                                                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                                            Service: <strong>{data.nom}</strong> avec le code <strong>{data.code}</strong>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Section Tarification */}
                            {activeSection === 'pricing' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Euro className="h-5 w-5" />
                                            Tarification
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Définissez le prix unitaire et la quantité par défaut
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="prix_ht" className="flex items-center gap-2">
                                                    <Euro className="h-4 w-4" />
                                                    Prix unitaire HT (€)
                                                    <span className="text-destructive">*</span>
                                                    {renderFieldIcon(getFieldStatus('prix_ht', data.prix_ht))}
                                                </Label>
                                                <Input
                                                    id="prix_ht"
                                                    type="number"
                                                    value={data.prix_ht}
                                                    onChange={(e) => setData('prix_ht', e.target.value)}
                                                    placeholder="1500.00"
                                                    step="0.01"
                                                    min="0"
                                                    required
                                                    className={getFieldError('prix_ht') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('prix_ht') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('prix_ht')}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    Prix hors taxes par unité
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="qte_defaut" className="flex items-center gap-2">
                                                    Quantité par défaut
                                                    <span className="text-destructive">*</span>
                                                    {renderFieldIcon(getFieldStatus('qte_defaut', data.qte_defaut))}
                                                </Label>
                                                <Input
                                                    id="qte_defaut"
                                                    type="number"
                                                    value={data.qte_defaut}
                                                    onChange={(e) => setData('qte_defaut', e.target.value)}
                                                    placeholder="1"
                                                    min="1"
                                                    required
                                                    className={getFieldError('qte_defaut') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('qte_defaut') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('qte_defaut')}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    Quantité proposée par défaut dans les devis
                                                </p>
                                            </div>
                                        </div>

                                        {data.prix_ht && (
                                            <div className="mt-6">
                                                <div className="bg-muted/50 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Calculator className="h-4 w-4" />
                                                        <h4 className="font-medium">Calculs automatiques</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="text-center p-3 bg-background rounded-lg">
                                                            <div className="text-sm text-muted-foreground">Prix TTC (20%)</div>
                                                            <div className="text-lg font-bold text-primary">
                                                                {new Intl.NumberFormat('fr-FR', {
                                                                    style: 'currency',
                                                                    currency: 'EUR'
                                                                }).format(prixTTC)}
                                                            </div>
                                                        </div>
                                                        {data.qte_defaut && (
                                                            <div className="text-center p-3 bg-background rounded-lg">
                                                                <div className="text-sm text-muted-foreground">
                                                                    Ligne défaut HT (×{data.qte_defaut})
                                                                </div>
                                                                <div className="text-lg font-bold">
                                                                    {new Intl.NumberFormat('fr-FR', {
                                                                        style: 'currency',
                                                                        currency: 'EUR'
                                                                    }).format(montantLigneDefaut)}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="text-center p-3 bg-background rounded-lg">
                                                            <div className="text-sm text-muted-foreground">Marge TVA</div>
                                                            <div className="text-lg font-bold text-green-600">
                                                                {new Intl.NumberFormat('fr-FR', {
                                                                    style: 'currency',
                                                                    currency: 'EUR'
                                                                }).format(prixTTC - parseFloat(data.prix_ht || '0'))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Section Détails & Options */}
                            {activeSection === 'details' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Settings className="h-5 w-5" />
                                            Détails & Options
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Description détaillée et paramètres du service
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Description
                                            </Label>
                                            <Textarea
                                                id="description"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                placeholder="Description détaillée du service proposé..."
                                                className="min-h-[120px]"
                                            />
                                            {getFieldError('description') && (
                                                <div className="flex items-center gap-2 text-sm text-destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {getFieldError('description')}
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Cette description pourra être affichée dans les devis et factures
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="space-y-1">
                                                    <div className="font-medium">Service actif</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Le service est disponible pour créer des devis et factures
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={data.actif}
                                                    onCheckedChange={(checked) => setData('actif', checked)}
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                                                        Service prêt à être créé
                                                    </h4>
                                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                        Votre service sera disponible immédiatement dans l'interface de création
                                                        de devis et factures. Vous pourrez toujours le modifier par la suite.
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
