import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Edit,
    FileText,
    Building2,
    MapPin,
    Phone,
    Mail,
    Calendar,
    User,
    Euro,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Eye,
    Download,
    Share,
    MoreHorizontal,
    Copy,
    CheckCircle,
    XCircle,
    Clock,
    FileX,
    Send,
    History,
    Plus,
    Loader2,
    Target,
    Percent,
    DollarSign,
    Users,
    Edit3,
    Trash2,
    AlertTriangle,
    Bug,
    HelpCircle,
    Settings,
    UserCheck,
    Timer,
    CheckSquare,
    RotateCcw,
    ListTodo,
    GripVertical,
    X
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import {
    CSS,
} from '@dnd-kit/utilities';
import React, { useState, useEffect } from 'react';
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
    actif: boolean;
    notes?: string;
    entreprise?: {
        id: number;
        nom: string;
        nom_commercial?: string;
    };
    devis: Array<{
        id: number;
        numero_devis: string;
        objet: string;
        statut: string;
        date_devis: string;
        montant_ttc: number;
    }>;
    emails?: Array<{
        id: number;
        objet: string;
        contenu: string;
        date_envoi: string;
        statut: 'envoye' | 'echec';
        user: {
            id: number;
            name: string;
        };
    }>;
    opportunities?: Array<{
        id: number;
        nom: string;
        description: string;
        etape: string;
        probabilite: number;
        montant: number;
        date_cloture_prevue: string;
        date_cloture_reelle?: string;
        notes?: string;
        user: {
            id: number;
            name: string;
        };
        created_at: string;
        updated_at: string;
    }>;
    tickets?: Array<{
        id: number;
        titre: string;
        description: string;
        priorite: string;
        statut: string;
        type: string;
        date_echeance?: string;
        date_resolution?: string;
        temps_estime?: number;
        temps_passe: number;
        progression: number;
        notes_internes?: string;
        solution?: string;
        visible_client: boolean;
        user: {
            id: number;
            name: string;
        };
        creator: {
            id: number;
            name: string;
        };
        created_at: string;
        updated_at: string;
    }>;
    todos?: Array<{
        id: number;
        titre: string;
        description?: string;
        termine: boolean;
        ordre: number;
        priorite: string;
        date_echeance?: string;
        user: {
            id: number;
            name: string;
        };
        created_at: string;
        updated_at: string;
    }>;
    created_at: string;
}

interface Props {
    client: Client;
    auth: {
        user: {
            id: number;
            name: string;
        };
    };
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
];

export default function ClientsShow({ client, auth }: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'stats' | 'emails' | 'opportunities' | 'tickets'>('overview');
    const [isComposingEmail, setIsComposingEmail] = useState(false);
    const [emailForm, setEmailForm] = useState({
        objet: '',
        contenu: ''
    });
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    // États pour les opportunités
    const [isCreatingOpportunity, setIsCreatingOpportunity] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState<number | null>(null);
    const [opportunityForm, setOpportunityForm] = useState({
        nom: '',
        description: '',
        etape: 'prospection',
        probabilite: 50,
        montant: '',
        date_cloture_prevue: '',
        notes: ''
    });
    const [isSavingOpportunity, setIsSavingOpportunity] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // États pour les tickets
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);
    const [editingTicket, setEditingTicket] = useState<number | null>(null);
    const [ticketForm, setTicketForm] = useState({
        titre: '',
        description: '',
        priorite: 'normale',
        statut: 'ouvert',
        type: 'incident',
        user_id: auth.user.id,
        date_echeance: '',
        temps_estime: '',
        progression: 0,
        notes_internes: '',
        visible_client: true
    });
    const [isSavingTicket, setIsSavingTicket] = useState(false);
    const [resolvingTicket, setResolvingTicket] = useState<number | null>(null);
    const [resolutionForm, setResolutionForm] = useState({ solution: '' });
    const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);

    // Options pour les étapes d'opportunité
    const etapesOptions = [
        { value: 'prospection', label: 'Prospection', color: 'blue' },
        { value: 'qualification', label: 'Qualification', color: 'indigo' },
        { value: 'proposition', label: 'Proposition', color: 'purple' },
        { value: 'negociation', label: 'Négociation', color: 'yellow' },
        { value: 'fermeture', label: 'Fermeture', color: 'orange' },
        { value: 'gagnee', label: 'Gagnée', color: 'green' },
        { value: 'perdue', label: 'Perdue', color: 'red' },
    ];

    // Options pour les tickets
    const prioritesOptions = [
        { value: 'faible', label: 'Faible', color: 'blue', icon: CheckCircle },
        { value: 'normale', label: 'Normale', color: 'gray', icon: Clock },
        { value: 'haute', label: 'Haute', color: 'orange', icon: AlertTriangle },
        { value: 'critique', label: 'Critique', color: 'red', icon: XCircle },
    ];

    const statutsOptions = [
        { value: 'ouvert', label: 'Ouvert', color: 'red', icon: Clock },
        { value: 'en_cours', label: 'En cours', color: 'yellow', icon: Timer },
        { value: 'resolu', label: 'Résolu', color: 'green', icon: CheckCircle },
        { value: 'ferme', label: 'Fermé', color: 'gray', icon: XCircle },
    ];

    const typesOptions = [
        { value: 'bug', label: 'Bug', color: 'red', icon: Bug },
        { value: 'demande', label: 'Demande', color: 'blue', icon: Settings },
        { value: 'incident', label: 'Incident', color: 'orange', icon: AlertTriangle },
        { value: 'question', label: 'Question', color: 'purple', icon: HelpCircle },
        { value: 'autre', label: 'Autre', color: 'gray', icon: MoreHorizontal },
    ];

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateShort = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const getStatusVariant = (statut: string) => {
        switch (statut) {
            case 'accepte':
                return 'default';
            case 'envoye':
                return 'outline';
            case 'refuse':
                return 'destructive';
            case 'expire':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getStatusIcon = (statut: string) => {
        switch (statut) {
            case 'accepte':
                return <CheckCircle className="h-4 w-4" />;
            case 'envoye':
                return <Eye className="h-4 w-4" />;
            case 'refuse':
                return <XCircle className="h-4 w-4" />;
            case 'expire':
                return <FileX className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const formatStatut = (statut: string) => {
        switch (statut) {
            case 'brouillon':
                return 'Brouillon';
            case 'envoye':
                return 'Envoyé';
            case 'accepte':
                return 'Accepté';
            case 'refuse':
                return 'Refusé';
            case 'expire':
                return 'Expiré';
            default:
                return statut;
        }
    };

    // Calculs des statistiques
    const stats = {
        totalQuotes: client.devis.length,
        acceptedQuotes: client.devis.filter(d => d.statut === 'accepte').length,
        pendingQuotes: client.devis.filter(d => d.statut === 'envoye').length,
        rejectedQuotes: client.devis.filter(d => d.statut === 'refuse').length,
        totalRevenue: client.devis
            .filter(d => d.statut === 'accepte')
            .reduce((sum, d) => sum + d.montant_ttc, 0),
        averageQuoteValue: client.devis.length > 0
            ? client.devis.reduce((sum, d) => sum + d.montant_ttc, 0) / client.devis.length
            : 0,
        conversionRate: client.devis.length > 0
            ? (client.devis.filter(d => d.statut === 'accepte').length / client.devis.length) * 100
            : 0
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copié dans le presse-papiers`);
    };

    const tabs = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: User },
        { id: 'quotes', label: 'Devis', icon: FileText },
        { id: 'stats', label: 'Statistiques', icon: BarChart3 },
        { id: 'emails', label: 'Emails', icon: Mail },
        { id: 'opportunities', label: 'Opportunités', icon: Target },
        { id: 'tickets', label: 'Tickets', icon: AlertTriangle }
    ] as const;

    const handleSendEmail = async () => {
        if (!emailForm.objet.trim() || !emailForm.contenu.trim()) {
            toast.error('Veuillez remplir tous les champs');
            return;
        }

        setIsSendingEmail(true);

        try {
            await router.post(`/clients/${client.id}/send-email`, emailForm, {
                onSuccess: () => {
                    toast.success('Email envoyé avec succès !');
                    setEmailForm({ objet: '', contenu: '' });
                    setIsComposingEmail(false);
                },
                onError: (errors) => {
                    console.error('Erreur lors de l\'envoi:', errors);
                    toast.error('Erreur lors de l\'envoi de l\'email');
                },
                onFinish: () => {
                    setIsSendingEmail(false);
                }
            });
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de l\'envoi de l\'email');
            setIsSendingEmail(false);
        }
    };

    const formatEmailDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const userEmails = client.emails?.filter(email => email.user?.id === auth.user.id) || [];

    const handleSaveOpportunity = async () => {
        if (!opportunityForm.nom.trim()) {
            toast.error('Le nom de l\'opportunité est requis');
            return;
        }

        setIsSavingOpportunity(true);

        try {
            const url = editingOpportunity
                ? `/opportunities/${editingOpportunity}`
                : `/clients/${client.id}/opportunities`;

            const method = editingOpportunity ? 'patch' : 'post';

            await router[method](url, {
                ...opportunityForm,
                probabilite: parseInt(opportunityForm.probabilite.toString()),
                montant: opportunityForm.montant ? parseFloat(opportunityForm.montant) : null,
            }, {
                onSuccess: () => {
                    toast.success(editingOpportunity ? 'Opportunité mise à jour !' : 'Opportunité créée !');
                    resetOpportunityForm();
                },
                onError: (errors) => {
                    console.error('Erreur:', errors);
                    toast.error('Erreur lors de la sauvegarde');
                },
                onFinish: () => {
                    setIsSavingOpportunity(false);
                }
            });
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la sauvegarde');
            setIsSavingOpportunity(false);
        }
    };

    const resetOpportunityForm = () => {
        setOpportunityForm({
            nom: '',
            description: '',
            etape: 'prospection',
            probabilite: 50,
            montant: '',
            date_cloture_prevue: '',
            notes: ''
        });
        setIsCreatingOpportunity(false);
        setEditingOpportunity(null);
    };

    const handleEditOpportunity = (opportunity: any) => {
        setOpportunityForm({
            nom: opportunity.nom,
            description: opportunity.description || '',
            etape: opportunity.etape,
            probabilite: opportunity.probabilite,
            montant: opportunity.montant ? opportunity.montant.toString() : '',
            date_cloture_prevue: opportunity.date_cloture_prevue || '',
            notes: opportunity.notes || ''
        });
        setEditingOpportunity(opportunity.id);
        setIsCreatingOpportunity(true);
    };

    const handleDeleteOpportunity = async (opportunityId: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) {
            return;
        }

        try {
            await router.delete(`/opportunities/${opportunityId}`, {
                onSuccess: () => {
                    toast.success('Opportunité supprimée !');
                },
                onError: () => {
                    toast.error('Erreur lors de la suppression');
                }
            });
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const getEtapeColor = (etape: string) => {
        const option = etapesOptions.find(opt => opt.value === etape);
        return option?.color || 'gray';
    };

    const getProbabiliteColorClass = (probabilite: number) => {
        if (probabilite <= 33) return 'bg-red-500';
        if (probabilite <= 66) return 'bg-orange-500';
        return 'bg-green-500';
    };

        const handleJaugeClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.round((x / width) * 100);
        const clampedPercentage = Math.min(100, Math.max(0, percentage));

        setOpportunityForm(prev => ({ ...prev, probabilite: clampedPercentage }));
    };

    const handleJaugeDrag = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging || event.buttons === 1) {
            handleJaugeClick(event);
        }
    };

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        handleJaugeClick(event);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    // Ajouter l'événement global pour relâcher la souris
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mouseup', handleGlobalMouseUp);
            return () => {
                document.removeEventListener('mouseup', handleGlobalMouseUp);
            };
        }
    }, [isDragging]);

    // Charger la liste des utilisateurs
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const response = await fetch('/api/users');
                const usersData = await response.json();
                setUsers(usersData);
            } catch (error) {
                console.error('Erreur lors du chargement des utilisateurs:', error);
            }
        };

        if (activeTab === 'tickets') {
            loadUsers();
        }
    }, [activeTab]);

    // Fonctions pour les tickets
    const handleSaveTicket = async () => {
        if (!ticketForm.titre.trim() || !ticketForm.description.trim()) {
            toast.error('Le titre et la description sont requis');
            return;
        }

        setIsSavingTicket(true);

        try {
            const url = editingTicket
                ? `/tickets/${editingTicket}`
                : `/clients/${client.id}/tickets`;

            const method = editingTicket ? 'patch' : 'post';

            await router[method](url, {
                ...ticketForm,
                user_id: parseInt(ticketForm.user_id.toString()),
                temps_estime: ticketForm.temps_estime ? parseInt(ticketForm.temps_estime) : null,
            }, {
                onSuccess: () => {
                    toast.success(editingTicket ? 'Ticket mis à jour !' : 'Ticket créé !');
                    resetTicketForm();
                },
                onError: (errors) => {
                    console.error('Erreur:', errors);
                    toast.error('Erreur lors de la sauvegarde');
                },
                onFinish: () => {
                    setIsSavingTicket(false);
                }
            });
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la sauvegarde');
            setIsSavingTicket(false);
        }
    };

    const resetTicketForm = () => {
        setTicketForm({
            titre: '',
            description: '',
            priorite: 'normale',
            statut: 'ouvert',
            type: 'incident',
            user_id: auth.user.id,
            date_echeance: '',
            temps_estime: '',
            progression: 0,
            notes_internes: '',
            visible_client: true
        });
        setIsCreatingTicket(false);
        setEditingTicket(null);
    };

    const handleEditTicket = (ticket: any) => {
        setTicketForm({
            titre: ticket.titre,
            description: ticket.description,
            priorite: ticket.priorite,
            statut: ticket.statut,
            type: ticket.type,
            user_id: ticket.user.id,
            date_echeance: ticket.date_echeance ? ticket.date_echeance.split('T')[0] : '',
            temps_estime: ticket.temps_estime ? ticket.temps_estime.toString() : '',
            progression: ticket.progression || 0,
            notes_internes: ticket.notes_internes || '',
            visible_client: ticket.visible_client
        });
        setEditingTicket(ticket.id);
        setIsCreatingTicket(true);
    };

    const handleDeleteTicket = async (ticketId: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) {
            return;
        }

        try {
            await router.delete(`/tickets/${ticketId}`, {
                onSuccess: () => {
                    toast.success('Ticket supprimé !');
                },
                onError: () => {
                    toast.error('Erreur lors de la suppression');
                }
            });
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleResolveTicket = async (ticketId: number) => {
        if (!resolutionForm.solution.trim()) {
            toast.error('La solution est requise');
            return;
        }

        try {
            await router.patch(`/tickets/${ticketId}/resoudre`, resolutionForm, {
                onSuccess: () => {
                    toast.success('Ticket résolu !');
                    setResolvingTicket(null);
                    setResolutionForm({ solution: '' });
                },
                onError: () => {
                    toast.error('Erreur lors de la résolution');
                }
            });
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la résolution');
        }
    };

    const handleCloseTicket = async (ticketId: number) => {
        if (!confirm('Êtes-vous sûr de vouloir fermer ce ticket ?')) {
            return;
        }

        try {
            await router.patch(`/tickets/${ticketId}/fermer`, {}, {
                onSuccess: () => {
                    toast.success('Ticket fermé !');
                },
                onError: () => {
                    toast.error('Erreur lors de la fermeture');
                }
            });
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la fermeture');
        }
    };

    const handleReopenTicket = async (ticketId: number) => {
        try {
            await router.patch(`/tickets/${ticketId}/reouvrir`, {}, {
                onSuccess: () => {
                    toast.success('Ticket réouvert !');
                },
                onError: () => {
                    toast.error('Erreur lors de la réouverture');
                }
            });
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la réouverture');
        }
    };

    const getPrioriteColor = (priorite: string) => {
        const option = prioritesOptions.find(opt => opt.value === priorite);
        return option?.color || 'gray';
    };

    const getStatutColor = (statut: string) => {
        const option = statutsOptions.find(opt => opt.value === statut);
        return option?.color || 'gray';
    };

    const getTypeColor = (type: string) => {
        const option = typesOptions.find(opt => opt.value === type);
        return option?.color || 'gray';
    };

    const getProgression = (ticket: any) => {
        return ticket.progression || 0;
    };

    const getProgressionColor = (progression: number) => {
        if (progression <= 25) return 'red';
        if (progression <= 50) return 'orange';
        if (progression <= 75) return 'yellow';
        return 'green';
    };

    const getProgressionColorClass = (progression: number) => {
        if (progression <= 25) return 'bg-red-500';
        if (progression <= 50) return 'bg-orange-500';
        if (progression <= 75) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    // États pour la jauge de progression
    const [isDraggingProgression, setIsDraggingProgression] = useState(false);

    const handleProgressionJaugeClick = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const percentage = Math.round((x / rect.width) * 100);
        const newProgression = Math.max(0, Math.min(100, percentage));
        setTicketForm(prev => ({ ...prev, progression: newProgression }));
    };

    const handleProgressionJaugeDrag = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isDraggingProgression) {
            event.preventDefault();
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const percentage = Math.round((x / rect.width) * 100);
            const newProgression = Math.max(0, Math.min(100, percentage));
            setTicketForm(prev => ({ ...prev, progression: newProgression }));
        }
    };

    const handleProgressionMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDraggingProgression(true);
        handleProgressionJaugeClick(event);
    };

    const handleProgressionMouseUp = () => {
        setIsDraggingProgression(false);
    };

    const handleProgressionMouseLeave = () => {
        setIsDraggingProgression(false);
    };

    // Gestionnaire d'événements globaux pour la jauge de progression
    useEffect(() => {
        const handleGlobalProgressionMouseUp = () => {
            setIsDraggingProgression(false);
        };

        document.addEventListener('mouseup', handleGlobalProgressionMouseUp);

        return () => {
            document.removeEventListener('mouseup', handleGlobalProgressionMouseUp);
        };
    }, []);

    // États pour les todos
    const [isCreatingTodo, setIsCreatingTodo] = useState(false);
    const [editingTodo, setEditingTodo] = useState<number | null>(null);
    const [todoForm, setTodoForm] = useState({
        titre: '',
        description: '',
        priorite: 'normale',
        date_echeance: '',
    });
    const [isSavingTodo, setIsSavingTodo] = useState(false);
    const [deletingTodo, setDeletingTodo] = useState<number | null>(null);
    const [todos, setTodos] = useState(client.todos || []);

    // Drag & Drop pour les todos
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Options pour les priorités des todos
    const todoPrioritesOptions = [
        { value: 'faible', label: 'Faible', color: 'blue' },
        { value: 'normale', label: 'Normale', color: 'gray' },
        { value: 'haute', label: 'Haute', color: 'orange' },
        { value: 'critique', label: 'Critique', color: 'red' },
    ];

    // Fonctions de gestion des todos
    const handleSaveTodo = async () => {
        if (!todoForm.titre.trim()) {
            toast.error('Le titre de la tâche est requis');
            return;
        }

        setIsSavingTodo(true);

        try {
            const url = editingTodo
                ? `/clients/${client.id}/todos/${editingTodo}`
                : `/clients/${client.id}/todos`;

            const method = editingTodo ? 'put' : 'post';

            await router[method](url, todoForm, {
                onSuccess: () => {
                    toast.success(editingTodo ? 'Tâche mise à jour !' : 'Tâche créée !');
                    resetTodoForm();
                },
                onError: (errors) => {
                    console.error('Erreur:', errors);
                    toast.error('Erreur lors de la sauvegarde');
                },
                onFinish: () => {
                    setIsSavingTodo(false);
                }
            });
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la sauvegarde');
            setIsSavingTodo(false);
        }
    };

    const resetTodoForm = () => {
        setTodoForm({
            titre: '',
            description: '',
            priorite: 'normale',
            date_echeance: '',
        });
        setIsCreatingTodo(false);
        setEditingTodo(null);
    };

    const handleEditTodo = (todo: any) => {
        setTodoForm({
            titre: todo.titre,
            description: todo.description || '',
            priorite: todo.priorite,
            date_echeance: todo.date_echeance ? todo.date_echeance.split('T')[0] : '',
        });
        setEditingTodo(todo.id);
        setIsCreatingTodo(true);
    };

    const handleDeleteTodo = async (todoId: number) => {
        try {
            await router.delete(`/clients/${client.id}/todos/${todoId}`, {
                onSuccess: () => {
                    toast.success('Tâche supprimée !');
                    setDeletingTodo(null);
                },
                onError: (errors) => {
                    console.error('Erreur:', errors);
                    toast.error('Erreur lors de la suppression');
                },
            });
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleToggleTodo = async (todoId: number) => {
        try {
            await router.patch(`/clients/${client.id}/todos/${todoId}/toggle`, {}, {
                onSuccess: () => {
                    toast.success('Statut mis à jour !');
                },
                onError: (errors) => {
                    console.error('Erreur:', errors);
                    toast.error('Erreur lors de la mise à jour');
                },
            });
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = todos.findIndex((todo) => todo.id === active.id);
            const newIndex = todos.findIndex((todo) => todo.id === over?.id);

            const newTodos = arrayMove(todos, oldIndex, newIndex);
            setTodos(newTodos);

            // Mettre à jour l'ordre dans la base de données
            const reorderedTodos = newTodos.map((todo, index) => ({
                id: todo.id,
                ordre: index
            }));

            try {
                await router.patch(`/clients/${client.id}/todos/reorder`, {
                    todos: reorderedTodos
                }, {
                    onError: (errors) => {
                        console.error('Erreur:', errors);
                        toast.error('Erreur lors de la réorganisation');
                        // Restaurer l'ordre original en cas d'erreur
                        setTodos(client.todos || []);
                    }
                });
            } catch (error) {
                console.error('Erreur:', error);
                toast.error('Erreur lors de la réorganisation');
                setTodos(client.todos || []);
            }
        }
    };

    const getTodoPriorityColor = (priorite: string) => {
        const option = todoPrioritesOptions.find(opt => opt.value === priorite);
        return option?.color || 'gray';
    };

    const getTodoPriorityColorClass = (priorite: string) => {
        const color = getTodoPriorityColor(priorite);
        return `bg-${color}-100 text-${color}-800 border-${color}-200`;
    };

    // Composant pour un item todo draggable
    const SortableTodoItem = ({ todo }: { todo: any }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: todo.id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        };

        return (
            <div
                ref={setNodeRef}
                style={style}
                className={`flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors ${
                    todo.termine ? 'opacity-60' : ''
                }`}
            >
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                >
                    <GripVertical className="h-4 w-4" />
                </div>

                <input
                    type="checkbox"
                    checked={todo.termine}
                    onChange={() => handleToggleTodo(todo.id)}
                    className="rounded"
                />

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${todo.termine ? 'line-through text-gray-500' : ''}`}>
                            {todo.titre}
                        </span>
                        <Badge className={`text-xs ${getTodoPriorityColorClass(todo.priorite)}`}>
                            {todoPrioritesOptions.find(opt => opt.value === todo.priorite)?.label}
                        </Badge>
                        {todo.date_echeance && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(todo.date_echeance).toLocaleDateString('fr-FR')}
                            </span>
                        )}
                    </div>
                    {todo.description && (
                        <p className={`text-sm text-gray-600 ${todo.termine ? 'line-through' : ''}`}>
                            {todo.description}
                        </p>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                        Créé par {todo.user.name}
                    </div>
                </div>

                {todo.user.id === auth.user.id && (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTodo(todo)}
                        >
                            <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingTodo(todo.id)}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(client)}>
            <Head title={`${client.prenom} ${client.nom}`} />

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

                {/* En-tête avec informations principales */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg" />
                    <Card className="relative border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-3xl font-bold tracking-tight">
                                                {client.prenom} {client.nom}
                                            </h1>
                                            <Badge
                                                variant={client.actif ? 'default' : 'secondary'}
                                                className="text-sm"
                                            >
                                                {client.actif ? 'Actif' : 'Inactif'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Client depuis le {formatDate(client.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Euro className="h-4 w-4" />
                                                {formatPrice(stats.totalRevenue)} de CA
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FileText className="h-4 w-4" />
                                                {stats.totalQuotes} devis
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button variant="outline" size="sm">
                                        <Share className="mr-2 h-4 w-4" />
                                        Partager
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Exporter
                                    </Button>
                                    <Button asChild>
                                        <Link href={`/clients/${client.id}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Modifier
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Navigation par onglets */}
                <Card>
                    <CardHeader className="pb-0">
                        <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                            activeTab === tab.id
                                                ? 'bg-background text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </CardHeader>
                </Card>

                {/* Contenu des onglets */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Informations de contact et todolist */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Informations de contact
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Email</p>
                                                        <p className="text-sm text-muted-foreground">{client.email}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(client.email, 'Email')}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {client.telephone && (
                                            <div className="group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">Téléphone</p>
                                                            <p className="text-sm text-muted-foreground">{client.telephone}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(client.telephone!, 'Téléphone')}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {(client.adresse || client.ville) && (
                                        <>
                                            <Separator />
                                            <div className="group">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium">Adresse</p>
                                                            <div className="text-sm text-muted-foreground space-y-1">
                                                                {client.adresse && <div>{client.adresse}</div>}
                                                                {client.ville && (
                                                                    <div>
                                                                        {client.code_postal && `${client.code_postal} `}
                                                                        {client.ville}
                                                                        {client.pays && client.pays !== 'France' && `, ${client.pays}`}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            const address = [
                                                                client.adresse,
                                                                client.code_postal && client.ville ? `${client.code_postal} ${client.ville}` : client.ville,
                                                                client.pays && client.pays !== 'France' ? client.pays : null
                                                            ].filter(Boolean).join(', ');
                                                            copyToClipboard(address, 'Adresse');
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {client.entreprise && (
                                        <>
                                            <Separator />
                                            <div className="flex items-center gap-3">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">Entreprise</p>
                                                    <Link
                                                        href={`/entreprises/${client.entreprise.id}`}
                                                        className="text-sm text-primary hover:underline"
                                                    >
                                                        {client.entreprise.nom_commercial || client.entreprise.nom}
                                                    </Link>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {client.notes && (
                                        <>
                                            <Separator />
                                            <div>
                                                <p className="text-sm font-medium mb-2">Notes</p>
                                                <div className="bg-muted/50 rounded-lg p-3">
                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                        {client.notes}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Todolist */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <ListTodo className="h-5 w-5" />
                                            Tâches à faire ({todos.filter(t => !t.termine).length})
                                        </CardTitle>
                                        <Button
                                            size="sm"
                                            onClick={() => setIsCreatingTodo(true)}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Nouvelle tâche
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Formulaire de création/édition */}
                                    {isCreatingTodo && (
                                        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="todo-titre">Titre *</Label>
                                                    <Input
                                                        id="todo-titre"
                                                        value={todoForm.titre}
                                                        onChange={(e) => setTodoForm(prev => ({ ...prev, titre: e.target.value }))}
                                                        placeholder="Titre de la tâche..."
                                                        disabled={isSavingTodo}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="todo-priorite">Priorité</Label>
                                                        <select
                                                            id="todo-priorite"
                                                            value={todoForm.priorite}
                                                            onChange={(e) => setTodoForm(prev => ({ ...prev, priorite: e.target.value }))}
                                                            className="w-full px-3 py-2 border border-input rounded-md"
                                                            disabled={isSavingTodo}
                                                        >
                                                            {todoPrioritesOptions.map(option => (
                                                                <option key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="todo-echeance">Date d'échéance</Label>
                                                        <Input
                                                            id="todo-echeance"
                                                            type="date"
                                                            value={todoForm.date_echeance}
                                                            onChange={(e) => setTodoForm(prev => ({ ...prev, date_echeance: e.target.value }))}
                                                            disabled={isSavingTodo}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="todo-description">Description</Label>
                                                    <Textarea
                                                        id="todo-description"
                                                        value={todoForm.description}
                                                        onChange={(e) => setTodoForm(prev => ({ ...prev, description: e.target.value }))}
                                                        placeholder="Description de la tâche..."
                                                        rows={3}
                                                        disabled={isSavingTodo}
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={handleSaveTodo}
                                                        disabled={isSavingTodo}
                                                    >
                                                        {isSavingTodo ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Sauvegarde...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                {editingTodo ? 'Mettre à jour' : 'Créer'}
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={resetTodoForm}
                                                        disabled={isSavingTodo}
                                                    >
                                                        Annuler
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Liste des tâches avec drag & drop */}
                                    {todos.length > 0 ? (
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <SortableContext
                                                items={todos.map(todo => todo.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <div className="space-y-2">
                                                    {todos.map((todo) => (
                                                        <SortableTodoItem key={todo.id} todo={todo} />
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                                <ListTodo className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-lg font-medium mb-2">Aucune tâche</h3>
                                            <p className="text-muted-foreground mb-4">
                                                Commencez par créer votre première tâche pour ce client.
                                            </p>
                                            <Button onClick={() => setIsCreatingTodo(true)}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Créer une tâche
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Statistiques rapides */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Aperçu rapide
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                <span className="text-sm font-medium">CA Total</span>
                                            </div>
                                            <span className="font-bold text-green-700 dark:text-green-400">
                                                {formatPrice(stats.totalRevenue)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                <span className="text-sm font-medium">Devis acceptés</span>
                                            </div>
                                            <span className="font-bold text-blue-700 dark:text-blue-400">
                                                {stats.acceptedQuotes}/{stats.totalQuotes}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                                <span className="text-sm font-medium">Taux conversion</span>
                                            </div>
                                            <span className="font-bold text-orange-700 dark:text-orange-400">
                                                {stats.conversionRate.toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                                <span className="text-sm font-medium">Panier moyen</span>
                                            </div>
                                            <span className="font-bold text-purple-700 dark:text-purple-400">
                                                {formatPrice(stats.averageQuoteValue)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions rapides</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button className="w-full justify-start" asChild>
                                        <Link href={`/devis/create?client_id=${client.id}`}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Nouveau devis
                                        </Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" asChild>
                                        <Link href={`/clients/${client.id}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Modifier le client
                                        </Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start">
                                        <Mail className="mr-2 h-4 w-4" />
                                        Envoyer un email
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'quotes' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Devis ({client.devis.length})
                                </CardTitle>
                                <Button asChild>
                                    <Link href={`/devis/create?client_id=${client.id}`}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Nouveau devis
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {client.devis.length > 0 ? (
                                <div className="rounded-md border table-responsive">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Numéro</TableHead>
                                                <TableHead>Objet</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Statut</TableHead>
                                                <TableHead className="text-right">Montant</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {client.devis.map((devis) => (
                                                <TableRow key={devis.id} className="group">
                                                    <TableCell className="font-medium">
                                                        <Link
                                                            href={`/devis/${devis.id}`}
                                                            className="text-primary hover:underline"
                                                        >
                                                            {devis.numero_devis}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="max-w-xs truncate">
                                                            {devis.objet}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{formatDateShort(devis.date_devis)}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={getStatusVariant(devis.statut)}
                                                            className="flex items-center gap-1 w-fit"
                                                        >
                                                            {getStatusIcon(devis.statut)}
                                                            {formatStatut(devis.statut)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatPrice(devis.montant_ttc)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1 table-actions">
                                                            <Button size="sm" variant="ghost" asChild>
                                                                <Link href={`/devis/${devis.id}`}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button size="sm" variant="ghost" asChild>
                                                                <Link href={`/devis/${devis.id}/edit`}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button size="sm" variant="ghost">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <FileText className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-2">Aucun devis</h3>
                                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                        Ce client n'a pas encore de devis. Commencez par créer son premier devis.
                                    </p>
                                    <Button asChild>
                                        <Link href={`/devis/create?client_id=${client.id}`}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Créer un devis
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'stats' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Statistiques détaillées */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Devis</p>
                                        <p className="text-2xl font-bold">{stats.totalQuotes}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/20 rounded-lg flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm">
                                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                    <span className="text-green-600">+12% ce mois</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Devis Acceptés</p>
                                        <p className="text-2xl font-bold">{stats.acceptedQuotes}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-950/20 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm">
                                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                    <span className="text-green-600">+8% ce mois</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Taux de Conversion</p>
                                        <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/20 rounded-lg flex items-center justify-center">
                                        <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm">
                                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                                    <span className="text-red-600">-2% ce mois</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">CA Total</p>
                                        <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/20 rounded-lg flex items-center justify-center">
                                        <Euro className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm">
                                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                    <span className="text-green-600">+15% ce mois</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Répartition des statuts */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Répartition des devis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                                            <span className="text-sm">Acceptés</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{stats.acceptedQuotes}</span>
                                            <div className="w-20 h-2 bg-muted rounded-full">
                                                <div
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${stats.totalQuotes > 0 ? (stats.acceptedQuotes / stats.totalQuotes) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                            <span className="text-sm">En attente</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{stats.pendingQuotes}</span>
                                            <div className="w-20 h-2 bg-muted rounded-full">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${stats.totalQuotes > 0 ? (stats.pendingQuotes / stats.totalQuotes) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                                            <span className="text-sm">Refusés</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{stats.rejectedQuotes}</span>
                                            <div className="w-20 h-2 bg-muted rounded-full">
                                                <div
                                                    className="h-full bg-red-500 rounded-full"
                                                    style={{ width: `${stats.totalQuotes > 0 ? (stats.rejectedQuotes / stats.totalQuotes) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Informations supplémentaires */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Informations commerciales</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Panier moyen</p>
                                        <p className="text-lg font-semibold">{formatPrice(stats.averageQuoteValue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Dernier devis</p>
                                        <p className="text-lg font-semibold">
                                            {client.devis.length > 0
                                                ? formatDateShort(client.devis[0].date_devis)
                                                : 'Aucun'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Prochaines actions recommandées</p>
                                    <div className="space-y-2">
                                        {stats.pendingQuotes > 0 && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-orange-500" />
                                                <span>Relancer {stats.pendingQuotes} devis en attente</span>
                                            </div>
                                        )}
                                        {stats.totalQuotes === 0 && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <FileText className="h-4 w-4 text-blue-500" />
                                                <span>Créer le premier devis pour ce client</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-green-500" />
                                            <span>Envoyer une newsletter personnalisée</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'emails' && (
                    <div className="space-y-6">
                        {/* Composer un nouvel email */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Send className="h-5 w-5" />
                                        Nouvel email pour {client.prenom} {client.nom}
                                    </CardTitle>
                                    {!isComposingEmail && (
                                        <Button onClick={() => setIsComposingEmail(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Composer
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            {isComposingEmail && (
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span><strong>À :</strong> {client.email}</span>
                                        <span><strong>De :</strong> {auth.user.name}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email-subject">Objet</Label>
                                        <Input
                                            id="email-subject"
                                            value={emailForm.objet}
                                            onChange={(e) => setEmailForm(prev => ({ ...prev, objet: e.target.value }))}
                                            placeholder="Objet de l'email..."
                                            disabled={isSendingEmail}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email-content">Message</Label>
                                        <Textarea
                                            id="email-content"
                                            value={emailForm.contenu}
                                            onChange={(e) => setEmailForm(prev => ({ ...prev, contenu: e.target.value }))}
                                            placeholder="Tapez votre message ici..."
                                            rows={8}
                                            disabled={isSendingEmail}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={handleSendEmail}
                                            disabled={isSendingEmail}
                                        >
                                            {isSendingEmail ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Envoi en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Envoyer
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsComposingEmail(false);
                                                setEmailForm({ objet: '', contenu: '' });
                                            }}
                                            disabled={isSendingEmail}
                                        >
                                            Annuler
                                        </Button>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* Historique des emails */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Historique de mes emails
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Emails que vous avez envoyés à ce client ({userEmails.length})
                                </p>
                            </CardHeader>
                            <CardContent>
                                {userEmails.length > 0 ? (
                                    <div className="space-y-4">
                                        {userEmails.map((email) => (
                                            <div key={email.id} className="border rounded-lg p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <h4 className="font-medium">{email.objet}</h4>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <span>Envoyé le {formatEmailDate(email.date_envoi)}</span>
                                                            <Badge
                                                                variant={email.statut === 'envoye' ? 'default' : 'destructive'}
                                                                className="text-xs"
                                                            >
                                                                {email.statut === 'envoye' ? (
                                                                    <>
                                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                                        Envoyé
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="mr-1 h-3 w-3" />
                                                                        Échec
                                                                    </>
                                                                )}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-muted-foreground bg-muted/30 rounded p-3">
                                                    <p className="whitespace-pre-wrap">{email.contenu}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                        <h3 className="mt-4 text-lg font-medium">Aucun email envoyé</h3>
                                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                            Vous n'avez pas encore envoyé d'email à ce client. Commencez par composer votre premier message.
                                        </p>
                                        <Button onClick={() => setIsComposingEmail(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Composer un email
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'opportunities' && (
                    <div className="space-y-6">
                        {/* Créer une nouvelle opportunité */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        {editingOpportunity ? 'Modifier l\'opportunité' : 'Nouvelle opportunité'}
                                    </CardTitle>
                                    {!isCreatingOpportunity && (
                                        <Button onClick={() => setIsCreatingOpportunity(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Créer
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            {isCreatingOpportunity && (
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="opportunity-nom">Nom *</Label>
                                            <Input
                                                id="opportunity-nom"
                                                value={opportunityForm.nom}
                                                onChange={(e) => setOpportunityForm(prev => ({ ...prev, nom: e.target.value }))}
                                                placeholder="Nom de l'opportunité..."
                                                disabled={isSavingOpportunity}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="opportunity-etape">Étape *</Label>
                                            <select
                                                id="opportunity-etape"
                                                value={opportunityForm.etape}
                                                onChange={(e) => setOpportunityForm(prev => ({ ...prev, etape: e.target.value }))}
                                                className="w-full px-3 py-2 border border-input rounded-md"
                                                disabled={isSavingOpportunity}
                                            >
                                                {etapesOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="opportunity-probabilite">Probabilité (%)</Label>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        id="opportunity-probabilite"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={opportunityForm.probabilite}
                                                        onChange={(e) => setOpportunityForm(prev => ({ ...prev, probabilite: parseInt(e.target.value) || 0 }))}
                                                        disabled={isSavingOpportunity}
                                                        className="w-20"
                                                    />
                                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                                                                                                                <div className="w-full relative">
                                                                                                        <div
                                                        className="w-full bg-gray-200 rounded-full h-4 cursor-pointer select-none relative"
                                                        onMouseDown={handleMouseDown}
                                                        onMouseMove={handleJaugeDrag}
                                                        onMouseUp={handleMouseUp}
                                                        onMouseLeave={handleMouseLeave}
                                                    >
                                                        <div
                                                            className={`h-4 rounded-full transition-all duration-150 ${getProbabiliteColorClass(opportunityForm.probabilite)}`}
                                                            style={{ width: `${opportunityForm.probabilite}%` }}
                                                        ></div>
                                                        {/* Curseur interactif */}
                                                        <div
                                                            className="absolute top-1/2 w-5 h-5 transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 cursor-grab active:cursor-grabbing"
                                                            style={{ left: `${opportunityForm.probabilite}%` }}
                                                        >
                                                            <div className={`w-5 h-5 rounded-full border-3 border-white shadow-lg hover:scale-110 transition-transform ${getProbabiliteColorClass(opportunityForm.probabilite)}`}></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-muted-foreground mt-3">
                                                        <span>0%</span>
                                                        <span className={`font-medium ${
                                                            opportunityForm.probabilite <= 33 ? 'text-red-600' :
                                                            opportunityForm.probabilite <= 66 ? 'text-orange-600' :
                                                            'text-green-600'
                                                        }`}>
                                                            {opportunityForm.probabilite <= 33 ? 'Faible' :
                                                             opportunityForm.probabilite <= 66 ? 'Moyenne' :
                                                             'Élevée'}
                                                        </span>
                                                        <span>100%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="opportunity-montant">Montant estimé (€)</Label>
                                            <Input
                                                id="opportunity-montant"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={opportunityForm.montant}
                                                onChange={(e) => setOpportunityForm(prev => ({ ...prev, montant: e.target.value }))}
                                                placeholder="0.00"
                                                disabled={isSavingOpportunity}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="opportunity-date">Date de clôture prévue</Label>
                                        <Input
                                            id="opportunity-date"
                                            type="date"
                                            value={opportunityForm.date_cloture_prevue}
                                            onChange={(e) => setOpportunityForm(prev => ({ ...prev, date_cloture_prevue: e.target.value }))}
                                            disabled={isSavingOpportunity}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="opportunity-description">Description</Label>
                                        <Textarea
                                            id="opportunity-description"
                                            value={opportunityForm.description}
                                            onChange={(e) => setOpportunityForm(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Description de l'opportunité..."
                                            rows={3}
                                            disabled={isSavingOpportunity}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="opportunity-notes">Notes</Label>
                                        <Textarea
                                            id="opportunity-notes"
                                            value={opportunityForm.notes}
                                            onChange={(e) => setOpportunityForm(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="Notes internes..."
                                            rows={2}
                                            disabled={isSavingOpportunity}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={handleSaveOpportunity}
                                            disabled={isSavingOpportunity}
                                        >
                                            {isSavingOpportunity ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sauvegarde...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    {editingOpportunity ? 'Mettre à jour' : 'Créer'}
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={resetOpportunityForm}
                                            disabled={isSavingOpportunity}
                                        >
                                            Annuler
                                        </Button>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* Liste des opportunités */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Opportunités de {client.prenom} {client.nom}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Suivi des opportunités commerciales ({client.opportunities?.length || 0})
                                </p>
                            </CardHeader>
                            <CardContent>
                                {client.opportunities && client.opportunities.length > 0 ? (
                                    <div className="space-y-4">
                                        {client.opportunities.map((opportunity) => (
                                            <div key={opportunity.id} className="border rounded-lg p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="font-medium text-lg">{opportunity.nom}</h4>
                                                            <Badge
                                                                className={`text-xs`}
                                                                style={{
                                                                    backgroundColor: `var(--${getEtapeColor(opportunity.etape)}-100)`,
                                                                    color: `var(--${getEtapeColor(opportunity.etape)}-800)`,
                                                                    border: `1px solid var(--${getEtapeColor(opportunity.etape)}-200)`
                                                                }}
                                                            >
                                                                {etapesOptions.find(opt => opt.value === opportunity.etape)?.label}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <Percent className="h-4 w-4 flex-shrink-0" />
                                                                    <span className="text-sm font-medium">{opportunity.probabilite}%</span>
                                                                </div>
                                                                                                                                <div className="flex-1 min-w-[80px] relative">
                                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                                        <div
                                                                            className={`h-2 rounded-full transition-all duration-300 ${getProbabiliteColorClass(opportunity.probabilite)}`}
                                                                            style={{ width: `${opportunity.probabilite}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    {/* Curseur */}
                                                                    <div
                                                                        className="absolute top-0 w-3 h-3 -mt-0.5 transform -translate-x-1.5 transition-all duration-300"
                                                                        style={{ left: `${opportunity.probabilite}%` }}
                                                                    >
                                                                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-md ${getProbabiliteColorClass(opportunity.probabilite)}`}></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {opportunity.montant && (
                                                                <div className="flex items-center gap-1">
                                                                    <Euro className="h-4 w-4" />
                                                                    <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(opportunity.montant)}</span>
                                                                </div>
                                                            )}
                                                            {opportunity.date_cloture_prevue && (
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="h-4 w-4" />
                                                                    <span>Clôture prévue : {formatDateShort(opportunity.date_cloture_prevue)}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1">
                                                                <Users className="h-4 w-4" />
                                                                <span>{opportunity.user.name}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditOpportunity(opportunity)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteOpportunity(opportunity.id)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {opportunity.description && (
                                                    <div className="text-sm bg-muted/30 rounded p-3">
                                                        <p className="whitespace-pre-wrap">{opportunity.description}</p>
                                                    </div>
                                                )}

                                                {opportunity.notes && (
                                                    <div className="text-sm text-muted-foreground">
                                                        <strong>Notes :</strong> {opportunity.notes}
                                                    </div>
                                                )}

                                                <div className="text-xs text-muted-foreground border-t pt-2">
                                                    Créée le {formatDate(opportunity.created_at)}
                                                    {opportunity.updated_at !== opportunity.created_at && (
                                                        <> • Modifiée le {formatDate(opportunity.updated_at)}</>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Target className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                        <h3 className="mt-4 text-lg font-medium">Aucune opportunité</h3>
                                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                            Aucune opportunité n'a été créée pour ce client. Commencez par identifier et créer vos premières opportunités commerciales.
                                        </p>
                                        <Button onClick={() => setIsCreatingOpportunity(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Créer une opportunité
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'tickets' && (
                    <div className="space-y-6">
                        {/* Créer un nouveau ticket */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        {editingTicket ? 'Modifier le ticket' : 'Nouveau ticket'}
                                    </CardTitle>
                                    {!isCreatingTicket && (
                                        <Button onClick={() => setIsCreatingTicket(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Créer
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            {isCreatingTicket && (
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ticket-titre">Titre *</Label>
                                            <Input
                                                id="ticket-titre"
                                                value={ticketForm.titre}
                                                onChange={(e) => setTicketForm(prev => ({ ...prev, titre: e.target.value }))}
                                                placeholder="Titre du ticket..."
                                                disabled={isSavingTicket}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ticket-type">Type *</Label>
                                            <select
                                                id="ticket-type"
                                                value={ticketForm.type}
                                                onChange={(e) => setTicketForm(prev => ({ ...prev, type: e.target.value }))}
                                                className="w-full px-3 py-2 border border-input rounded-md"
                                                disabled={isSavingTicket}
                                            >
                                                {typesOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ticket-priorite">Priorité *</Label>
                                            <select
                                                id="ticket-priorite"
                                                value={ticketForm.priorite}
                                                onChange={(e) => setTicketForm(prev => ({ ...prev, priorite: e.target.value }))}
                                                className="w-full px-3 py-2 border border-input rounded-md"
                                                disabled={isSavingTicket}
                                            >
                                                {prioritesOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ticket-statut">Statut *</Label>
                                            <select
                                                id="ticket-statut"
                                                value={ticketForm.statut}
                                                onChange={(e) => setTicketForm(prev => ({ ...prev, statut: e.target.value }))}
                                                className="w-full px-3 py-2 border border-input rounded-md"
                                                disabled={isSavingTicket}
                                            >
                                                {statutsOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ticket-assignee">Assigné à *</Label>
                                            <select
                                                id="ticket-assignee"
                                                value={ticketForm.user_id}
                                                onChange={(e) => setTicketForm(prev => ({ ...prev, user_id: parseInt(e.target.value) }))}
                                                className="w-full px-3 py-2 border border-input rounded-md"
                                                disabled={isSavingTicket}
                                            >
                                                {users.map(user => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ticket-echeance">Date d'échéance</Label>
                                            <Input
                                                id="ticket-echeance"
                                                type="date"
                                                value={ticketForm.date_echeance}
                                                onChange={(e) => setTicketForm(prev => ({ ...prev, date_echeance: e.target.value }))}
                                                disabled={isSavingTicket}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ticket-temps-estime">Temps estimé (heures)</Label>
                                            <Input
                                                id="ticket-temps-estime"
                                                type="number"
                                                min="1"
                                                value={ticketForm.temps_estime}
                                                onChange={(e) => setTicketForm(prev => ({ ...prev, temps_estime: e.target.value }))}
                                                placeholder="Ex: 4"
                                                disabled={isSavingTicket}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ticket-description">Description *</Label>
                                        <Textarea
                                            id="ticket-description"
                                            value={ticketForm.description}
                                            onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Description détaillée du ticket..."
                                            rows={4}
                                            disabled={isSavingTicket}
                                        />
                                    </div>

                                    {/* Jauge de progression interactive */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Progression</Label>
                                            <span className={`text-sm font-medium px-2 py-1 rounded-full bg-${getProgressionColor(ticketForm.progression)}-100 text-${getProgressionColor(ticketForm.progression)}-800`}>
                                                {ticketForm.progression}%
                                            </span>
                                        </div>
                                        <div
                                            className="w-full bg-gray-200 rounded-full h-6 relative cursor-pointer group hover:bg-gray-300 transition-colors"
                                            onClick={handleProgressionJaugeClick}
                                            onMouseMove={handleProgressionJaugeDrag}
                                            onMouseDown={handleProgressionMouseDown}
                                            onMouseUp={handleProgressionMouseUp}
                                            onMouseLeave={handleProgressionMouseLeave}
                                        >
                                            <div
                                                className={`h-6 rounded-full transition-all duration-300 ${getProgressionColorClass(ticketForm.progression)} relative`}
                                                style={{ width: `${ticketForm.progression}%` }}
                                            >
                                                <div className="absolute right-0 top-0 w-3 h-6 bg-white rounded-full shadow-md border-2 border-gray-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 select-none">
                                                {ticketForm.progression <= 25 ? 'Faible' :
                                                 ticketForm.progression <= 50 ? 'Moyenne' :
                                                 ticketForm.progression <= 75 ? 'Bonne' : 'Excellente'}
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>0%</span>
                                            <span>25%</span>
                                            <span>50%</span>
                                            <span>75%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ticket-notes">Notes internes</Label>
                                        <Textarea
                                            id="ticket-notes"
                                            value={ticketForm.notes_internes}
                                            onChange={(e) => setTicketForm(prev => ({ ...prev, notes_internes: e.target.value }))}
                                            placeholder="Notes internes (non visibles par le client)..."
                                            rows={2}
                                            disabled={isSavingTicket}
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="ticket-visible"
                                            checked={ticketForm.visible_client}
                                            onChange={(e) => setTicketForm(prev => ({ ...prev, visible_client: e.target.checked }))}
                                            disabled={isSavingTicket}
                                            className="rounded"
                                        />
                                        <Label htmlFor="ticket-visible">Visible par le client</Label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={handleSaveTicket}
                                            disabled={isSavingTicket}
                                        >
                                            {isSavingTicket ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sauvegarde...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    {editingTicket ? 'Mettre à jour' : 'Créer'}
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={resetTicketForm}
                                            disabled={isSavingTicket}
                                        >
                                            Annuler
                                        </Button>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* Liste des tickets */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Tickets de {client.prenom} {client.nom}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Gestion des incidents et demandes ({client.tickets?.length || 0})
                                </p>
                            </CardHeader>
                            <CardContent>
                                {client.tickets && client.tickets.length > 0 ? (
                                    <div className="space-y-4">
                                        {client.tickets.map((ticket) => (
                                            <div key={ticket.id} className="border rounded-lg p-4 space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <h4 className="font-medium text-lg">{ticket.titre}</h4>
                                                            <div className="flex gap-2">
                                                                <Badge
                                                                    className={`text-xs bg-${getPrioriteColor(ticket.priorite)}-100 text-${getPrioriteColor(ticket.priorite)}-800 border-${getPrioriteColor(ticket.priorite)}-200`}
                                                                >
                                                                    {prioritesOptions.find(opt => opt.value === ticket.priorite)?.label}
                                                                </Badge>
                                                                <Badge
                                                                    className={`text-xs bg-${getStatutColor(ticket.statut)}-100 text-${getStatutColor(ticket.statut)}-800 border-${getStatutColor(ticket.statut)}-200`}
                                                                >
                                                                    {statutsOptions.find(opt => opt.value === ticket.statut)?.label}
                                                                </Badge>
                                                                <Badge
                                                                    className={`text-xs bg-${getTypeColor(ticket.type)}-100 text-${getTypeColor(ticket.type)}-800 border-${getTypeColor(ticket.type)}-200`}
                                                                >
                                                                    {typesOptions.find(opt => opt.value === ticket.type)?.label}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                                                                {/* Barre de progression */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span>Progression</span>
                                                <span className={`font-medium text-${getProgressionColor(getProgression(ticket))}-600`}>
                                                    {getProgression(ticket)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 relative cursor-pointer group">
                                                <div
                                                    className={`h-3 rounded-full transition-all duration-300 ${getProgressionColorClass(getProgression(ticket))}`}
                                                    style={{ width: `${getProgression(ticket)}%` }}
                                                ></div>
                                                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {getProgression(ticket) <= 25 ? 'Faible' :
                                                     getProgression(ticket) <= 50 ? 'Moyenne' :
                                                     getProgression(ticket) <= 75 ? 'Bonne' : 'Excellente'}
                                                </div>
                                            </div>
                                        </div>

                                                        <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                                                            <div className="flex items-center gap-1">
                                                                <UserCheck className="h-4 w-4" />
                                                                <span>Assigné à {ticket.user.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <User className="h-4 w-4" />
                                                                <span>Créé par {ticket.creator.name}</span>
                                                            </div>
                                                            {ticket.date_echeance && (
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="h-4 w-4" />
                                                                    <span>Échéance : {formatDateShort(ticket.date_echeance)}</span>
                                                                </div>
                                                            )}
                                                            {ticket.temps_estime && (
                                                                <div className="flex items-center gap-1">
                                                                    <Timer className="h-4 w-4" />
                                                                    <span>{ticket.temps_passe}h / {ticket.temps_estime}h</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 ml-4">
                                                        {ticket.statut === 'ouvert' || ticket.statut === 'en_cours' ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setResolvingTicket(ticket.id)}
                                                                className="text-green-600 hover:text-green-700"
                                                            >
                                                                <CheckSquare className="h-4 w-4" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleReopenTicket(ticket.id)}
                                                                className="text-blue-600 hover:text-blue-700"
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditTicket(ticket)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteTicket(ticket.id)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="text-sm bg-muted/30 rounded p-3">
                                                    <p className="whitespace-pre-wrap">{ticket.description}</p>
                                                </div>

                                                {ticket.solution && (
                                                    <div className="text-sm bg-green-50 border border-green-200 rounded p-3">
                                                        <p className="font-medium text-green-800 mb-1">Solution :</p>
                                                        <p className="text-green-700 whitespace-pre-wrap">{ticket.solution}</p>
                                                    </div>
                                                )}

                                                {ticket.notes_internes && (
                                                    <div className="text-sm text-muted-foreground">
                                                        <strong>Notes internes :</strong> {ticket.notes_internes}
                                                    </div>
                                                )}

                                                {/* Formulaire de résolution */}
                                                {resolvingTicket === ticket.id && (
                                                    <div className="border-t pt-4 space-y-3">
                                                        <Label htmlFor="solution">Solution *</Label>
                                                        <Textarea
                                                            id="solution"
                                                            value={resolutionForm.solution}
                                                            onChange={(e) => setResolutionForm({ solution: e.target.value })}
                                                            placeholder="Décrivez la solution apportée..."
                                                            rows={3}
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleResolveTicket(ticket.id)}
                                                            >
                                                                Marquer comme résolu
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setResolvingTicket(null);
                                                                    setResolutionForm({ solution: '' });
                                                                }}
                                                            >
                                                                Annuler
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="text-xs text-muted-foreground border-t pt-2">
                                                    Créé le {formatDate(ticket.created_at)}
                                                    {ticket.updated_at !== ticket.created_at && (
                                                        <> • Modifié le {formatDate(ticket.updated_at)}</>
                                                    )}
                                                    {ticket.date_resolution && (
                                                        <> • Résolu le {formatDate(ticket.date_resolution)}</>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                        <h3 className="mt-4 text-lg font-medium">Aucun ticket</h3>
                                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                            Aucun ticket n'a été créé pour ce client. Commencez par créer votre premier ticket d'incident ou de demande.
                                        </p>
                                        <Button onClick={() => setIsCreatingTicket(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Créer un ticket
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Modal de confirmation de suppression de tâche */}
            {deletingTodo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Supprimer la tâche</h3>
                                <p className="text-sm text-muted-foreground">
                                    Cette action est irréversible.
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-6">
                            Êtes-vous sûr de vouloir supprimer cette tâche ? Toutes les données associées seront définitivement perdues.
                        </p>

                        <div className="flex items-center gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setDeletingTodo(null)}
                            >
                                Annuler
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleDeleteTodo(deletingTodo)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
