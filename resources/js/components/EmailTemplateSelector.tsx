import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Mail,
    Eye,
    Edit,
    Send,
    Clock,
    MessageSquare,
    UserCheck,
    Star,
    Variable
} from 'lucide-react';
import axios from 'axios';

interface EmailTemplate {
    id: number;
    name: string;
    category: string;
    sub_category: string;
    subject: string;
    body: string;
    description?: string;
    is_default: boolean;
}

interface Props {
    category: 'envoi_initial' | 'rappel' | 'relance' | 'confirmation';
    onTemplateSelect: (template: EmailTemplate | null) => void;
    onContentChange: (subject: string, body: string) => void;
    initialSubject?: string;
    initialBody?: string;
    devisData?: Record<string, string>; // Données du devis pour remplacer les variables
}

export default function EmailTemplateSelector({
    category,
    onTemplateSelect,
    onContentChange,
    initialSubject = '',
    initialBody = '',
    devisData = {}
}: Props) {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [subject, setSubject] = useState(initialSubject);
    const [body, setBody] = useState(initialBody);
    const [isLoading, setIsLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [processedSubject, setProcessedSubject] = useState('');
    const [processedBody, setProcessedBody] = useState('');

    // Charger les templates au montage et lors du changement de catégorie
    useEffect(() => {
        loadTemplates();
    }, [category]);

    // Mettre à jour le contenu traité quand le sujet/corps change
    useEffect(() => {
        const processed = processTemplate(subject, body, devisData);
        setProcessedSubject(processed.subject);
        setProcessedBody(processed.body);
        onContentChange(subject, body);
    }, [subject, body, devisData]);

    // Charger le template par défaut au début
    useEffect(() => {
        if (templates.length > 0 && !selectedTemplateId && !initialSubject && !initialBody) {
            const defaultTemplate = templates.find(t => t.is_default);
            if (defaultTemplate) {
                selectTemplate(defaultTemplate.id.toString());
            }
        }
    }, [templates, selectedTemplateId, initialSubject, initialBody]);

    const loadTemplates = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('/api/email-templates/by-category', {
                params: { category }
            });
            setTemplates(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectTemplate = (templateId: string) => {
        if (templateId === '') {
            setSelectedTemplateId('');
            setSelectedTemplate(null);
            setSubject('');
            setBody('');
            onTemplateSelect(null);
            return;
        }

        const template = templates.find(t => t.id === parseInt(templateId));
        if (template) {
            setSelectedTemplateId(templateId);
            setSelectedTemplate(template);
            setSubject(template.subject);
            setBody(template.body);
            onTemplateSelect(template);
        }
    };

    const processTemplate = (subject: string, body: string, data: Record<string, string>) => {
        let processedSubject = subject;
        let processedBody = body;

        Object.entries(data).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            processedSubject = processedSubject.replace(regex, value);
            processedBody = processedBody.replace(regex, value);
        });

        return { subject: processedSubject, body: processedBody };
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

    const getCategoryLabel = (category: string) => {
        const labels = {
            'envoi_initial': 'Envoi initial de devis',
            'rappel': 'Rappel de devis',
            'relance': 'Relance de devis',
            'confirmation': 'Confirmation de devis accepté'
        };
        return labels[category as keyof typeof labels] || category;
    };

    const insertVariable = (variable: string, target: 'subject' | 'body') => {
        if (target === 'subject') {
            const input = document.getElementById('email-subject') as HTMLInputElement;
            if (input) {
                const start = input.selectionStart || 0;
                const end = input.selectionEnd || 0;
                const text = subject;
                const before = text.substring(0, start);
                const after = text.substring(end);
                const newText = before + `{{${variable}}}` + after;
                setSubject(newText);

                setTimeout(() => {
                    input.focus();
                    input.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
                }, 0);
            }
        } else {
            const textarea = document.getElementById('email-body') as HTMLTextAreaElement;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = body;
                const before = text.substring(0, start);
                const after = text.substring(end);
                const newText = before + `{{${variable}}}` + after;
                setBody(newText);

                setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
                }, 0);
            }
        }
    };

    // Variables disponibles
    const variables = Object.keys(devisData);

    return (
        <div className="space-y-6">
            {/* Sélection du modèle */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        Modèle d'email - {getCategoryLabel(category)}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Choisir un modèle</Label>
                            <Select
                                value={selectedTemplateId}
                                onValueChange={selectTemplate}
                                disabled={isLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un modèle ou personnaliser" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Email personnalisé</SelectItem>
                                    {templates.map((template) => (
                                        <SelectItem key={template.id} value={template.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <span>{template.name}</span>
                                                {template.is_default && (
                                                    <Star className="h-3 w-3 fill-current" />
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedTemplate && (
                            <div className="text-sm text-muted-foreground">
                                {selectedTemplate.description}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Contenu de l'email */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Contenu de l'email</span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                {showPreview ? 'Masquer' : 'Prévisualiser'}
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-subject">Sujet</Label>
                                <Input
                                    id="email-subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Sujet de l'email..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email-body">Message</Label>
                                <Textarea
                                    id="email-body"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Corps de l'email..."
                                    rows={12}
                                    className="font-mono text-sm"
                                />
                            </div>
                        </div>

                        {/* Variables disponibles */}
                        {variables.length > 0 && (
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Variable className="h-4 w-4" />
                                            Variables
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <p className="text-xs text-muted-foreground mb-3">
                                                Cliquez pour insérer dans le sujet ou le corps
                                            </p>
                                            <div className="grid grid-cols-1 gap-2">
                                                {variables.map((variable) => (
                                                    <div key={variable} className="space-y-1">
                                                        <div className="flex gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => insertVariable(variable, 'subject')}
                                                                className="text-xs flex-1"
                                                                title="Insérer dans le sujet"
                                                            >
                                                                S
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => insertVariable(variable, 'body')}
                                                                className="text-xs flex-1"
                                                                title="Insérer dans le corps"
                                                            >
                                                                C
                                                            </Button>
                                                        </div>
                                                        <div className="text-xs font-mono bg-muted/50 rounded px-2 py-1">
                                                            {`{{${variable}}}`}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>

                    {/* Prévisualisation */}
                    {showPreview && (
                        <div className="mt-6">
                            <Separator className="mb-4" />
                            <div className="space-y-4">
                                <h4 className="font-medium">Aperçu avec les données actuelles :</h4>

                                <div className="border rounded-lg p-4 bg-muted/20">
                                    <div className="space-y-2 text-sm">
                                        <div><strong>Sujet:</strong> {processedSubject}</div>
                                    </div>
                                </div>

                                <div className="bg-white border rounded-lg p-4">
                                    <div className="whitespace-pre-wrap text-sm">
                                        {processedBody}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
