import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Edit,
    Eye,
    Copy,
    Star,
    Mail,
    Send,
    Clock,
    MessageSquare,
    UserCheck,
    Trash2,
    Settings
} from 'lucide-react';
import { toast } from 'sonner';

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
    emailTemplate: EmailTemplate;
}

export default function EmailTemplatesShow({ emailTemplate }: Props) {
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
            title: emailTemplate.name,
            href: `/email-templates/${emailTemplate.id}`,
        },
    ];

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

    const handleSetDefault = () => {
        router.patch(`/email-templates/${emailTemplate.id}/set-default`, {}, {
            preserveState: false,
            replace: false,
            onSuccess: () => {
                toast.success('Modèle défini comme par défaut');
                // Recharger la page pour voir les changements
                router.reload();
            },
            onError: () => {
                toast.error('Erreur lors de la modification');
            }
        });
    };

    const handleDuplicate = () => {
        router.post(`/email-templates/${emailTemplate.id}/duplicate`, {}, {
            preserveState: false,
            replace: false,
            onSuccess: () => {
                toast.success('Modèle dupliqué avec succès');
            },
            onError: () => {
                toast.error('Erreur lors de la duplication');
            }
        });
    };

    const handleDelete = () => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer le modèle "${emailTemplate.name}" ?`)) {
            router.delete(`/email-templates/${emailTemplate.id}`, {
                preserveState: false,
                replace: false,
                onSuccess: () => {
                    toast.success('Modèle supprimé avec succès');
                },
                onError: () => {
                    toast.error('Erreur lors de la suppression');
                }
            });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copié dans le presse-papiers');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={emailTemplate.name} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Bouton retour */}
                <div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/email-templates">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour aux modèles
                        </Link>
                    </Button>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold">
                            {emailTemplate.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Détails du modèle d'email
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/email-templates/${emailTemplate.id}/preview`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Prévisualiser
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/email-templates/${emailTemplate.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Contenu principal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Informations générales */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Informations générales
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Badge
                                            className={`gap-1 ${getCategoryColor(emailTemplate.category)}`}
                                            variant="outline"
                                        >
                                            {getCategoryIcon(emailTemplate.category)}
                                            {emailTemplate.category_name}
                                        </Badge>
                                        <Badge variant="outline">
                                            {emailTemplate.sub_category_name}
                                        </Badge>
                                        {emailTemplate.is_default && (
                                            <Badge variant="secondary" className="gap-1">
                                                <Star className="h-3 w-3 fill-current" />
                                                Par défaut
                                            </Badge>
                                        )}
                                        <Badge variant={emailTemplate.is_active ? "default" : "destructive"}>
                                            {emailTemplate.is_active ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </div>

                                    {emailTemplate.description && (
                                        <div>
                                            <h4 className="font-medium mb-2">Description</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {emailTemplate.description}
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">Créé le :</span>
                                            <p className="text-muted-foreground">
                                                {new Date(emailTemplate.created_at).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-medium">Modifié le :</span>
                                            <p className="text-muted-foreground">
                                                {new Date(emailTemplate.updated_at).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contenu de l'email */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Contenu de l'email</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Sujet */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium">Sujet</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(emailTemplate.subject)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-3">
                                        <p className="text-sm font-medium">{emailTemplate.subject}</p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Corps */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium">Corps de l'email</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(emailTemplate.body)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-4">
                                        <pre className="text-sm whitespace-pre-wrap font-sans">
                                            {emailTemplate.body}
                                        </pre>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Barre latérale */}
                    <div className="space-y-6">
                        {/* Variables utilisées */}
                        {emailTemplate.variables && emailTemplate.variables.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Variables utilisées</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {emailTemplate.variables.map((variable) => (
                                            <div
                                                key={variable}
                                                className="flex items-center justify-between bg-muted/50 rounded px-2 py-1"
                                            >
                                                <span className="text-xs font-mono">
                                                    {`{{${variable}}}`}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(`{{${variable}}}`)}
                                                    className="h-6 px-2"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button className="w-full" asChild>
                                    <Link href={`/email-templates/${emailTemplate.id}/preview`}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Prévisualiser
                                    </Link>
                                </Button>

                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/email-templates/${emailTemplate.id}/edit`}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Modifier
                                    </Link>
                                </Button>

                                {!emailTemplate.is_default && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleSetDefault}
                                    >
                                        <Star className="h-4 w-4 mr-2" />
                                        Définir par défaut
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleDuplicate}
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Dupliquer
                                </Button>

                                <Separator />

                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Informations techniques */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informations techniques</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">ID :</span>
                                        <span className="font-mono">{emailTemplate.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Catégorie :</span>
                                        <span className="font-mono">{emailTemplate.category}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sous-catégorie :</span>
                                        <span className="font-mono">{emailTemplate.sub_category}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
