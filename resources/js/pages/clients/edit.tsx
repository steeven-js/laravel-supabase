import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    User,
    Building2,
    MapPin,
    Mail,
    Phone,
    FileText,
    AlertCircle,
    Check,
    X,
    Eye,
    EyeOff
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
    pays?: string;
    entreprise_id?: number;
    actif: boolean;
    notes?: string;
}

interface Entreprise {
    id: number;
    nom: string;
    nom_commercial?: string;
}

interface Props {
    client: Client;
    entreprises: Entreprise[];
}

const breadcrumbs = (client: Client): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Clients',
        href: '/clients',
    },
    {
        title: `${client.prenom} ${client.nom}`,
        href: `/clients/${client.id}`,
    },
    {
        title: 'Modifier',
        href: `/clients/${client.id}/edit`,
    },
];

export default function ClientsEdit({ client, entreprises }: Props) {
    const [activeSection, setActiveSection] = useState<'personal' | 'contact' | 'business' | 'notes'>('personal');
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);

    const { data, setData, patch, processing, errors, isDirty: formIsDirty, reset } = useForm({
        nom: client.nom || '',
        prenom: client.prenom || '',
        email: client.email || '',
        telephone: client.telephone || '',
        adresse: client.adresse || '',
        ville: client.ville || '',
        code_postal: client.code_postal || '',
        pays: client.pays || 'France',
        entreprise_id: client.entreprise_id?.toString() || 'none',
        actif: client.actif,
        notes: client.notes || '',
    });

    // Surveiller les changements
    useEffect(() => {
        setIsDirty(formIsDirty);
        setShowUnsavedChanges(formIsDirty);
    }, [formIsDirty]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/clients/${client.id}`, {
            onSuccess: () => {
                toast.success('Client modifié avec succès');
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
            id: 'personal',
            label: 'Informations personnelles',
            icon: User,
            required: true
        },
        {
            id: 'contact',
            label: 'Contact & Adresse',
            icon: MapPin,
            required: false
        },
        {
            id: 'business',
            label: 'Entreprise & Statut',
            icon: Building2,
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
        <AppLayout breadcrumbs={breadcrumbs(client)}>
            <Head title={`Modifier ${client.prenom} ${client.nom}`} />

            <div className="page-container">
                {/* Bouton retour */}
                <div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/clients/${client.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                </div>

                {/* En-tête avec indicateur de modifications */}
                <div className="page-header">
                    <Card className="page-header-card">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="page-title">
                                                Modifier {client.prenom} {client.nom}
                                            </h1>
                                            {showUnsavedChanges && (
                                                <Badge variant="outline" className="badge-warning">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    Modifications non sauvegardées
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground">
                                            Modifiez les informations du client
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
                                        if (section.id === 'personal') return ['nom', 'prenom', 'email'].includes(field);
                                        if (section.id === 'contact') return ['telephone', 'adresse', 'ville', 'code_postal', 'pays'].includes(field);
                                        if (section.id === 'business') return ['entreprise_id', 'actif'].includes(field);
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
                            {/* Section Informations personnelles */}
                            {activeSection === 'personal' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Informations personnelles
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Renseignez les informations de base du client
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="prenom" className="flex items-center gap-2">
                                                    Prénom
                                                    <span className="text-destructive">*</span>
                                                    {renderFieldIcon(getFieldStatus('prenom', data.prenom))}
                                                </Label>
                                                <Input
                                                    id="prenom"
                                                    value={data.prenom}
                                                    onChange={(e) => setData('prenom', e.target.value)}
                                                    placeholder="Jean"
                                                    required
                                                    className={getFieldError('prenom') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('prenom') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('prenom')}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="nom" className="flex items-center gap-2">
                                                    Nom
                                                    <span className="text-destructive">*</span>
                                                    {renderFieldIcon(getFieldStatus('nom', data.nom))}
                                                </Label>
                                                <Input
                                                    id="nom"
                                                    value={data.nom}
                                                    onChange={(e) => setData('nom', e.target.value)}
                                                    placeholder="Dupont"
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

                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="email" className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    Adresse email
                                                    <span className="text-destructive">*</span>
                                                    {renderFieldIcon(getFieldStatus('email', data.email))}
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    placeholder="jean.dupont@example.com"
                                                    required
                                                    className={getFieldError('email') ? 'border-destructive' : ''}
                                                />
                                                {getFieldError('email') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('email')}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    Cette adresse sera utilisée pour envoyer les devis et factures
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
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Coordonnées et adresse de contact du client
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                            <div className="space-y-2">
                                                <Label htmlFor="pays">Pays</Label>
                                                <Input
                                                    id="pays"
                                                    value={data.pays}
                                                    onChange={(e) => setData('pays', e.target.value)}
                                                    placeholder="France"
                                                />
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="adresse">Adresse complète</Label>
                                                <Input
                                                    id="adresse"
                                                    value={data.adresse}
                                                    onChange={(e) => setData('adresse', e.target.value)}
                                                    placeholder="123 rue de la Paix"
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
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Section Entreprise & Statut */}
                            {activeSection === 'business' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5" />
                                            Entreprise & Statut
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Informations professionnelles et statut du client
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="entreprise_id">Entreprise associée</Label>
                                                <Select
                                                    value={data.entreprise_id || 'none'}
                                                    onValueChange={(value) => setData('entreprise_id', value === 'none' ? '' : value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner une entreprise" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-gray-400" />
                                                                Aucune entreprise
                                                            </div>
                                                        </SelectItem>
                                                        {entreprises.map((entreprise) => (
                                                            <SelectItem key={entreprise.id} value={entreprise.id.toString()}>
                                                                <div className="flex items-center gap-2">
                                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                                    {entreprise.nom_commercial || entreprise.nom}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground">
                                                    Associez ce client à une entreprise pour faciliter la facturation
                                                </p>
                                            </div>

                                            <Separator />

                                            <div className="space-y-4">
                                                <h4 className="font-medium">Statut du client</h4>
                                                <div className="flex items-center space-x-3 p-4 rounded-lg border bg-muted/50">
                                                    <Checkbox
                                                        id="actif"
                                                        checked={data.actif}
                                                        onCheckedChange={(checked) => setData('actif', !!checked)}
                                                    />
                                                    <div className="space-y-1">
                                                        <Label htmlFor="actif" className="text-sm font-medium">
                                                            Client actif
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Les clients inactifs n'apparaissent pas dans les listes par défaut
                                                        </p>
                                                    </div>
                                                    <div className="ml-auto">
                                                        <Badge variant={data.actif ? "default" : "secondary"}>
                                                            {data.actif ? "Actif" : "Inactif"}
                                                        </Badge>
                                                    </div>
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
                                            Ajoutez des notes internes sur ce client
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Notes internes</Label>
                                            <Textarea
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                placeholder="Ajoutez des notes internes sur ce client : préférences, historique, remarques particulières..."
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
                                        <Link href={`/clients/${client.id}`}>
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
