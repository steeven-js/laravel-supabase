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
    Shield
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Entreprise {
    id: number;
    nom: string;
    nom_commercial?: string;
    siret?: string;
    siren?: string;
    secteur_activite?: string;
    adresse?: string;
    ville?: string;
    code_postal?: string;
    pays?: string;
    telephone?: string;
    email?: string;
    site_web?: string;

    active: boolean;
    notes?: string;
}

interface Props {
    entreprise: Entreprise;
}

const breadcrumbs = (entreprise: Entreprise): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Entreprises',
        href: '/entreprises',
    },
    {
        title: entreprise.nom_commercial || entreprise.nom,
        href: `/entreprises/${entreprise.id}`,
    },
    {
        title: 'Modifier',
        href: `/entreprises/${entreprise.id}/edit`,
    },
];

export default function EntreprisesEdit({ entreprise }: Props) {
    const [activeSection, setActiveSection] = useState<'company' | 'contact' | 'legal' | 'business' | 'notes'>('company');
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);

    const { data, setData, patch, processing, errors, isDirty: formIsDirty, reset } = useForm({
        nom: entreprise.nom || '',
        nom_commercial: entreprise.nom_commercial || '',
        secteur_activite: entreprise.secteur_activite || '',
        email: entreprise.email || '',
        telephone: entreprise.telephone || '',
        site_web: entreprise.site_web || '',
        adresse: entreprise.adresse || '',
        ville: entreprise.ville || '',
        code_postal: entreprise.code_postal || '',
        pays: entreprise.pays || 'France',
        siret: entreprise.siret || '',
        siren: entreprise.siren || '',

        active: entreprise.active,
        notes: entreprise.notes || '',
    });

    // Surveiller les changements
    useEffect(() => {
        setIsDirty(formIsDirty);
        setShowUnsavedChanges(formIsDirty);
    }, [formIsDirty]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/entreprises/${entreprise.id}`, {
            onSuccess: () => {
                toast.success('Entreprise modifiée avec succès');
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

    const sections = [
        {
            id: 'company',
            label: 'Informations entreprise',
            icon: Building2,
            required: true
        },
        {
            id: 'contact',
            label: 'Contact & Adresse',
            icon: MapPin,
            required: false
        },
        {
            id: 'legal',
            label: 'Informations légales',
            icon: Shield,
            required: false
        },
        {
            id: 'business',
            label: 'Statut entreprise',
            icon: Users,
            required: false
        },
        {
            id: 'notes',
            label: 'Notes & Commentaires',
            icon: FileText,
            required: false
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

    return (
        <AppLayout breadcrumbs={breadcrumbs(entreprise)}>
            <Head title={`Modifier ${entreprise.nom_commercial || entreprise.nom}`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Bouton retour */}
                <div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/entreprises/${entreprise.id}`}>
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
                                                Modifier {entreprise.nom_commercial || entreprise.nom}
                                            </h1>
                                            {showUnsavedChanges && (
                                                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    Modifications non sauvegardées
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground">
                                            Modifiez les informations de l'entreprise
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
                            {/* Section Informations entreprise */}
                            {activeSection === 'company' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5" />
                                            Informations entreprise
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Renseignez les informations de base de l'entreprise
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
                                                    {renderFieldIcon(getFieldStatus('secteur_activite', data.secteur_activite))}
                                                </Label>
                                                <Input
                                                    id="secteur_activite"
                                                    value={data.secteur_activite}
                                                    onChange={(e) => setData('secteur_activite', e.target.value)}
                                                    placeholder="Informatique, Services, Commerce..."
                                                    className={getFieldError('secteur_activite') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('secteur_activite') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('secteur_activite')}
                                                    </div>
                                                )}
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
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Coordonnées et adresse de l'entreprise
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
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Numéros d'identification légale de l'entreprise
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
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Modifiez le statut de l'entreprise
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="font-medium">Statut de l'entreprise</h4>
                                            <div className="flex items-center space-x-3 p-4 rounded-lg border bg-muted/50">
                                                <Checkbox
                                                    id="active"
                                                    checked={data.active}
                                                    onCheckedChange={(checked) => setData('active', !!checked)}
                                                />
                                                <div className="space-y-1">
                                                    <Label htmlFor="active" className="text-sm font-medium">
                                                        Entreprise active
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Les entreprises inactives n'apparaissent pas dans les listes par défaut
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
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Ajoutez des notes internes sur cette entreprise
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Notes internes</Label>
                                            <Textarea
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                placeholder="Ajoutez des notes internes sur cette entreprise : historique commercial, particularités, remarques..."
                                                className="min-h-[120px] resize-none"
                                            />
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>Ces notes ne sont visibles que par votre équipe</span>
                                                <span>{data.notes.length}/1000 caractères</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Actions flottantes */}
                            <div className="flex justify-between items-center pt-6">
                                <div className="flex items-center gap-2">
                                    {sections.map((section, index) => (
                                        <button
                                            key={section.id}
                                            type="button"
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-3 h-3 rounded-full transition-colors ${
                                                activeSection === section.id
                                                    ? 'bg-primary'
                                                    : 'bg-muted hover:bg-muted-foreground/20'
                                            }`}
                                            aria-label={`Aller à ${section.label}`}
                                        />
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="outline" asChild>
                                        <Link href={`/entreprises/${entreprise.id}`}>
                                            Annuler
                                        </Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || !isDirty}
                                        className="min-w-[140px]"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing ? 'Sauvegarde...' : 'Sauvegarder'}
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
