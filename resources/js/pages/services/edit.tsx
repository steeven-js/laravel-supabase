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
    Settings,
    Calculator,
    Info,
    Activity,
    BarChart3
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Service {
    id: number;
    nom: string;
    code: string;
    description?: string;
    prix_ht: number;
    qte_defaut: number;
    unite?: string;
    actif: boolean;
    lignes_devis_count: number;
    lignes_factures_count: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    service: Service;
}

const breadcrumbs = (service: Service): BreadcrumbItem[] => [
    {
        title: 'Accueil',
        href: '/dashboard',
    },
    {
        title: 'Gestion',
        href: '/dashboard',
    },
    {
        title: 'Services',
        href: '/services',
    },
    {
        title: service.nom,
        href: `/services/${service.id}`,
    },
    {
        title: 'Modification',
        href: `/services/${service.id}/edit`,
    },
];

export default function ServiceEdit({ service }: Props) {
    const [activeSection, setActiveSection] = useState<'basic' | 'pricing' | 'details'>('basic');
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);

    const { data, setData, patch, processing, errors, isDirty: formIsDirty, reset } = useForm({
        nom: service.nom || '',
        code: service.code || '',
        description: service.description || '',
        prix_ht: service.prix_ht?.toString() || '0',
        qte_defaut: service.qte_defaut?.toString() || '1',
        unite: service.unite || 'heure',
        actif: service.actif,
    });

    // Surveiller les changements
    useEffect(() => {
        setIsDirty(formIsDirty);
        setShowUnsavedChanges(formIsDirty);
    }, [formIsDirty]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/services/${service.id}`, {
            onSuccess: () => {
                toast.success('Service modifié avec succès');
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
            required: true
        },
        {
            id: 'pricing',
            label: 'Tarification',
            icon: Euro,
            required: true
        },
        {
            id: 'details',
            label: 'Détails & Options',
            icon: Settings,
            required: false
        }
    ] as const;

    // Calcul du prix TTC (20% par défaut)
    const prixTTC = data.prix_ht ? parseFloat(data.prix_ht) * 1.20 : 0;
    const montantLigneDefaut = data.prix_ht && data.qte_defaut ?
        parseFloat(data.prix_ht) * parseInt(data.qte_defaut) : 0;

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
        <AppLayout breadcrumbs={breadcrumbs(service)}>
            <Head title={`Modifier ${service.nom}`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Bouton retour */}
                <div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/services/${service.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                </div>

                {/* En-tête avec indicateur de modifications */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-3xl font-bold tracking-tight">
                                                Modifier {service.nom}
                                            </h1>
                                            {showUnsavedChanges && (
                                                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    Modifications non sauvegardées
                                                </Badge>
                                            )}
                                            <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md">
                                                <Hash className="h-4 w-4 text-muted-foreground" />
                                                <code className="text-sm font-mono">{service.code}</code>
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground">
                                            Modifiez les informations de ce service
                                        </p>
                                        {(service.lignes_devis_count > 0 || service.lignes_factures_count > 0) && (
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <FileText className="h-4 w-4" />
                                                    {service.lignes_devis_count} devis
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <BarChart3 className="h-4 w-4" />
                                                    {service.lignes_factures_count} factures
                                                </div>
                                            </div>
                                        )}
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
                                            <Package className="h-5 w-5" />
                                            Informations de base
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Modifiez le nom et le code du service
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
                                                Code unique pour identifier le service
                                            </p>
                                        </div>

                                        {(service.lignes_devis_count > 0 || service.lignes_factures_count > 0) && (
                                            <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                                                            Service utilisé
                                                        </h4>
                                                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                                            Ce service est utilisé dans {service.lignes_devis_count} devis et {service.lignes_factures_count} factures.
                                                            Les modifications du nom et du code n'affecteront que les nouveaux documents.
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
                                            Modifiez le prix unitaire et la quantité par défaut
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

                                        <div className="space-y-2">
                                            <Label htmlFor="unite" className="flex items-center gap-2">
                                                <Calculator className="h-4 w-4" />
                                                Type d'unité
                                                <span className="text-destructive">*</span>
                                                {renderFieldIcon(getFieldStatus('unite', data.unite))}
                                            </Label>
                                            <Select value={data.unite} onValueChange={(value) => setData('unite', value)}>
                                                <SelectTrigger className={getFieldError('unite') ? 'border-destructive' : ''}>
                                                    <SelectValue placeholder="Sélectionner une unité" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="heure">Heure(s)</SelectItem>
                                                    <SelectItem value="journee">Journée(s)</SelectItem>
                                                    <SelectItem value="semaine">Semaine(s)</SelectItem>
                                                    <SelectItem value="mois">Mois</SelectItem>
                                                    <SelectItem value="unite">Unité(s)</SelectItem>
                                                    <SelectItem value="forfait">Forfait(s)</SelectItem>
                                                    <SelectItem value="licence">Licence(s)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {getFieldError('unite') && (
                                                <div className="flex items-center gap-2 text-sm text-destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {getFieldError('unite')}
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Type d'unité utilisé pour facturer ce service (ex: {data.qte_defaut} {data.unite === 'heure' ? data.qte_defaut === '1' ? 'heure' : 'heures' : data.unite === 'journee' ? data.qte_defaut === '1' ? 'journée' : 'journées' : data.unite === 'semaine' ? data.qte_defaut === '1' ? 'semaine' : 'semaines' : data.unite === 'mois' ? 'mois' : data.unite === 'unite' ? data.qte_defaut === '1' ? 'unité' : 'unités' : data.unite === 'forfait' ? data.qte_defaut === '1' ? 'forfait' : 'forfaits' : data.unite === 'licence' ? data.qte_defaut === '1' ? 'licence' : 'licences' : data.unite})
                                            </p>
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
                                                                {formatPrice(prixTTC)}
                                                            </div>
                                                        </div>
                                                        {data.qte_defaut && (
                                                            <div className="text-center p-3 bg-background rounded-lg">
                                                                <div className="text-sm text-muted-foreground">
                                                                    Ligne défaut HT (×{data.qte_defaut})
                                                                </div>
                                                                <div className="text-lg font-bold">
                                                                    {formatPrice(montantLigneDefaut)}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="text-center p-3 bg-background rounded-lg">
                                                            <div className="text-sm text-muted-foreground">Marge TVA</div>
                                                            <div className="text-lg font-bold text-green-600">
                                                                {formatPrice(prixTTC - parseFloat(data.prix_ht || '0'))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {(service.lignes_devis_count > 0 || service.lignes_factures_count > 0) && (
                                            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-medium text-blue-900 dark:text-blue-100">
                                                            Impact des modifications
                                                        </h4>
                                                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                            Les modifications de prix n'affecteront que les nouveaux devis et factures.
                                                            Les documents existants conserveront leurs prix actuels.
                                                        </p>
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
                                            {/* Switch de statut mis en évidence */}
                                            <div className="relative">
                                                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg blur opacity-30 animate-pulse"></div>
                                                <div className="relative bg-white dark:bg-gray-800 rounded-lg">
                                                    <div className="flex items-center justify-between p-6 border-2 border-green-300 hover:border-green-400 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg">
                                                        <div className="space-y-2">
                                                            <div className="font-semibold text-green-900 flex items-center gap-2">
                                                                🚨 Service actif (Action importante)
                                                                <Settings className="h-4 w-4" />
                                                            </div>
                                                            <div className="text-sm text-green-800 font-medium">
                                                                Le service est disponible pour créer des devis et factures
                                                            </div>
                                                            <div className="text-xs text-green-700">
                                                                ⚡ Ce changement aura un impact immédiat sur la disponibilité du service
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full blur opacity-50"></div>
                                                            <div className="relative">
                                                                <Switch
                                                                    checked={data.actif}
                                                                    onCheckedChange={(checked: boolean) => setData('actif', checked)}
                                                                    className="scale-125"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Informations système */}
                                        <div className="bg-muted/30 rounded-lg p-4">
                                            <h4 className="font-medium mb-3 flex items-center gap-2">
                                                <Activity className="h-4 w-4" />
                                                Informations système
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <div className="text-muted-foreground">Date de création</div>
                                                    <div className="font-medium">{formatDate(service.created_at)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Dernière modification</div>
                                                    <div className="font-medium">{formatDate(service.updated_at)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Utilisé dans devis</div>
                                                    <div className="font-medium">{service.lignes_devis_count} fois</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Utilisé dans factures</div>
                                                    <div className="font-medium">{service.lignes_factures_count} fois</div>
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
