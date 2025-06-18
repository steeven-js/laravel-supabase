import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Building2,
    User,
    Phone,
    Mail,
    Globe,
    MapPin,
    FileText,
    CreditCard,
    Users,
    CheckCircle,
    XCircle,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    ExternalLink,
    Save
} from 'lucide-react';
import { FormEventHandler } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Madin.IA',
        href: '/madinia',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
}

interface Madinia {
    id: number;
    name: string;
    contact_principal_id: number | null;
    contact_principal: User | null;
    telephone: string | null;
    email: string | null;
    site_web: string | null;
    siret: string | null;
    numero_nda: string | null;
    pays: string;
    adresse: string | null;
    description: string | null;
    reseaux_sociaux: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
        linkedin?: string;
    };
    nom_compte_bancaire: string | null;
    nom_banque: string | null;
    numero_compte: string | null;
    iban_bic_swift: string | null;
    adresse_complete: string;
    infos_bancaires_completes: boolean;
    infos_legales_completes: boolean;
    reseaux_sociaux_formates: Record<string, string>;
    created_at: string;
    updated_at: string;
}

interface Props {
    madinia: Madinia;
    users: User[];
}

export default function MadiniaShow({ madinia, users }: Props) {
    const { data, setData, patch, processing, errors, clearErrors } = useForm({
        name: madinia.name || '',
        contact_principal_id: madinia.contact_principal_id || null,
        telephone: madinia.telephone || '',
        email: madinia.email || '',
        site_web: madinia.site_web || '',
        siret: madinia.siret || '',
        numero_nda: madinia.numero_nda || '',
        pays: madinia.pays || 'France',
        adresse: madinia.adresse || '',
        description: madinia.description || '',
        reseaux_sociaux: {
            facebook: madinia.reseaux_sociaux?.facebook || '',
            twitter: madinia.reseaux_sociaux?.twitter || '',
            instagram: madinia.reseaux_sociaux?.instagram || '',
            linkedin: madinia.reseaux_sociaux?.linkedin || '',
        },
        nom_compte_bancaire: madinia.nom_compte_bancaire || '',
        nom_banque: madinia.nom_banque || '',
        numero_compte: madinia.numero_compte || '',
        iban_bic_swift: madinia.iban_bic_swift || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('madinia.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Informations mises à jour', {
                    description: 'Les informations de l\'entreprise ont été mises à jour avec succès.',
                });
                clearErrors();
            },
            onError: (errors) => {
                console.error('Erreurs de validation:', errors);
                toast.error('Erreur de validation', {
                    description: 'Veuillez vérifier les informations saisies.',
                });
            },
        });
    };

    const renderSocialIcon = (platform: string) => {
        switch (platform) {
            case 'facebook':
                return <Facebook className="h-4 w-4" />;
            case 'twitter':
                return <Twitter className="h-4 w-4" />;
            case 'instagram':
                return <Instagram className="h-4 w-4" />;
            case 'linkedin':
                return <Linkedin className="h-4 w-4" />;
            default:
                return <Globe className="h-4 w-4" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Madin.IA - Informations de l'entreprise" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête avec informations de l'entreprise */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="h-8 w-8 text-blue-600" />
                                        <h1 className="text-3xl font-bold tracking-tight">{madinia.name}</h1>
                                    </div>
                                    <p className="text-muted-foreground">
                                        {madinia.description || 'Gérez les informations de votre entreprise'}
                                    </p>
                                </div>
                            </div>

                            {/* Badges de statut */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                <Badge variant={madinia.infos_legales_completes ? "default" : "secondary"}>
                                    {madinia.infos_legales_completes ? (
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                    ) : (
                                        <XCircle className="w-3 h-3 mr-1" />
                                    )}
                                    Informations légales {madinia.infos_legales_completes ? 'complètes' : 'incomplètes'}
                                </Badge>
                                <Badge variant={madinia.infos_bancaires_completes ? "default" : "secondary"}>
                                    {madinia.infos_bancaires_completes ? (
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                    ) : (
                                        <XCircle className="w-3 h-3 mr-1" />
                                    )}
                                    Informations bancaires {madinia.infos_bancaires_completes ? 'complètes' : 'incomplètes'}
                                </Badge>

                                {/* Badge contact principal */}
                                {madinia.contact_principal && (
                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                        <User className="w-3 h-3 mr-1" />
                                        Contact: {madinia.contact_principal.name}
                                    </Badge>
                                )}
                            </div>

                            {/* Informations rapides */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                {madinia.email && (
                                    <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                                        <Mail className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <div className="text-sm font-medium">{madinia.email}</div>
                                            <div className="text-xs text-muted-foreground">Email entreprise</div>
                                        </div>
                                    </div>
                                )}

                                {madinia.telephone && (
                                    <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                                        <Phone className="h-5 w-5 text-green-600" />
                                        <div>
                                            <div className="text-sm font-medium">{madinia.telephone}</div>
                                            <div className="text-xs text-muted-foreground">Téléphone</div>
                                        </div>
                                    </div>
                                )}

                                {madinia.site_web && (
                                    <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                                        <Globe className="h-5 w-5 text-purple-600" />
                                        <div>
                                            <a
                                                href={madinia.site_web}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium hover:underline flex items-center gap-1"
                                            >
                                                Site web
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                            <div className="text-xs text-muted-foreground">Site officiel</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Identité de l'entreprise */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Identité de l'entreprise
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom de l'entreprise *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={errors.name ? 'border-red-500' : ''}
                                        placeholder="Nom de votre entreprise"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contact_principal_id">Contact principal</Label>
                                    <Select
                                        value={data.contact_principal_id ? data.contact_principal_id.toString() : "none"}
                                        onValueChange={(value) => setData('contact_principal_id', value === 'none' ? null : parseInt(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un contact principal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucun contact principal</SelectItem>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        <span>{user.name}</span>
                                                        <span className="text-muted-foreground">({user.email})</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className={errors.description ? 'border-red-500' : ''}
                                    placeholder="Description de votre entreprise"
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">{errors.description}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coordonnées */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Coordonnées
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="telephone">Téléphone</Label>
                                    <Input
                                        id="telephone"
                                        value={data.telephone}
                                        onChange={(e) => setData('telephone', e.target.value)}
                                        className={errors.telephone ? 'border-red-500' : ''}
                                        placeholder="+596 696 123 456"
                                    />
                                    {errors.telephone && (
                                        <p className="text-sm text-red-500">{errors.telephone}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className={errors.email ? 'border-red-500' : ''}
                                        placeholder="contact@madinia.com"
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-500">{errors.email}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="site_web">Site web</Label>
                                    <Input
                                        id="site_web"
                                        value={data.site_web}
                                        onChange={(e) => setData('site_web', e.target.value)}
                                        className={errors.site_web ? 'border-red-500' : ''}
                                        placeholder="https://madinia.com"
                                    />
                                    {errors.site_web && (
                                        <p className="text-sm text-red-500">{errors.site_web}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Adresse et informations légales */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Adresse et informations légales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="siret">Numéro SIRET</Label>
                                    <Input
                                        id="siret"
                                        value={data.siret}
                                        onChange={(e) => setData('siret', e.target.value)}
                                        className={errors.siret ? 'border-red-500' : ''}
                                        placeholder="12345678901234"
                                    />
                                    {errors.siret && (
                                        <p className="text-sm text-red-500">{errors.siret}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="numero_nda">Numéro NDA</Label>
                                    <Input
                                        id="numero_nda"
                                        value={data.numero_nda}
                                        onChange={(e) => setData('numero_nda', e.target.value)}
                                        className={errors.numero_nda ? 'border-red-500' : ''}
                                        placeholder="11 12 12345 12 123"
                                    />
                                    {errors.numero_nda && (
                                        <p className="text-sm text-red-500">{errors.numero_nda}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pays">Pays *</Label>
                                    <Input
                                        id="pays"
                                        value={data.pays}
                                        onChange={(e) => setData('pays', e.target.value)}
                                        className={errors.pays ? 'border-red-500' : ''}
                                        placeholder="France"
                                    />
                                    {errors.pays && (
                                        <p className="text-sm text-red-500">{errors.pays}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="adresse">Adresse complète</Label>
                                    <Textarea
                                        id="adresse"
                                        value={data.adresse}
                                        onChange={(e) => setData('adresse', e.target.value)}
                                        className={errors.adresse ? 'border-red-500' : ''}
                                        placeholder="Route de la Pointe des Sables, 97200 Fort-de-France, Martinique"
                                        rows={2}
                                    />
                                    {errors.adresse && (
                                        <p className="text-sm text-red-500">{errors.adresse}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Réseaux sociaux */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Réseaux sociaux
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="facebook" className="flex items-center gap-2">
                                        <Facebook className="h-4 w-4" />
                                        Facebook
                                    </Label>
                                    <Input
                                        id="facebook"
                                        value={data.reseaux_sociaux.facebook}
                                        onChange={(e) => setData('reseaux_sociaux', { ...data.reseaux_sociaux, facebook: e.target.value })}
                                        placeholder="https://facebook.com/madinia"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="twitter" className="flex items-center gap-2">
                                        <Twitter className="h-4 w-4" />
                                        Twitter
                                    </Label>
                                    <Input
                                        id="twitter"
                                        value={data.reseaux_sociaux.twitter}
                                        onChange={(e) => setData('reseaux_sociaux', { ...data.reseaux_sociaux, twitter: e.target.value })}
                                        placeholder="https://twitter.com/madinia"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="instagram" className="flex items-center gap-2">
                                        <Instagram className="h-4 w-4" />
                                        Instagram
                                    </Label>
                                    <Input
                                        id="instagram"
                                        value={data.reseaux_sociaux.instagram}
                                        onChange={(e) => setData('reseaux_sociaux', { ...data.reseaux_sociaux, instagram: e.target.value })}
                                        placeholder="https://instagram.com/madinia"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="linkedin" className="flex items-center gap-2">
                                        <Linkedin className="h-4 w-4" />
                                        LinkedIn
                                    </Label>
                                    <Input
                                        id="linkedin"
                                        value={data.reseaux_sociaux.linkedin}
                                        onChange={(e) => setData('reseaux_sociaux', { ...data.reseaux_sociaux, linkedin: e.target.value })}
                                        placeholder="https://linkedin.com/company/madinia"
                                    />
                                </div>
                            </div>

                            {/* Prévisualisation des réseaux sociaux */}
                            {Object.keys(madinia.reseaux_sociaux_formates).length > 0 && (
                                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-2">Réseaux sociaux configurés :</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(madinia.reseaux_sociaux_formates).map(([platform, url]) => (
                                            <Badge key={platform} variant="outline" className="cursor-pointer">
                                                <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                    {renderSocialIcon(platform.toLowerCase())}
                                                    {platform}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Informations bancaires */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Informations bancaires
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nom_compte_bancaire">Nom du compte bancaire</Label>
                                    <Input
                                        id="nom_compte_bancaire"
                                        value={data.nom_compte_bancaire}
                                        onChange={(e) => setData('nom_compte_bancaire', e.target.value)}
                                        className={errors.nom_compte_bancaire ? 'border-red-500' : ''}
                                        placeholder="Madin.IA SARL"
                                    />
                                    {errors.nom_compte_bancaire && (
                                        <p className="text-sm text-red-500">{errors.nom_compte_bancaire}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nom_banque">Nom de la banque</Label>
                                    <Input
                                        id="nom_banque"
                                        value={data.nom_banque}
                                        onChange={(e) => setData('nom_banque', e.target.value)}
                                        className={errors.nom_banque ? 'border-red-500' : ''}
                                        placeholder="Crédit Agricole Martinique"
                                    />
                                    {errors.nom_banque && (
                                        <p className="text-sm text-red-500">{errors.nom_banque}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="numero_compte">Numéro de compte</Label>
                                    <Input
                                        id="numero_compte"
                                        value={data.numero_compte}
                                        onChange={(e) => setData('numero_compte', e.target.value)}
                                        className={errors.numero_compte ? 'border-red-500' : ''}
                                        placeholder="1234567890"
                                    />
                                    {errors.numero_compte && (
                                        <p className="text-sm text-red-500">{errors.numero_compte}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="iban_bic_swift">IBAN / BIC / SWIFT</Label>
                                    <Input
                                        id="iban_bic_swift"
                                        value={data.iban_bic_swift}
                                        onChange={(e) => setData('iban_bic_swift', e.target.value)}
                                        className={errors.iban_bic_swift ? 'border-red-500' : ''}
                                        placeholder="FR76 1234 5678 9012 3456 7890 123"
                                    />
                                    {errors.iban_bic_swift && (
                                        <p className="text-sm text-red-500">{errors.iban_bic_swift}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bouton de sauvegarde */}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing} className="min-w-[200px]">
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}