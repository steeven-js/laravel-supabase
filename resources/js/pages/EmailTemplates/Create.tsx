import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Save,
    ArrowLeft,
    Info,
    Eye,
    Variable,
    Mail
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Modèles d\'Email',
        href: '/email-templates',
    },
    {
        title: 'Nouveau modèle',
        href: '/email-templates/create',
    },
];

interface Props {
    categories: Record<string, string>;
    subCategories: Record<string, string>;
}

export default function EmailTemplatesCreate({ categories, subCategories }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        name: string;
        category: string;
        sub_category: string;
        subject: string;
        body: string;
        description: string;
        is_default: boolean;
        is_active: boolean;
        variables: string[];
    }>({
        name: '',
        category: '',
        sub_category: '',
        subject: '',
        body: '',
        description: '',
        is_default: false,
        is_active: true,
        variables: []
    });

    const [availableSubCategories, setAvailableSubCategories] = useState<Record<string, string>>({});

    // Mapping des sous-catégories par catégorie
    const subCategoryMapping: Record<string, string[]> = {
        'envoi_initial': ['promotionnel', 'concis_direct', 'standard_professionnel', 'detaille_etapes', 'personnalise_chaleureux'],
        'rappel': ['rappel_offre_speciale', 'rappel_date_expiration', 'rappel_standard'],
        'relance': ['suivi_standard', 'suivi_ajustements', 'suivi_feedback'],
        'confirmation': ['confirmation_infos', 'confirmation_etapes', 'confirmation_standard']
    };

    const handleCategoryChange = (category: string) => {
        setData('category', category);
        setData('sub_category', '');

        // Filtrer les sous-catégories disponibles
        const availableSubs = subCategoryMapping[category] || [];
        const filteredSubCategories = Object.fromEntries(
            Object.entries(subCategories).filter(([key]) => availableSubs.includes(key))
        );
        setAvailableSubCategories(filteredSubCategories);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/email-templates', {
            onSuccess: () => {
                toast.success('Modèle créé avec succès');
            },
            onError: () => {
                toast.error('Erreur lors de la création');
            }
        });
    };

    // Variables communes pour les templates
    const commonVariables = [
        'client_nom',
        'entreprise_nom',
        'devis_numero',
        'devis_montant',
        'devis_date',
        'devis_validite',
        'contact_nom',
        'contact_email',
        'contact_telephone'
    ];

    const insertVariable = (variable: string) => {
        const textarea = document.getElementById('body') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = data.body;
            const before = text.substring(0, start);
            const after = text.substring(end);
            const newText = before + `{{${variable}}}` + after;
            setData('body', newText);

            // Remettre le focus et la position du curseur
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
            }, 0);
        }
    };

    const insertVariableInSubject = (variable: string) => {
        const input = document.getElementById('subject') as HTMLInputElement;
        if (input) {
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const text = data.subject;
            const before = text.substring(0, start);
            const after = text.substring(end);
            const newText = before + `{{${variable}}}` + after;
            setData('subject', newText);

            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
            }, 0);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau modèle d'email" />

            <div className="space-y-6 p-4">
                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/email-templates">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Retour
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Nouveau modèle d'email</h1>
                            <p className="text-muted-foreground">
                                Créez un nouveau modèle d'email pour vos devis
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Formulaire principal */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Informations générales */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="h-5 w-5" />
                                        Informations générales
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nom du modèle *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Nom du modèle..."
                                        />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Catégorie *</Label>
                                            <Select value={data.category} onValueChange={handleCategoryChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner une catégorie" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(categories).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="sub_category">Sous-catégorie *</Label>
                                            <Select
                                                value={data.sub_category}
                                                onValueChange={(value) => setData('sub_category', value)}
                                                disabled={!data.category}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner une sous-catégorie" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(availableSubCategories).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.sub_category && <p className="text-sm text-destructive">{errors.sub_category}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Description du modèle..."
                                            rows={3}
                                        />
                                        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                                    </div>

                                    <div className="flex items-center space-x-6">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="is_active"
                                                checked={data.is_active}
                                                onCheckedChange={(checked: boolean) => setData('is_active', checked)}
                                            />
                                            <Label htmlFor="is_active">Modèle actif</Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="is_default"
                                                checked={data.is_default}
                                                onCheckedChange={(checked: boolean) => setData('is_default', checked)}
                                            />
                                            <Label htmlFor="is_default">Par défaut pour cette catégorie</Label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Contenu de l'email */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Contenu de l'email</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="subject">Sujet de l'email *</Label>
                                            <div className="flex gap-1">
                                                {commonVariables.slice(0, 3).map((variable) => (
                                                    <Button
                                                        key={variable}
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => insertVariableInSubject(variable)}
                                                        className="text-xs"
                                                    >
                                                        {variable}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        <Input
                                            id="subject"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            placeholder="Sujet de l'email..."
                                        />
                                        {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="body">Corps de l'email *</Label>
                                        <Textarea
                                            id="body"
                                            value={data.body}
                                            onChange={(e) => setData('body', e.target.value)}
                                            placeholder="Corps de l'email..."
                                            rows={15}
                                            className="font-mono text-sm"
                                        />
                                        {errors.body && <p className="text-sm text-destructive">{errors.body}</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Barre latérale */}
                        <div className="space-y-6">
                            {/* Variables disponibles */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Variable className="h-5 w-5" />
                                        Variables disponibles
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Cliquez pour insérer dans le corps de l'email
                                        </p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {commonVariables.map((variable) => (
                                                <Button
                                                    key={variable}
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => insertVariable(variable)}
                                                    className="justify-start text-xs font-mono"
                                                >
                                                    {`{{${variable}}}`}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Aide */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Info className="h-5 w-5" />
                                        Aide
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <p className="font-medium">Variables :</p>
                                            <p className="text-muted-foreground">
                                                Utilisez {`{{nom_variable}}`} pour insérer des données dynamiques
                                            </p>
                                        </div>
                                        <Separator />
                                        <div>
                                            <p className="font-medium">Formatage :</p>
                                            <p className="text-muted-foreground">
                                                Vous pouvez utiliser des emojis et du formatage simple
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-2">
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={processing}
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {processing ? 'Création...' : 'Créer le modèle'}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            asChild
                                        >
                                            <Link href="/email-templates">
                                                Annuler
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
