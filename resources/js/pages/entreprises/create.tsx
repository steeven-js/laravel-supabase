import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    Sparkles,
    Search
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

// Liste des secteurs d'activité NAF français
const SECTEURS_ACTIVITE = [
    "01.11Z-Culture de céréales (sauf riz), légumineuses et graines oléagineuses",
    "01.13Z-Culture de légumes, de melons, de racines et de tubercules",
    "01.19Z-Autres cultures non permanentes",
    "01.21Z-Culture de la vigne",
    "01.24Z-Culture de fruits à pépins et à noyau",
    "01.41Z-Élevage de vaches laitières",
    "01.42Z-Élevage d'autres bovins et de buffles",
    "01.47Z-Élevage de volailles",
    "01.50Z-Culture et élevage associés",
    "02.10Z-Sylviculture et autres activités forestières",
    "02.20Z-Exploitation forestière",
    "03.11Z-Pêche en mer",
    "03.21Z-Aquaculture en mer",
    "05.10Z-Extraction de houille",
    "06.10Z-Extraction de pétrole brut",
    "07.10Z-Extraction de minerais de fer",
    "08.11Z-Extraction de pierres ornementales et de construction",
    "08.12Z-Exploitation de gravières et sablières",
    "09.10Z-Activités de soutien à l'extraction d'hydrocarbures",
    "10.11Z-Transformation et conservation de la viande de boucherie",
    "10.51A-Fabrication de lait liquide et de produits frais",
    "10.71A-Fabrication industrielle de pain et de pâtisserie fraîche",
    "11.01Z-Production de boissons alcooliques distillées",
    "11.02A-Fabrication de vins effervescents",
    "13.20Z-Tissage",
    "14.11Z-Fabrication de vêtements en cuir",
    "15.20Z-Fabrication de chaussures",
    "16.10A-Sciage et rabotage du bois",
    "17.12Z-Fabrication de papier et de carton",
    "18.11Z-Imprimerie de journaux",
    "19.20Z-Raffinage du pétrole",
    "20.11Z-Fabrication de gaz industriels",
    "21.10Z-Fabrication de produits pharmaceutiques de base",
    "22.11Z-Fabrication et rechapage de pneumatiques",
    "23.32Z-Fabrication de briques, tuiles et produits de construction",
    "24.10Z-Sidérurgie",
    "25.11Z-Fabrication de structures métalliques",
    "26.20Z-Fabrication d'ordinateurs et d'équipements périphériques",
    "27.11Z-Fabrication de moteurs, génératrices et transformateurs électriques",
    "28.11Z-Fabrication de moteurs et turbines",
    "29.10Z-Construction de véhicules automobiles",
    "30.30Z-Construction aéronautique et spatiale",
    "31.01Z-Fabrication de meubles de bureau et de magasin",
    "32.50A-Fabrication de matériel médico-chirurgical et dentaire",
    "33.11Z-Réparation d'ouvrages en métaux",
    "35.11Z-Production d'électricité",
    "35.22Z-Distribution de combustibles gazeux par conduites",
    "35.30Z-Production et distribution de vapeur et d'air conditionné",
    "36.00Z-Captage, traitement et distribution d'eau",
    "37.00Z-Collecte et traitement des eaux usées",
    "38.11Z-Collecte des déchets non dangereux",
    "39.00Z-Dépollution et autres services de gestion des déchets",
    "41.20A-Construction de maisons individuelles",
    "42.11Z-Construction de routes et autoroutes",
    "42.21Z-Construction de réseaux pour fluides",
    "43.11Z-Travaux de démolition",
    "43.21A-Travaux d'installation électrique dans tous locaux",
    "43.31Z-Travaux de plâtrerie",
    "43.34Z-Travaux de peinture et vitrerie",
    "43.99C-Travaux de maçonnerie générale et gros œuvre de bâtiment",
    "45.11Z-Commerce de voitures et de véhicules automobiles légers",
    "45.20A-Entretien et réparation de véhicules automobiles légers",
    "46.11Z-Intermédiaires du commerce en produits agricoles",
    "46.34Z-Commerce de gros de boissons",
    "47.11A-Commerce de détail de produits surgelés",
    "47.21Z-Commerce de détail de fruits et légumes en magasin spécialisé",
    "47.71Z-Commerce de détail d'habillement en magasin spécialisé",
    "47.91A-Vente à distance sur catalogue général",
    "49.10Z-Transport ferroviaire interurbain de voyageurs",
    "49.31Z-Transports urbains et suburbains de voyageurs",
    "49.41A-Transports routiers de fret interurbains",
    "50.10Z-Transports maritimes et côtiers de passagers",
    "51.10Z-Transports aériens de passagers",
    "52.10A-Entreposage et stockage frigorifique",
    "53.10Z-Activités de poste dans le cadre d'une obligation de service universel",
    "55.10Z-Hôtels et hébergement similaire",
    "55.20Z-Hébergement touristique et autre hébergement de courte durée",
    "56.10A-Restauration traditionnelle",
    "56.10C-Restauration de type rapide",
    "56.30Z-Débits de boissons",
    "58.11Z-Édition de livres",
    "59.11A-Production de films et de programmes pour la télévision",
    "60.10Z-Édition et diffusion de programmes radio",
    "61.10Z-Télécommunications filaires",
    "62.01Z-Programmation informatique",
    "62.02A-Conseil en systèmes et logiciels informatiques",
    "63.11Z-Traitement de données, hébergement et activités connexes",
    "63.91Z-Activités des agences de presse",
    "64.19Z-Autres intermédiations monétaires",
    "64.30Z-Fonds de placement et entités financières similaires",
    "65.11Z-Assurance vie",
    "66.11Z-Administration de marchés financiers",
    "66.21Z-Évaluation des risques et dommages",
    "68.10Z-Activités des marchands de biens immobiliers",
    "68.20A-Location de logements",
    "68.31Z-Agences immobilières",
    "68.32A-Administration d'immeubles et autres biens immobiliers",
    "69.10Z-Activités juridiques",
    "69.20Z-Activités comptables",
    "70.10Z-Activités des sièges sociaux",
    "70.21Z-Conseil en relations publiques et communication",
    "70.22Z-Conseil pour les affaires et autres conseils de gestion",
    "71.11Z-Activités d'architecture",
    "71.12B-Ingénierie, études techniques",
    "72.11Z-Recherche-développement en biotechnologie",
    "73.11Z-Activités des agences de publicité",
    "74.10Z-Activités spécialisées de design",
    "74.20Z-Activités photographiques",
    "75.00Z-Activités vétérinaires",
    "77.11A-Location de courte durée de voitures et de véhicules automobiles légers",
    "78.10Z-Activités des agences de placement de main-d'œuvre",
    "78.20Z-Activités des agences de travail temporaire",
    "79.11Z-Activités des agences de voyage",
    "80.10Z-Activités de sécurité privée",
    "81.10Z-Activités combinées de soutien lié aux bâtiments",
    "81.21Z-Nettoyage courant des bâtiments",
    "82.11Z-Services administratifs combinés de bureau",
    "82.30Z-Organisation de foires, salons professionnels et congrès",
    "84.11Z-Administration publique générale",
    "84.22Z-Défense",
    "84.30A-Activités générales de sécurité sociale",
    "85.10Z-Enseignement pré-primaire",
    "85.20Z-Enseignement primaire",
    "85.31Z-Enseignement secondaire général",
    "85.41Z-Enseignement post-secondaire non supérieur",
    "85.42Z-Enseignement supérieur",
    "86.10Z-Activités hospitalières",
    "86.21Z-Activité des médecins généralistes",
    "86.23Z-Pratique dentaire",
    "87.10A-Hébergement médicalisé pour personnes âgées",
    "88.10A-Aide à domicile",
    "88.91A-Accueil de jeunes enfants",
    "90.01Z-Arts du spectacle vivant",
    "90.04Z-Gestion de salles de spectacles",
    "91.01Z-Gestion des bibliothèques et des archives",
    "92.00Z-Organisation de jeux de hasard et d'argent",
    "93.11Z-Gestion d'installations sportives",
    "93.21Z-Activités des parcs d'attractions et parcs à thèmes",
    "94.11Z-Activités des organisations patronales et consulaires",
    "94.20Z-Activités des syndicats de salariés",
    "95.11Z-Réparation d'ordinateurs et d'équipements périphériques",
    "96.01A-Blanchisserie-teinturerie de gros",
    "96.02A-Coiffure",
    "96.03Z-Services funéraires",
    "97.00Z-Activités des ménages en tant qu'employeurs de personnel domestique",
    "98.10Z-Activités indifférenciées des ménages en tant que producteurs de biens pour usage propre",
    "99.00Z-Activités des organisations et organismes extraterritoriaux"
];

export default function EntreprisesCreate() {
    const [activeSection, setActiveSection] = useState<'company' | 'contact' | 'legal' | 'business' | 'notes'>('company');
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
    const [secteurSearch, setSecteurSearch] = useState('');
    const [secteurOpen, setSecteurOpen] = useState(false);

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

    // Filtrer les secteurs d'activité selon la recherche
    const filteredSecteurs = SECTEURS_ACTIVITE.filter(secteur =>
        secteur.toLowerCase().includes(secteurSearch.toLowerCase())
    );

    // Gérer l'ouverture/fermeture du Select
    const handleSecteurOpenChange = (open: boolean) => {
        setSecteurOpen(open);
        if (!open) {
            // Vider la recherche quand on ferme le dropdown
            setSecteurSearch('');
        }
    };

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
                {/* Bouton retour */}
                <div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/entreprises">
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
                                                <Select
                                                    value={data.secteur_activite}
                                                    onValueChange={(value) => setData('secteur_activite', value)}
                                                    required
                                                    open={secteurOpen}
                                                    onOpenChange={handleSecteurOpenChange}
                                                >
                                                    <SelectTrigger className={getFieldError('secteur_activite') ? 'border-destructive' : ''}>
                                                        <SelectValue placeholder="Sélectionnez le secteur d'activité de l'entreprise" />
                                                    </SelectTrigger>
                                                    <SelectContent className="p-0">
                                                        <div className="sticky top-0 z-10 bg-background p-2 border-b shadow-sm">
                                                            <Input
                                                                placeholder="Rechercher un secteur d'activité..."
                                                                value={secteurSearch}
                                                                onChange={(e) => setSecteurSearch(e.target.value)}
                                                                className="h-8 text-sm"
                                                                onClick={(e) => e.stopPropagation()}
                                                                onKeyDown={(e) => e.stopPropagation()}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="max-h-48 overflow-y-auto">
                                                            {filteredSecteurs.length > 0 ? (
                                                                filteredSecteurs.map((secteur) => (
                                                                    <SelectItem key={secteur} value={secteur}>
                                                                        {secteur}
                                                                    </SelectItem>
                                                                ))
                                                            ) : (
                                                                <div className="p-4 text-sm text-muted-foreground text-center">
                                                                    Aucun secteur trouvé pour "{secteurSearch}"
                                                                </div>
                                                            )}
                                                        </div>
                                                        {secteurSearch && (
                                                            <div className="sticky bottom-0 bg-background p-2 border-t text-xs text-muted-foreground text-center shadow-sm">
                                                                {filteredSecteurs.length} résultat(s) sur {SECTEURS_ACTIVITE.length}
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {getFieldError('secteur_activite') && (
                                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {getFieldError('secteur_activite')}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    <Search className="inline h-3 w-3 mr-1" />
                                                    Tapez dans le champ de recherche pour filtrer les codes NAF français
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
