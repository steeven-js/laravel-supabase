import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    Building2,
    MapPin,
    Mail,
    Phone,
    FileText,
    AlertCircle,
    Check,
    X,
    Globe,
    Users,
    Euro,
    Shield,
    Plus,
    Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Entreprises',
        href: '/entreprises',
    },
    {
        title: 'Créer',
        href: '/entreprises/create',
    },
];

export default function EntreprisesCreate() {
    const [activeSection, setActiveSection] = useState<'company' | 'contact' | 'legal' | 'business' | 'notes'>('company');
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        nom: '',
        nom_commercial: '',
        secteur_activite: '',
        email: '',
        telephone: '',
        site_web: '',
        adresse: '',
        ville: '',
        code_postal: '',
        pays: 'France',
        siret: '',
        siren: '',

        active: true as boolean,
        notes: '',
    });

    // Surveiller la completion des sections
    useEffect(() => {
        const newCompleted = new Set<string>();

        // Section company
        if (data.nom && data.secteur_activite) {
            newCompleted.add('company');
        }

        // Section contact (optionnelle mais on peut la marquer complète si au moins un champ)
        if (data.email || data.telephone || data.site_web || data.adresse) {
            newCompleted.add('contact');
        }

        // Section legal (optionnelle)
        if (data.siret || data.siren) {
            newCompleted.add('legal');
        } else {
            // Marquer comme complète même si vide car optionnelle
            newCompleted.add('legal');
        }

        // Section business (optionnelle)
        // Marquer comme complète même si vide car optionnelle
        newCompleted.add('business');

        // Section notes (toujours complète car optionnelle)
        newCompleted.add('notes');

        setCompletedSections(newCompleted);
    }, [data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/entreprises', {
            onSuccess: () => {
                toast.success('Entreprise créée avec succès');
            },
            onError: () => {
                toast.error('Une erreur est survenue lors de la création');
            }
        });
    };

    const handleClearForm = () => {
        setData({
            nom: '',
            nom_commercial: '',
            secteur_activite: '',
            email: '',
            telephone: '',
            site_web: '',
            adresse: '',
            ville: '',
            code_postal: '',
            pays: 'France',
            siret: '',
            siren: '',
            active: true,
            notes: '',
        });
        clearErrors();
        setActiveSection('company');
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

    const sections = [
        {
            id: 'company',
            label: 'Informations entreprise',
            icon: Building2,
            required: true,
            description: 'Nom et secteur d\'activité'
        },
        {
            id: 'contact',
            label: 'Contact & Adresse',
            icon: MapPin,
            required: false,
            description: 'Coordonnées et localisation'
        },
        {
            id: 'legal',
            label: 'Informations légales',
            icon: Shield,
            required: false,
            description: 'SIRET et SIREN'
        },
        {
            id: 'business',
            label: 'Statut entreprise',
            icon: Users,
            required: false,
            description: 'Statut actif/inactif'
        },
        {
            id: 'notes',
            label: 'Notes & Commentaires',
            icon: FileText,
            required: false,
            description: 'Notes internes'
        }
    ] as const;

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

    const isFormValid = data.nom && data.secteur_activite;
    const progressPercentage = Math.round((completedSections.size / sections.length) * 100);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Créer une entreprise" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête avec progress */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <Button variant="outline" size="sm" asChild className="shrink-0">
                                        <Link href="/entreprises">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Retour
                                        </Link>
                                    </Button>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-3xl font-bold tracking-tight">
                                                Créer une nouvelle entreprise
                                            </h1>
                                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                                                <Sparkles className="h-3 w-3 mr-1" />
                                                Nouveau
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>Ajoutez une nouvelle entreprise à votre base de données</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-300 ease-out"
                                                        style={{ width: `${progressPercentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium">{progressPercentage}%</span>
                                            </div>
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
                                        {processing ? 'Création...' : 'Créer l\'entreprise'}
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
                            <CardTitle className="text-base">Assistant de création</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Suivez les étapes pour créer votre entreprise
                            </p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <nav className="space-y-1">
                                {sections.map((section, index) => {
                                    const Icon = section.icon;
                                    const isActive = activeSection === section.id;
                                    const isCompleted = completedSections.has(section.id);
                                    const hasErrors = Object.keys(errors).some(field => {
                                        if (section.id === 'company') return ['nom', 'nom_commercial', 'secteur_activite'].includes(field);
                                        if (section.id === 'contact') return ['email', 'telephone', 'site_web', 'adresse', 'ville', 'code_postal', 'pays'].includes(field);
                                        if (section.id === 'legal') return ['siret', 'siren'].includes(field);
                                        if (section.id === 'business') return ['active'].includes(field);
                                        if (section.id === 'notes') return ['notes'].includes(field);
                                        return false;
                                    });

                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-full flex items-start gap-3 px-4 py-3 text-left text-sm transition-colors ${isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${isCompleted
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : isActive
                                                            ? 'border-primary-foreground'
                                                            : 'border-muted-foreground'
                                                    }`}>
                                                    {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                                                </div>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{section.label}</span>
                                                    {section.required && (
                                                        <span className="text-xs text-destructive">*</span>
                                                    )}
                                                    {hasErrors && (
                                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                                    )}
                                                </div>
                                                <p className="text-xs opacity-80">{section.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </nav>
                        </CardContent>
                    </Card>

                    {/* Contenu du formulaire */}
                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit}>
                            {/* Section Informations entreprise */}
                            {activeSection === 'company' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5" />
                                            Informations entreprise
                                            <Badge variant="destructive" className="text-xs text-white">Obligatoire</Badge>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Renseignez les informations de base de l'entreprise. Ces informations sont requises.
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="nom" className="flex items-center gap-2">
                                                    Nom légal
                                                    <span className="text-destructive">*</span>
                                                    {renderFieldIcon(getFieldStatus('nom', data.nom))}
                                                </Label>
                                                <Input
                                                    id="nom"
                                                    value={data.nom}
                                                    onChange={(e) => setData('nom', e.target.value)}
                                                    placeholder="TechCorp SARL"
                                                    required
                                                    className={getFieldError('nom') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('nom') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('nom')}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="nom_commercial" className="flex items-center gap-2">
                                                    Nom commercial
                                                    {renderFieldIcon(getFieldStatus('nom_commercial', data.nom_commercial))}
                                                </Label>
                                                <Input
                                                    id="nom_commercial"
                                                    value={data.nom_commercial}
                                                    onChange={(e) => setData('nom_commercial', e.target.value)}
                                                    placeholder="TechCorp"
                                                    className={getFieldError('nom_commercial') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('nom_commercial') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('nom_commercial')}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    Nom utilisé dans les communications commerciales
                                                </p>
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="secteur_activite" className="flex items-center gap-2">
                                                    Secteur d'activité
                                                    <span className="text-destructive">*</span>
                                                    {renderFieldIcon(getFieldStatus('secteur_activite', data.secteur_activite))}
                                                </Label>
                                                <Input
                                                    id="secteur_activite"
                                                    value={data.secteur_activite}
                                                    onChange={(e) => setData('secteur_activite', e.target.value)}
                                                    placeholder="Informatique, Services, Commerce, Industrie..."
                                                    required
                                                    className={getFieldError('secteur_activite') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('secteur_activite') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('secteur_activite')}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    Précisez le domaine d'activité principal de l'entreprise
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Section Contact & Adresse */}
                            {activeSection === 'contact' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5" />
                                            Contact & Adresse
                                            <Badge variant="secondary" className="text-xs">Optionnel</Badge>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Ajoutez les coordonnées et l'adresse de l'entreprise
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    Email
                                                    {renderFieldIcon(getFieldStatus('email', data.email))}
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    placeholder="contact@entreprise.com"
                                                    className={getFieldError('email') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('email') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('email')}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="telephone" className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4" />
                                                    Téléphone
                                                    {renderFieldIcon(getFieldStatus('telephone', data.telephone))}
                                                </Label>
                                                <Input
                                                    id="telephone"
                                                    value={data.telephone}
                                                    onChange={(e) => setData('telephone', e.target.value)}
                                                    placeholder="01 23 45 67 89"
                                                    className={getFieldError('telephone') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('telephone') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('telephone')}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="site_web" className="flex items-center gap-2">
                                                    <Globe className="h-4 w-4" />
                                                    Site web
                                                    {renderFieldIcon(getFieldStatus('site_web', data.site_web))}
                                                </Label>
                                                <Input
                                                    id="site_web"
                                                    type="url"
                                                    value={data.site_web}
                                                    onChange={(e) => setData('site_web', e.target.value)}
                                                    placeholder="https://www.entreprise.com"
                                                    className={getFieldError('site_web') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('site_web') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('site_web')}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="adresse">Adresse complète</Label>
                                                <Input
                                                    id="adresse"
                                                    value={data.adresse}
                                                    onChange={(e) => setData('adresse', e.target.value)}
                                                    placeholder="123 avenue des Entreprises"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="ville">Ville</Label>
                                                <Input
                                                    id="ville"
                                                    value={data.ville}
                                                    onChange={(e) => setData('ville', e.target.value)}
                                                    placeholder="Paris"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="code_postal">Code postal</Label>
                                                <Input
                                                    id="code_postal"
                                                    value={data.code_postal}
                                                    onChange={(e) => setData('code_postal', e.target.value)}
                                                    placeholder="75001"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="pays">Pays</Label>
                                                <Input
                                                    id="pays"
                                                    value={data.pays}
                                                    onChange={(e) => setData('pays', e.target.value)}
                                                    placeholder="France"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Section Informations légales */}
                            {activeSection === 'legal' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="h-5 w-5" />
                                            Informations légales
                                            <Badge variant="secondary" className="text-xs">Optionnel</Badge>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Ajoutez les numéros d'identification légale de l'entreprise
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="siret" className="flex items-center gap-2">
                                                    SIRET
                                                    {renderFieldIcon(getFieldStatus('siret', data.siret))}
                                                </Label>
                                                <Input
                                                    id="siret"
                                                    value={data.siret}
                                                    onChange={(e) => setData('siret', e.target.value)}
                                                    placeholder="12345678901234"
                                                    maxLength={14}
                                                    className={getFieldError('siret') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('siret') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('siret')}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    14 chiffres - Système d'Identification du Répertoire des Établissements
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="siren" className="flex items-center gap-2">
                                                    SIREN
                                                    {renderFieldIcon(getFieldStatus('siren', data.siren))}
                                                </Label>
                                                <Input
                                                    id="siren"
                                                    value={data.siren}
                                                    onChange={(e) => setData('siren', e.target.value)}
                                                    placeholder="123456789"
                                                    maxLength={9}
                                                    className={getFieldError('siren') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('siren') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('siren')}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    9 chiffres - Système d'Identification du Répertoire des Entreprises
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                        Information
                                                    </p>
                                                    <p className="text-xs text-blue-700 dark:text-blue-200">
                                                        Ces numéros peuvent être ajoutés plus tard. Ils sont nécessaires pour la facturation officielle en France.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Section Statut */}
                            {activeSection === 'business' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Statut de l'entreprise
                                            <Badge variant="secondary" className="text-xs">Optionnel</Badge>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Définissez le statut initial de l'entreprise
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="font-medium">Statut initial de l'entreprise</h4>
                                            <div className="flex items-center space-x-3 p-4 rounded-lg border bg-muted/50">
                                                <Checkbox
                                                    id="active"
                                                    checked={data.active}
                                                    onCheckedChange={(checked) => setData('active', checked === true)}
                                                />
                                                <div className="space-y-1">
                                                    <Label htmlFor="active" className="text-sm font-medium">
                                                        Entreprise active
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Les nouvelles entreprises sont généralement actives par défaut
                                                    </p>
                                                </div>
                                                <div className="ml-auto">
                                                    <Badge variant={data.active ? "default" : "secondary"}>
                                                        {data.active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Section Notes */}
                            {activeSection === 'notes' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Notes & Commentaires
                                            <Badge variant="secondary" className="text-xs">Optionnel</Badge>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Ajoutez des notes internes sur cette nouvelle entreprise
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Notes internes</Label>
                                            <Textarea
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                placeholder="Ajoutez des notes sur cette entreprise : comment vous l'avez rencontrée, ses spécificités, opportunités potentielles..."
                                                className="min-h-[120px] resize-none"
                                            />
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>Ces notes ne seront visibles que par votre équipe</span>
                                                <span>{data.notes.length}/1000 caractères</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Navigation & Actions */}
                            <div className="flex justify-between items-center pt-6">
                                <div className="flex items-center gap-2">
                                    {sections.map((section, index) => (
                                        <button
                                            key={section.id}
                                            type="button"
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-3 h-3 rounded-full transition-colors ${activeSection === section.id
                                                    ? 'bg-primary'
                                                    : completedSections.has(section.id)
                                                        ? 'bg-green-500'
                                                        : 'bg-muted hover:bg-muted-foreground/20'
                                                }`}
                                            aria-label={`Aller à ${section.label}`}
                                        />
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="outline" asChild>
                                        <Link href="/entreprises">
                                            Annuler
                                        </Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || !isFormValid}
                                        className="min-w-[140px]"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {processing ? 'Création...' : 'Créer l\'entreprise'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
