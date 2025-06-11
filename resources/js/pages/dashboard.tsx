import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToastDemo } from '@/components/toast-demo';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Users, Building2, FileText, Receipt,
    AlertCircle, Database, RefreshCw, Plus, Eye, Euro,
    CheckCircle, Clock, XCircle, BarChart3, PieChart, Activity,
    Briefcase, Calendar, Filter, TrendingUp
} from 'lucide-react';
import { useState, useMemo } from 'react';
import {
    PieChart as RechartsPieChart,
    Cell,
    Pie,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line
} from 'recharts';

interface DashboardStats {
    clients: number;
    entreprises: number;
    devis: {
        total: number;
        brouillon: number;
        envoye: number;
        accepte: number;
        refuse: number;
        expire: number;
    };
    factures: {
        total: number;
        brouillon: number;
        envoyee: number;
        payee: number;
        en_retard: number;
        annulee: number;
        montant_total: number;
    };
}

interface DevisItem {
    id: number;
    statut: string;
    created_at: string;
}

interface FactureItem {
    id: number;
    statut: string;
    montant_ttc: number;
    created_at: string;
}

interface Props {
    stats: DashboardStats;
    devis_data?: DevisItem[];
    factures_data?: FactureItem[];
    isLocal: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Couleurs pour les graphiques
const COLORS = {
    devis: {
        brouillon: '#6b7280', // gray-500
        envoye: '#3b82f6',    // blue-500
        accepte: '#10b981',   // emerald-500
        refuse: '#ef4444',    // red-500
        expire: '#f59e0b',    // amber-500
    },
    factures: {
        brouillon: '#eab308', // yellow-500
        envoyee: '#3b82f6',   // blue-500
        payee: '#10b981',     // emerald-500
        en_retard: '#ef4444', // red-500
        annulee: '#6b7280',   // gray-500
    }
};

// Fonctions utilitaires déclarées en dehors du composant
const formatStatut = (type: 'devis' | 'facture', statut: string) => {
    if (type === 'devis') {
        switch (statut) {
            case 'brouillon': return 'Brouillon';
            case 'envoye': return 'Envoyé';
            case 'accepte': return 'Accepté';
            case 'refuse': return 'Refusé';
            case 'expire': return 'Expiré';
            default: return statut;
        }
    } else {
        switch (statut) {
            case 'brouillon': return 'Brouillon';
            case 'envoyee': return 'Envoyée';
            case 'payee': return 'Payée';
            case 'en_retard': return 'En retard';
            case 'annulee': return 'Annulée';
            default: return statut;
        }
    }
};

const getStatusStyles = (type: 'devis' | 'facture', statut: string) => {
    if (type === 'devis') {
        switch (statut) {
            case 'brouillon': return 'bg-gray-600 text-white hover:bg-gray-700';
            case 'envoye': return 'bg-blue-600 text-white hover:bg-blue-700';
            case 'accepte': return 'bg-green-600 text-white hover:bg-green-700';
            case 'refuse': return 'bg-red-600 text-white hover:bg-red-700';
            case 'expire': return 'bg-orange-600 text-white hover:bg-orange-700';
            default: return 'bg-gray-600 text-white hover:bg-gray-700';
        }
    } else {
        switch (statut) {
            case 'brouillon': return 'bg-yellow-600 text-white hover:bg-yellow-700';
            case 'envoyee': return 'bg-blue-600 text-white hover:bg-blue-700';
            case 'payee': return 'bg-green-600 text-white hover:bg-green-700';
            case 'en_retard': return 'bg-red-600 text-white hover:bg-red-700';
            case 'annulee': return 'bg-gray-600 text-white hover:bg-gray-700';
            default: return 'bg-gray-600 text-white hover:bg-gray-700';
        }
    }
};

const getStatusIcon = (type: 'devis' | 'facture', statut: string) => {
    if (type === 'devis') {
        switch (statut) {
            case 'accepte': return <CheckCircle className="h-4 w-4" />;
            case 'envoye': return <Clock className="h-4 w-4" />;
            case 'refuse': return <XCircle className="h-4 w-4" />;
            case 'expire': return <AlertCircle className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    } else {
        switch (statut) {
            case 'payee': return <CheckCircle className="h-4 w-4" />;
            case 'envoyee': return <Clock className="h-4 w-4" />;
            case 'en_retard': return <AlertCircle className="h-4 w-4" />;
            case 'annulee': return <XCircle className="h-4 w-4" />;
            default: return <Receipt className="h-4 w-4" />;
        }
    }
};

export default function Dashboard({ stats, devis_data = [], factures_data = [], isLocal }: Props) {
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const { post } = useForm();

    // Filtres temporels
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() retourne 0-11
    const currentYear = currentDate.getFullYear();

    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [filterType, setFilterType] = useState<'month' | 'year'>('month');

    // Générer les options d'années (année actuelle et 4 années précédentes)
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

    // Options des mois
    const monthOptions = [
        { value: 1, label: 'Janvier' },
        { value: 2, label: 'Février' },
        { value: 3, label: 'Mars' },
        { value: 4, label: 'Avril' },
        { value: 5, label: 'Mai' },
        { value: 6, label: 'Juin' },
        { value: 7, label: 'Juillet' },
        { value: 8, label: 'Août' },
        { value: 9, label: 'Septembre' },
        { value: 10, label: 'Octobre' },
        { value: 11, label: 'Novembre' },
        { value: 12, label: 'Décembre' },
    ];

    // Fonction pour filtrer les données par période
    const filterDataByPeriod = (data: any[], dateField: string = 'created_at') => {
        return data.filter(item => {
            const itemDate = new Date(item[dateField]);
            const itemYear = itemDate.getFullYear();
            const itemMonth = itemDate.getMonth() + 1;

            if (filterType === 'year') {
                return itemYear === selectedYear;
            } else {
                return itemYear === selectedYear && itemMonth === selectedMonth;
            }
        });
    };

    // Statistiques filtrées
    const filteredStats = useMemo(() => {
        const filteredDevis = filterDataByPeriod(devis_data);
        const filteredFactures = filterDataByPeriod(factures_data);

        return {
            clients: stats.clients, // Les clients ne sont pas filtrés par période
            entreprises: stats.entreprises, // Les entreprises ne sont pas filtrées par période
            devis: {
                total: filteredDevis.length,
                brouillon: filteredDevis.filter(d => d.statut === 'brouillon').length,
                envoye: filteredDevis.filter(d => d.statut === 'envoye').length,
                accepte: filteredDevis.filter(d => d.statut === 'accepte').length,
                refuse: filteredDevis.filter(d => d.statut === 'refuse').length,
                expire: filteredDevis.filter(d => d.statut === 'expire').length,
            },
            factures: {
                total: filteredFactures.length,
                brouillon: filteredFactures.filter(f => f.statut === 'brouillon').length,
                envoyee: filteredFactures.filter(f => f.statut === 'envoyee').length,
                payee: filteredFactures.filter(f => f.statut === 'payee').length,
                en_retard: filteredFactures.filter(f => f.statut === 'en_retard').length,
                annulee: filteredFactures.filter(f => f.statut === 'annulee').length,
                montant_total: filteredFactures.reduce((sum, f) => sum + (f.montant_ttc || 0), 0),
            }
        };
    }, [devis_data, factures_data, selectedMonth, selectedYear, filterType]);

    // Données pour les graphiques
    const devisChartData = useMemo(() => {
        return Object.entries(filteredStats.devis)
            .filter(([key]) => key !== 'total' && filteredStats.devis[key as keyof typeof filteredStats.devis] > 0)
            .map(([status, value]) => ({
                name: formatStatut('devis', status),
                value: value as number,
                fill: COLORS.devis[status as keyof typeof COLORS.devis] || '#6b7280'
            }));
    }, [filteredStats.devis]);

    const facturesChartData = useMemo(() => {
        return Object.entries(filteredStats.factures)
            .filter(([key]) => !['total', 'montant_total'].includes(key) && filteredStats.factures[key as keyof typeof filteredStats.factures] > 0)
            .map(([status, value]) => ({
                name: formatStatut('facture', status),
                value: value as number,
                fill: COLORS.factures[status as keyof typeof COLORS.factures] || '#6b7280'
            }));
    }, [filteredStats.factures]);

    // Données d'évolution mensuelle
    const evolutionData = useMemo(() => {
        const monthlyData = [];
        const currentYear = new Date().getFullYear();

        for (let month = 1; month <= 12; month++) {
            const monthDevis = devis_data.filter(d => {
                const date = new Date(d.created_at);
                return date.getFullYear() === currentYear && date.getMonth() + 1 === month;
            });

            const monthFactures = factures_data.filter(f => {
                const date = new Date(f.created_at);
                return date.getFullYear() === currentYear && date.getMonth() + 1 === month;
            });

            const monthName = monthOptions.find(m => m.value === month)?.label.substring(0, 3);

            monthlyData.push({
                month: monthName,
                devis: monthDevis.length,
                factures: monthFactures.length,
                ca: monthFactures.reduce((sum, f) => sum + (f.montant_ttc || 0), 0),
            });
        }

        return monthlyData;
    }, [devis_data, factures_data, monthOptions]);

    const handleDevAction = (action: string, route: string) => {
        if (confirm(`Êtes-vous sûr de vouloir ${action} ?`)) {
            setLoadingAction(action);
            post(route, {
                onFinish: () => setLoadingAction(null)
            });
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    // Calculs pour les métriques avancées (utiliser filteredStats)
    const tauxAcceptationDevis = filteredStats.devis.total > 0
        ? Math.round((filteredStats.devis.accepte / filteredStats.devis.total) * 100)
        : 0;

    const tauxPaiementFactures = filteredStats.factures.total > 0
        ? Math.round((filteredStats.factures.payee / filteredStats.factures.total) * 100)
        : 0;

    const montantEncaisse = filteredStats.factures.montant_total * (filteredStats.factures.payee / (filteredStats.factures.total || 1));

    // Titre de la période sélectionnée
    const getPeriodTitle = () => {
        if (filterType === 'year') {
            return `Année ${selectedYear}`;
        } else {
            const monthName = monthOptions.find(m => m.value === selectedMonth)?.label;
            return `${monthName} ${selectedYear}`;
        }
    };

    // Composant Tooltip personnalisé
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <p className="font-medium">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }}>
                            {`${entry.dataKey}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">

                {/* En-tête */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Tableau de bord
                        </h1>
                        <p className="text-muted-foreground">
                            Aperçu de votre activité commerciale et performance
                        </p>
                    </div>

                    {/* Boutons de développement - seulement en mode local */}
                    {isLocal && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDevAction('reset des données (garder utilisateur)', '/dev/reset-keep-user')}
                                disabled={loadingAction !== null}
                                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                            >
                                {loadingAction === 'reset des données (garder utilisateur)' ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Database className="mr-2 h-4 w-4" />
                                )}
                                Reset données
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDevAction('reset complet (tout supprimer)', '/dev/reset-all')}
                                disabled={loadingAction !== null}
                            >
                                {loadingAction === 'reset complet (tout supprimer)' ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Reset tout
                            </Button>
                        </div>
                    )}
                </div>

                {/* Filtres temporels */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-blue-600" />
                            Période d'analyse - {getPeriodTitle()}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">Filtrer par :</label>
                                <Select value={filterType} onValueChange={(value: 'month' | 'year') => setFilterType(value)}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="month">Mois</SelectItem>
                                        <SelectItem value="year">Année</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {yearOptions.map(year => (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {filterType === 'month' && (
                                <div className="flex items-center gap-2">
                                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number(value))}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {monthOptions.map(month => (
                                                <SelectItem key={month.value} value={month.value.toString()}>
                                                    {month.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex-1" />

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSelectedMonth(currentMonth);
                                    setSelectedYear(currentYear);
                                    setFilterType('month');
                                }}
                            >
                                Revenir au mois actuel
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Métriques principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Clients totaux</p>
                                    <div className="text-3xl font-bold text-blue-600">
                                        {filteredStats.clients}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {filteredStats.entreprises} entreprises
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Devis {filterType === 'month' ? 'du mois' : 'de l\'année'}</p>
                                    <div className="text-3xl font-bold text-orange-600">
                                        {filteredStats.devis.total}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {tauxAcceptationDevis}% acceptés
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Factures {filterType === 'month' ? 'du mois' : 'de l\'année'}</p>
                                    <div className="text-3xl font-bold text-green-600">
                                        {filteredStats.factures.total}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {tauxPaiementFactures}% payées
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                    <Receipt className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">CA {filterType === 'month' ? 'du mois' : 'de l\'année'}</p>
                                    <div className="text-2xl font-bold text-purple-600">
                                        {formatPrice(filteredStats.factures.montant_total)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatPrice(montantEncaisse)} encaissé
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                    <Euro className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
                        </CardContent>
                    </Card>
                </div>

                {/* Alerte factures en retard */}
                {filteredStats.factures.en_retard > 0 && (
                    <Card className="border-red-200 bg-red-50 dark:bg-red-950/50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <div className="flex-1">
                                    <h4 className="font-medium text-red-900 dark:text-red-100">
                                        Attention aux retards de paiement
                                    </h4>
                                    <p className="text-sm text-red-700 dark:text-red-200">
                                        {filteredStats.factures.en_retard} facture(s) en retard {filterType === 'month' ? 'ce mois-ci' : 'cette année'}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" asChild className="border-red-200 text-red-700 hover:bg-red-100">
                                    <Link href="/factures?status=en_retard">
                                        Voir les factures
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Graphiques de répartition */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Graphique Devis */}
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <PieChart className="h-5 w-5 text-orange-600" />
                                Répartition des devis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {devisChartData.length > 0 ? (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={devisChartData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {devisChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Aucun devis pour cette période</p>
                                    </div>
                                </div>
                            )}

                            <Separator className="my-4" />

                            <Button variant="outline" size="sm" asChild className="w-full">
                                <Link href="/devis">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir tous les devis
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Graphique Factures */}
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-green-600" />
                                Répartition des factures
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {facturesChartData.length > 0 ? (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={facturesChartData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {facturesChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Aucune facture pour cette période</p>
                                    </div>
                                </div>
                            )}

                            <Separator className="my-4" />

                            <Button variant="outline" size="sm" asChild className="w-full">
                                <Link href="/factures">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir toutes les factures
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Graphique d'évolution annuelle */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-purple-600" />
                            Évolution de l'activité ({currentYear})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={evolutionData}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis
                                        dataKey="month"
                                        className="text-sm"
                                    />
                                    <YAxis className="text-sm" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar
                                        dataKey="devis"
                                        name="Devis"
                                        fill="#f59e0b"
                                        radius={[2, 2, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="factures"
                                        name="Factures"
                                        fill="#10b981"
                                        radius={[2, 2, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions rapides */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-600" />
                            Actions rapides
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <Button asChild variant="outline" className="h-auto p-4">
                                <Link href="/clients/create">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                            <Plus className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Nouveau client</div>
                                            <div className="text-sm text-muted-foreground">Ajouter un client</div>
                                        </div>
                                    </div>
                                </Link>
                            </Button>

                            <Button asChild variant="outline" className="h-auto p-4">
                                <Link href="/entreprises/create">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                            <Building2 className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Nouvelle entreprise</div>
                                            <div className="text-sm text-muted-foreground">Créer une entreprise</div>
                                        </div>
                                    </div>
                                </Link>
                            </Button>

                            <Button asChild variant="outline" className="h-auto p-4">
                                <Link href="/devis/create">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-orange-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Nouveau devis</div>
                                            <div className="text-sm text-muted-foreground">Créer un devis</div>
                                        </div>
                                    </div>
                                </Link>
                            </Button>

                            <Button asChild variant="outline" className="h-auto p-4">
                                <Link href="/factures/create">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                            <Receipt className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Nouvelle facture</div>
                                            <div className="text-sm text-muted-foreground">Émettre une facture</div>
                                        </div>
                                    </div>
                                </Link>
                            </Button>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/clients">
                                    <Users className="mr-2 h-3 w-3" />
                                    Clients
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/entreprises">
                                    <Briefcase className="mr-2 h-3 w-3" />
                                    Entreprises
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Démonstration des toasts Sonner */}
                <ToastDemo />
            </div>
        </AppLayout>
    );
}
