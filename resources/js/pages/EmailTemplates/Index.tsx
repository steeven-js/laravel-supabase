import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Copy,
    Trash2,
    Mail,
    Star,
    MoreHorizontal,
    FileText,
    Settings,
    AlertCircle,
    CheckCircle,
    XCircle,
    Send,
    Clock,
    MessageSquare,
    UserCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
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
];

interface EmailTemplate {
    id: number;
    name: string;
    category: string;
    sub_category: string;
    subject: string;
    body: string;
    description?: string;
    is_default: boolean;
    is_active: boolean;
    variables?: string[];
    category_name: string;
    sub_category_name: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    templates?: {
        data: EmailTemplate[];
        links: any[];
        meta: {
            current_page: number;
            per_page: number;
            total: number;
            last_page: number;
        };
    };
    categories?: Record<string, string>;
    filters?: {
        category?: string;
        active?: string;
    };
}

export default function EmailTemplatesIndex({
    templates,
    categories,
    filters = {}
}: Props) {
    // Vérifications de sécurité pour éviter les erreurs undefined
    const safeTemplates = templates || {
        data: [],
        links: [],
        meta: {
            current_page: 1,
            per_page: 20,
            total: 0,
            last_page: 1
        }
    };

    // S'assurer que templates.data existe et est un array
    if (!safeTemplates.data || !Array.isArray(safeTemplates.data)) {
        safeTemplates.data = [];
    }

    // S'assurer que templates.meta existe
    if (!safeTemplates.meta) {
        safeTemplates.meta = { current_page: 1, per_page: 20, total: 0, last_page: 1 };
    }

    // S'assurer que templates.links existe
    if (!safeTemplates.links) {
        safeTemplates.links = [];
    }

    // S'assurer que categories existe
    const safeCategories = categories || {};

    const [categoryFilter, setCategoryFilter] = useState(filters?.category ? filters.category : 'all');
    const [activeFilter, setActiveFilter] = useState(filters?.active ? filters.active : 'all');

    // Synchroniser les filtres avec les props
    useEffect(() => {
        setCategoryFilter(filters?.category ? filters.category : 'all');
        setActiveFilter(filters?.active ? filters.active : 'all');
    }, [filters]);

    const applyFilters = (newCategoryFilter?: string, newActiveFilter?: string) => {
        const filterParams: any = {};

        const categoryToUse = newCategoryFilter !== undefined ? newCategoryFilter : categoryFilter;
        const activeToUse = newActiveFilter !== undefined ? newActiveFilter : activeFilter;

        if (categoryToUse && categoryToUse !== 'all') {
            filterParams.category = categoryToUse;
        }

        if (activeToUse && activeToUse !== 'all') {
            filterParams.active = activeToUse;
        }

        console.log('Filtres appliqués:', filterParams);

        router.get('/email-templates', filterParams, {
            preserveState: false,
            replace: true,
        });
    };

    const handleCategoryChange = (value: string) => {
        setCategoryFilter(value);
        applyFilters(value, undefined);
    };

    const handleActiveChange = (value: string) => {
        setActiveFilter(value);
        applyFilters(undefined, value);
    };

    const resetFilters = () => {
        setCategoryFilter('all');
        setActiveFilter('all');
        router.get('/email-templates', {}, {
            preserveState: false,
            replace: true,
        });
    };

    const handleSetDefault = (template: EmailTemplate) => {
        router.patch(`/email-templates/${template.id}/set-default`, {}, {
            preserveState: false,
            replace: false,
            onSuccess: () => {
                toast.success('Modèle défini comme par défaut');
                // Forcer le rechargement de la page avec les filtres actuels
                router.reload({ only: ['templates'] });
            },
            onError: () => {
                toast.error('Erreur lors de la modification');
            }
        });
    };

    const handleDuplicate = (template: EmailTemplate) => {
        router.post(`/email-templates/${template.id}/duplicate`, {}, {
            preserveState: false,
            replace: false,
            onSuccess: () => {
                toast.success('Modèle dupliqué avec succès');
                // Recharger la page pour voir le nouveau modèle
                router.reload({ only: ['templates'] });
            },
            onError: () => {
                toast.error('Erreur lors de la duplication');
            }
        });
    };

    const handleDelete = (template: EmailTemplate) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer le modèle "${template.name}" ?`)) {
            router.delete(`/email-templates/${template.id}`, {
                preserveState: false,
                replace: false,
                onSuccess: () => {
                    toast.success('Modèle supprimé avec succès');
                    // Recharger la page pour voir la liste mise à jour
                    router.reload({ only: ['templates'] });
                },
                onError: () => {
                    toast.error('Erreur lors de la suppression');
                }
            });
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'envoi_initial':
                return <Send className="h-4 w-4" />;
            case 'rappel':
                return <Clock className="h-4 w-4" />;
            case 'relance':
                return <MessageSquare className="h-4 w-4" />;
            case 'confirmation':
                return <UserCheck className="h-4 w-4" />;
            default:
                return <Mail className="h-4 w-4" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'envoi_initial':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'rappel':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'relance':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'confirmation':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Modèles d'Email" />

            <div className="space-y-6 p-4">
                {/* En-tête */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Modèles d'Email</h1>
                        <p className="text-muted-foreground">
                            Gérez vos modèles d'email pour l'envoi de devis
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/email-templates/create">
                            <Plus className="h-4 w-4 mr-2" />
                            Nouveau modèle
                        </Link>
                    </Button>
                </div>

                {/* Filtres */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtres
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Catégorie</label>
                                <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Toutes les catégories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes les catégories</SelectItem>
                                        {Object.entries(safeCategories).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Statut</label>
                                <Select value={activeFilter} onValueChange={handleActiveChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tous les statuts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les statuts</SelectItem>
                                        <SelectItem value="1">Actif</SelectItem>
                                        <SelectItem value="0">Inactif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={resetFilters} variant="outline">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Réinitialiser
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Liste des modèles */}
                <Card>
                    <CardContent className="p-0">
                        {safeTemplates.data.length > 0 ? (
                            <div className="divide-y">
                                {safeTemplates.data.map((template) => (
                                    <div key={template.id} className="p-6 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-semibold text-lg">{template.name}</h3>
                                                    {template.is_default && (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <Star className="h-3 w-3 fill-current" />
                                                            Par défaut
                                                        </Badge>
                                                    )}
                                                    <Badge
                                                        variant={template.is_active ? "default" : "destructive"}
                                                    >
                                                        {template.is_active ? 'Actif' : 'Inactif'}
                                                    </Badge>
                                                </div>

                                                {template.description && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {template.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-4">
                                                    <Badge
                                                        className={`gap-1 ${getCategoryColor(template.category)}`}
                                                        variant="outline"
                                                    >
                                                        {getCategoryIcon(template.category)}
                                                        {template.category_name}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {template.sub_category_name}
                                                    </Badge>
                                                </div>

                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Sujet: <span className="text-foreground">{template.subject}</span>
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    Modifié le {new Date(template.updated_at).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 ml-4">
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={`/email-templates/${template.id}/preview`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>

                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={`/email-templates/${template.id}`}>
                                                        <FileText className="h-4 w-4" />
                                                    </Link>
                                                </Button>

                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={`/email-templates/${template.id}/edit`}>
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </Button>

                                                {!template.is_default && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleSetDefault(template)}
                                                    >
                                                        <Star className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDuplicate(template)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDelete(template)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Aucun modèle d'email trouvé</h3>
                                <p className="text-muted-foreground mb-4">
                                    Commencez par créer votre premier modèle d'email.
                                </p>
                                <Button asChild>
                                    <Link href="/email-templates/create">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Créer un modèle
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {safeTemplates.meta.last_page > 1 && (
                    <div className="flex justify-center">
                        <div className="flex items-center space-x-2">
                            {safeTemplates.links.map((link: any, index: number) => (
                                <Button
                                    key={index}
                                    variant={link.active ? "default" : "outline"}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
