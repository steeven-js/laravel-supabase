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
    UserPlus,
    Sparkles
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Clients',
        href: '/clients',
    },
    {
        title: 'Créer',
        href: '/clients/create',
    },
];

interface Entreprise {
    id: number;
    nom: string;
    nom_commercial?: string;
}

interface Props {
    entreprises: Entreprise[];
}

export default function ClientsCreate({ entreprises }: Props) {
    const [activeSection, setActiveSection] = useState<'personal' | 'contact' | 'business' | 'notes'>('personal');
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
    const [entrepriseSearch, setEntrepriseSearch] = useState('');
    const entrepriseSearchRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse: '',
        ville: '',
        code_postal: '',
        pays: 'France',
        entreprise_id: 'none',
        actif: true as boolean,
        notes: '',
    });

    // Filtrer les entreprises en fonction de la recherche
    const filteredEntreprises = useMemo(() => {
        if (!entrepriseSearch.trim()) return entreprises;

        const searchTerm = entrepriseSearch.toLowerCase().trim();
        return entreprises.filter(entreprise =>
            (entreprise.nom || '').toLowerCase().includes(searchTerm) ||
            (entreprise.nom_commercial || '').toLowerCase().includes(searchTerm)
        );
    }, [entreprises, entrepriseSearch]);

    // Surveiller la completion des sections
    useEffect(() => {
        const newCompleted = new Set<string>();

        // Section personal
        if (data.nom && data.prenom && data.email) {
            newCompleted.add('personal');
        }

        // Section contact (optionnelle mais on peut la marquer complète si au moins un champ)
        if (data.telephone || data.adresse || data.ville) {
            newCompleted.add('contact');
        }

        // Section business (toujours complète car champs optionnels)
        newCompleted.add('business');

        // Section notes (toujours complète car optionnelle)
        newCompleted.add('notes');

        setCompletedSections(newCompleted);
    }, [data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = { ...data };

        // Convertir 'none' en null pour l'entreprise
        if (submitData.entreprise_id === 'none') {
            submitData.entreprise_id = '';
        }

        post('/clients', {
            onSuccess: () => {
                toast.success('Client créé avec succès');
            },
            onError: () => {
                toast.error('Une erreur est survenue lors de la création');
            }
        });
    };

    const handleClearForm = () => {
        setData({
            nom: '',
            prenom: '',
            email: '',
            telephone: '',
            adresse: '',
            ville: '',
            code_postal: '',
            pays: 'France',
            entreprise_id: 'none',
            actif: true,
            notes: '',
        });
        clearErrors();
        setActiveSection('personal');
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
            id: 'personal',
            label: 'Informations personnelles',
            icon: User,
            required: true,
            description: 'Nom, prénom et email'
        },
        {
            id: 'contact',
            label: 'Contact & Adresse',
            icon: MapPin,
            required: false,
            description: 'Téléphone et adresse'
        },
        {
            id: 'business',
            label: 'Entreprise & Statut',
            icon: Building2,
            required: false,
            description: 'Entreprise associée'
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

    const isFormValid = data.nom && data.prenom && data.email;
    const progressPercentage = Math.round((completedSections.size / sections.length) * 100);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Créer un client" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Bouton retour */}
                <div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/clients">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                </div>

                {/* En-tête avec progress */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-3xl font-bold tracking-tight">
                                                Créer un nouveau client
                                            </h1>
                                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                                                <Sparkles className="h-3 w-3 mr-1" />
                                                Nouveau
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>Ajoutez un nouveau client à votre base de données</span>
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
                                        {processing ? 'Création...' : 'Créer le client'}
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
                                Suivez les étapes pour créer votre client
                            </p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <nav className="space-y-1">
                                {sections.map((section, index) => {
                                    const Icon = section.icon;
                                    const isActive = activeSection === section.id;
                                    const isCompleted = completedSections.has(section.id);
                                    const hasErrors = Object.keys(errors).some(field => {
                                        if (section.id === 'personal') return ['nom', 'prenom', 'email'].includes(field);
                                        if (section.id === 'contact') return ['telephone', 'adresse', 'ville', 'code_postal', 'pays'].includes(field);
                                        if (section.id === 'business') return ['entreprise_id'].includes(field);
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
                            {/* Section Informations personnelles */}
                            {activeSection === 'personal' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Informations personnelles
                                            <Badge variant="destructive" className="text-xs text-white">Obligatoire</Badge>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Renseignez les informations de base du client. Ces informations sont requises.
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
                                            <Badge variant="secondary" className="text-xs">Optionnel</Badge>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Ajoutez les coordonnées et l'adresse de contact du client
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
                                            <Badge variant="secondary" className="text-xs">Optionnel</Badge>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Associez ce client à une entreprise et définissez son statut
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="entreprise_id">Entreprise associée</Label>
                                                <Select
                                                    value={data.entreprise_id}
                                                    onValueChange={(value) => setData('entreprise_id', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner une entreprise" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {/* Champ de recherche */}
                                                        <div className="flex items-center gap-2 p-2 border-b">
                                                            <div className="relative flex-1">
                                                                <Input
                                                                    ref={entrepriseSearchRef}
                                                                    placeholder="Rechercher une entreprise..."
                                                                    value={entrepriseSearch}
                                                                    onChange={(e) => {
                                                                        setEntrepriseSearch(e.target.value);
                                                                        // Maintenir le focus après le changement
                                                                        setTimeout(() => {
                                                                            entrepriseSearchRef.current?.focus();
                                                                        }, 0);
                                                                    }}
                                                                    className="h-8 pl-8 text-sm"
                                                                    onKeyDown={(e) => {
                                                                        // Empêcher la fermeture du select avec Escape
                                                                        if (e.key === 'Escape') {
                                                                            e.stopPropagation();
                                                                            setEntrepriseSearch('');
                                                                            entrepriseSearchRef.current?.focus();
                                                                        }
                                                                        // Empêcher la sélection avec Enter
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                        }
                                                                    }}
                                                                    onMouseDown={(e) => {
                                                                        // Empêcher la fermeture du select quand on clique dans l'input
                                                                        e.stopPropagation();
                                                                    }}
                                                                    onFocus={(e) => {
                                                                        // Empêcher la fermeture du select quand l'input prend le focus
                                                                        e.stopPropagation();
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        // Reprendre le focus si on le perd sans raison
                                                                        setTimeout(() => {
                                                                            if (document.activeElement !== entrepriseSearchRef.current) {
                                                                                entrepriseSearchRef.current?.focus();
                                                                            }
                                                                        }, 10);
                                                                    }}
                                                                />
                                                                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                                                                    <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                                    </svg>
                                                                </div>
                                                                {entrepriseSearch && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEntrepriseSearch('');
                                                                        }}
                                                                        onMouseDown={(e) => {
                                                                            e.stopPropagation();
                                                                        }}
                                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Option "Aucune entreprise" */}
                                                        <SelectItem value="none">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-gray-400" />
                                                                Aucune entreprise
                                                            </div>
                                                        </SelectItem>

                                                        {/* Liste des entreprises filtrées */}
                                                        {filteredEntreprises.length > 0 ? (
                                                            filteredEntreprises.map((entreprise) => (
                                                                <SelectItem key={entreprise.id} value={entreprise.id.toString()}>
                                                                    <div className="flex items-center gap-2">
                                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium">
                                                                                {entreprise.nom_commercial || entreprise.nom}
                                                                            </span>
                                                                            {entreprise.nom_commercial && entreprise.nom && entreprise.nom_commercial !== entreprise.nom && (
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {entreprise.nom}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        ) : entrepriseSearch ? (
                                                            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                                                                <AlertCircle className="h-4 w-4" />
                                                                Aucune entreprise trouvée pour "{entrepriseSearch}"
                                                            </div>
                                                        ) : null}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground">
                                                    Vous pourrez créer une nouvelle entreprise plus tard si nécessaire
                                                </p>
                                            </div>

                                            <Separator />

                                            <div className="space-y-4">
                                                <h4 className="font-medium">Statut initial du client</h4>
                                                <div className="flex items-center space-x-3 p-4 rounded-lg border bg-muted/50">
                                                    <Checkbox
                                                        id="actif"
                                                        checked={data.actif}
                                                        onCheckedChange={(checked) => setData('actif', checked === true)}
                                                    />
                                                    <div className="space-y-1">
                                                        <Label htmlFor="actif" className="text-sm font-medium">
                                                            Client actif
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Les nouveaux clients sont généralement actifs par défaut
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
                                            <Badge variant="secondary" className="text-xs">Optionnel</Badge>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Ajoutez des notes internes sur ce nouveau client
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Notes internes</Label>
                                            <Textarea
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                placeholder="Ajoutez des notes sur ce client : comment vous l'avez rencontré, ses préférences, projets en cours..."
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
                                        <Link href="/clients">
                                            Annuler
                                        </Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || !isFormValid}
                                        className="min-w-[140px]"
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        {processing ? 'Création...' : 'Créer le client'}
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
