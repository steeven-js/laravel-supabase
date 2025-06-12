import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Edit,
    Send,
    Clock,
    MessageSquare,
    UserCheck,
    Mail,
    Copy,
    Eye
} from 'lucide-react';

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
    category_name: string;
    sub_category_name: string;
}

interface ProcessedTemplate {
    subject: string;
    body: string;
}

interface Props {
    emailTemplate: EmailTemplate;
    processed: ProcessedTemplate;
    testData: Record<string, string>;
}

export default function EmailTemplatesPreview({ emailTemplate, processed, testData }: Props) {
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
        {
            title: 'Prévisualisation',
            href: `/email-templates/${emailTemplate.id}/preview`,
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Prévisualisation - ${emailTemplate.name}`} />

            <div className="space-y-6 p-4">
                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/email-templates">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Retour à la liste
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Prévisualisation</h1>
                            <p className="text-muted-foreground">
                                {emailTemplate.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/email-templates/${emailTemplate.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Prévisualisation de l'email */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Informations du modèle */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Informations du modèle
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
                                            <Badge variant="secondary">
                                                Par défaut
                                            </Badge>
                                        )}
                                        <Badge variant={emailTemplate.is_active ? "default" : "destructive"}>
                                            {emailTemplate.is_active ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </div>

                                    {emailTemplate.description && (
                                        <p className="text-sm text-muted-foreground">
                                            {emailTemplate.description}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Prévisualisation de l'email */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Eye className="h-5 w-5" />
                                        Aperçu de l'email
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(processed.subject + '\n\n' + processed.body)}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copier
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* En-tête de l'email simulé */}
                                    <div className="border rounded-lg p-4 bg-muted/20">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium">De:</span>
                                                <span>{testData.contact_nom} &lt;{testData.contact_email}&gt;</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium">À:</span>
                                                <span>{testData.client_nom} &lt;client@example.com&gt;</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium">Sujet:</span>
                                                <span className="font-semibold">{processed.subject}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Corps de l'email */}
                                    <div className="bg-white border rounded-lg p-6">
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                            {processed.body}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Données de test utilisées */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Données de test</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Ces données sont utilisées pour générer l'aperçu :
                                    </p>

                                    {Object.entries(testData).map(([key, value]) => (
                                        <div key={key} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-mono text-muted-foreground">
                                                    {`{{${key}}}`}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(value)}
                                                    className="h-6 px-2"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="text-sm bg-muted/50 rounded px-2 py-1">
                                                {value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Template brut */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Template brut</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">SUJET</label>
                                        <div className="text-xs font-mono bg-muted/50 rounded p-2 mt-1">
                                            {emailTemplate.subject}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">CORPS</label>
                                        <div className="text-xs font-mono bg-muted/50 rounded p-2 mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap">
                                            {emailTemplate.body}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    <Button className="w-full" asChild>
                                        <Link href={`/email-templates/${emailTemplate.id}/edit`}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Modifier ce modèle
                                        </Link>
                                    </Button>

                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href="/email-templates">
                                            Retour à la liste
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
