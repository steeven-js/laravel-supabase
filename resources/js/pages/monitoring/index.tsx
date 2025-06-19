import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    Activity,
    Database,
    Mail,
    Server,
    Settings,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Trash2,
    RefreshCw,
    Monitor,
    Globe,
    HardDrive,
    Cpu,
    Info,
    Eye,
    FileText,
    Clock
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface Diagnostics {
    php: {
        version: string;
        extensions: Record<string, boolean>;
    };
    laravel: {
        version: string;
        environment: string;
        debug_mode: boolean;
        timezone: string;
    };
    database: {
        status: string;
        driver?: string;
        host?: string;
        database?: string;
        port?: number;
        message?: string;
    };
    mail: {
        driver: string;
        host: string;
        port: number;
        from_address: string;
        from_name: string;
    };
    storage: {
        logs_writable: boolean;
        cache_writable: boolean;
        disk_space: {
            total: number;
            free: number;
        };
    };
    environment: {
        app_url: string;
        app_env: string;
        app_debug: boolean;
        supabase_url: string;
        supabase_db: string;
    };
}

interface Props {
    diagnostics: Diagnostics;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Monitoring & Tests',
        href: '/monitoring',
    },
];

export default function MonitoringIndex({ diagnostics }: Props) {
    const [testResults, setTestResults] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [emailLogs, setEmailLogs] = useState<any[]>([]);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [logLines, setLogLines] = useState(150); // Augmenter à 150 par défaut

    const { data, setData } = useForm({
        email: diagnostics.mail.from_address,
    });

    const runTest = async (testType: string, endpoint: string, payload?: any) => {
        setLoading(prev => ({ ...prev, [testType]: true }));

        try {
            const response = await fetch(`/admin/monitoring/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(payload || {}),
            });

            const result = await response.json();
            setTestResults(prev => ({ ...prev, [testType]: result }));

            // Actualiser les logs après un test d'email
            if (testType === 'email') {
                await loadEmailLogs();
            }
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                [testType]: {
                    success: false,
                    message: 'Erreur de connexion : ' + (error instanceof Error ? error.message : String(error)),
                    timestamp: new Date().toLocaleString('fr-FR')
                }
            }));
        } finally {
            setLoading(prev => ({ ...prev, [testType]: false }));
        }
    };

    // Charger les logs d'emails
    const loadEmailLogs = async (lines?: number) => {
        const linesToLoad = lines || logLines;
        try {
            setLoading(prev => ({ ...prev, emailLogs: true }));
            const response = await fetch(`/admin/monitoring/email-logs?lines=${linesToLoad}`);
            const result = await response.json();

            if (result.success) {
                setEmailLogs(result.logs);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des logs:', error);
        } finally {
            setLoading(prev => ({ ...prev, emailLogs: false }));
        }
    };

    // Nettoyer les anciens logs
    const cleanEmailLogs = async (days = 7) => {
        try {
            setLoading(prev => ({ ...prev, cleanLogs: true }));
            const response = await fetch('/admin/monitoring/clean-email-logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ days }),
            });

            const result = await response.json();
            if (result.success) {
                await loadEmailLogs();
            }
        } catch (error) {
            console.error('Erreur lors du nettoyage:', error);
        } finally {
            setLoading(prev => ({ ...prev, cleanLogs: false }));
        }
    };

    // Auto-refresh des logs
    useEffect(() => {
        loadEmailLogs(); // Charger au montage

        if (autoRefresh) {
            const interval = setInterval(() => {
                loadEmailLogs();
            }, 5000); // Refresh toutes les 5 secondes

            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    // Formater les niveaux de log pour le style
    const getLogLevelStyle = (level: string) => {
        switch (level) {
            case 'SUCCESS':
                return 'text-green-700 bg-green-50 border-green-200';
            case 'ERROR':
                return 'text-red-700 bg-red-50 border-red-200';
            case 'WARNING':
                return 'text-yellow-700 bg-yellow-50 border-yellow-200';
            case 'INFO':
                return 'text-blue-700 bg-blue-50 border-blue-200';
            default:
                return 'text-gray-700 bg-gray-50 border-gray-200';
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStatusIcon = (status: boolean) => {
        return status ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
            <XCircle className="w-4 h-4 text-red-600" />
        );
    };

    const getStatusBadge = (status: boolean, trueText = 'OK', falseText = 'Erreur') => {
        return (
            <Badge
                variant={status ? 'success' : 'destructive'}
                className={status ? '' : 'text-white bg-red-600 hover:bg-red-700 border-red-600'}
            >
                {status ? trueText : falseText}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monitoring & Tests" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Monitor className="w-8 h-8" />
                    <div>
                        <h1 className="text-2xl font-bold">Monitoring & Tests</h1>
                        <p className="text-muted-foreground">
                            Surveillance système et outils de test pour l'environnement local
                        </p>
                    </div>
                </div>

                <TooltipProvider>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* PHP Info */}
                        <Card className="h-fit">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">PHP</CardTitle>
                                <Cpu className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mb-3">{diagnostics.php.version}</div>
                                <div className="space-y-2">
                                    <div className="text-xs font-medium text-muted-foreground mb-1">Extensions:</div>
                                    {Object.entries(diagnostics.php.extensions).map(([ext, loaded]) => (
                                        <div key={ext} className="flex items-center justify-between text-sm py-1">
                                            <span className="font-medium">{ext}</span>
                                            <div className="flex items-center gap-1">
                                                {getStatusIcon(loaded)}
                                                <span className="text-xs">{loaded ? 'Chargé' : 'Absent'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Laravel Info */}
                        <Card className="h-fit">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Laravel</CardTitle>
                                <Settings className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mb-3">{diagnostics.laravel.version}</div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm font-medium">Environnement</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {diagnostics.laravel.environment}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm font-medium">Mode Debug</span>
                                        {getStatusBadge(diagnostics.laravel.debug_mode, 'Activé', 'Désactivé')}
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm font-medium">Fuseau horaire</span>
                                        <span className="text-sm text-muted-foreground">{diagnostics.laravel.timezone}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Database Status */}
                        <Card className="h-fit">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Base de données</CardTitle>
                                <Database className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="mb-3">
                                    {getStatusBadge(diagnostics.database.status === 'connected', 'Connecté', 'Erreur')}
                                </div>
                                {diagnostics.database.status === 'connected' ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between py-1">
                                            <span className="text-sm font-medium">Driver</span>
                                            <span className="text-sm text-muted-foreground">{diagnostics.database.driver}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1">
                                            <span className="text-sm font-medium">Host</span>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 cursor-help">
                                                        <span className="text-sm text-muted-foreground max-w-32 truncate">
                                                            {diagnostics.database.host}
                                                        </span>
                                                        <Info className="h-3 w-3" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="max-w-xs break-all">{diagnostics.database.host}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <div className="flex items-center justify-between py-1">
                                            <span className="text-sm font-medium">Base</span>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 cursor-help">
                                                        <span className="text-sm text-muted-foreground max-w-32 truncate">
                                                            {diagnostics.database.database}
                                                        </span>
                                                        <Info className="h-3 w-3" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="max-w-xs break-all">{diagnostics.database.database}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        {diagnostics.database.port && (
                                            <div className="flex items-center justify-between py-1">
                                                <span className="text-sm font-medium">Port</span>
                                                <span className="text-sm text-muted-foreground">{diagnostics.database.port}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                                        <div className="text-sm text-red-700 break-words">
                                            {diagnostics.database.message}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Storage Info */}
                        <Card className="h-fit">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Stockage</CardTitle>
                                <HardDrive className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mb-3 text-green-600">
                                    {formatBytes(diagnostics.storage.disk_space.free)}
                                </div>
                                <div className="space-y-2">
                                    <div className="text-xs font-medium text-muted-foreground mb-1">Disponible</div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm font-medium">Espace total</span>
                                        <span className="text-sm text-muted-foreground">{formatBytes(diagnostics.storage.disk_space.total)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{
                                                width: `${((diagnostics.storage.disk_space.total - diagnostics.storage.disk_space.free) / diagnostics.storage.disk_space.total * 100)}%`
                                            }}
                                        ></div>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm font-medium">Logs</span>
                                        <div className="flex items-center gap-1">
                                            {getStatusIcon(diagnostics.storage.logs_writable)}
                                            <span className="text-xs">{diagnostics.storage.logs_writable ? 'Écriture OK' : 'Lecture seule'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm font-medium">Cache</span>
                                        <div className="flex items-center gap-1">
                                            {getStatusIcon(diagnostics.storage.cache_writable)}
                                            <span className="text-xs">{diagnostics.storage.cache_writable ? 'Écriture OK' : 'Lecture seule'}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Mail Config */}
                        <Card className="h-fit">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Configuration Email</CardTitle>
                                <Mail className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mb-3">{diagnostics.mail.driver}</div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm font-medium">Serveur</span>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center gap-1 cursor-help">
                                                    <span className="text-sm text-muted-foreground max-w-32 truncate">
                                                        {diagnostics.mail.host}
                                                    </span>
                                                    <Info className="h-3 w-3" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs break-all">{diagnostics.mail.host}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm font-medium">Port</span>
                                        <span className="text-sm text-muted-foreground">{diagnostics.mail.port}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm font-medium">Expéditeur</span>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center gap-1 cursor-help">
                                                    <span className="text-sm text-muted-foreground max-w-32 truncate">
                                                        {diagnostics.mail.from_address}
                                                    </span>
                                                    <Info className="h-3 w-3" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs break-all">{diagnostics.mail.from_address}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm font-medium">Nom</span>
                                        <span className="text-sm text-muted-foreground max-w-32 truncate" title={diagnostics.mail.from_name}>
                                            {diagnostics.mail.from_name}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Environment */}
                        <Card className="h-fit">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Environnement</CardTitle>
                                <Globe className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mb-3">
                                    <Badge
                                        variant={diagnostics.environment.app_env === 'production' ? 'destructive' : 'secondary'}
                                        className={diagnostics.environment.app_env === 'production' ? 'text-white bg-red-600 hover:bg-red-700 border-red-600' : ''}
                                    >
                                        {diagnostics.environment.app_env.toUpperCase()}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm font-medium">URL App</span>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center gap-1 cursor-help">
                                                    <span className="text-sm text-muted-foreground max-w-32 truncate">
                                                        {diagnostics.environment.app_url}
                                                    </span>
                                                    <Info className="h-3 w-3" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs break-all">{diagnostics.environment.app_url}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm font-medium">Debug</span>
                                        {getStatusBadge(diagnostics.environment.app_debug, 'Activé', 'Désactivé')}
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm font-medium">Supabase</span>
                                        <div className="flex items-center gap-1">
                                            {getStatusIcon(!!diagnostics.environment.supabase_url)}
                                            <span className="text-xs">
                                                {diagnostics.environment.supabase_url ? 'Configuré' : 'Non configuré'}
                                            </span>
                                        </div>
                                    </div>
                                    {diagnostics.environment.supabase_url && (
                                        <div className="flex items-center justify-between py-1">
                                            <span className="text-sm font-medium">URL Supabase</span>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 cursor-help">
                                                        <span className="text-sm text-muted-foreground max-w-24 truncate">
                                                            {diagnostics.environment.supabase_url}
                                                        </span>
                                                        <Info className="h-3 w-3" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="max-w-xs break-all">{diagnostics.environment.supabase_url}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TooltipProvider>

                {/* Tests Section */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Tests et Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Test Email */}
                        <div className="space-y-3">
                            <h3 className="font-semibold">Test d'envoi d'email</h3>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label htmlFor="email">Adresse email de test</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        onClick={() => runTest('email', 'test-email', { email: data.email })}
                                        disabled={loading.email}
                                        className="flex items-center gap-2"
                                    >
                                        {loading.email ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Mail className="w-4 h-4" />
                                        )}
                                        Tester l'email
                                    </Button>
                                </div>
                            </div>
                            {testResults.email && (
                                <div className={`p-3 rounded-md ${testResults.email.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                    <div className="flex items-center gap-2">
                                        {testResults.email.success ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                        <span className="font-medium break-words">{testResults.email.message}</span>
                                    </div>
                                    {testResults.email.details && (
                                        <div className="mt-2 text-xs space-y-1">
                                            <div>Driver: {testResults.email.details.driver}</div>
                                            <div>Format: {testResults.email.details.format}</div>
                                            <div>Template: {testResults.email.details.template}</div>
                                        </div>
                                    )}
                                    <div className="text-xs mt-1">
                                        {testResults.email.timestamp}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Test Database */}
                        <div className="space-y-3">
                            <h3 className="font-semibold">Test de connexion base de données</h3>
                            <Button
                                onClick={() => runTest('database', 'test-database')}
                                disabled={loading.database}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                {loading.database ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Database className="w-4 h-4" />
                                )}
                                Tester la base de données
                            </Button>
                            {testResults.database && (
                                <div className={`p-3 rounded-md ${testResults.database.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                    <div className="flex items-center gap-2">
                                        {testResults.database.success ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                        <span className="font-medium break-words">{testResults.database.message}</span>
                                    </div>
                                    {testResults.database.details && (
                                        <div className="mt-2 text-xs space-y-1">
                                            <div>Driver: {testResults.database.details.driver}</div>
                                            <div>Tables: {testResults.database.details.tables_count}</div>
                                            <div>Base: {testResults.database.details.connection_name}</div>
                                        </div>
                                    )}
                                    <div className="text-xs mt-1">
                                        {testResults.database.timestamp}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Clear Cache */}
                        <div className="space-y-3">
                            <h3 className="font-semibold">Effacer le cache</h3>
                            <Button
                                onClick={() => runTest('cache', 'clear-cache')}
                                disabled={loading.cache}
                                variant="destructive"
                                className="flex items-center gap-2"
                            >
                                {loading.cache ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Effacer tous les caches
                            </Button>
                            {testResults.cache && (
                                <div className={`p-3 rounded-md ${testResults.cache.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                    <div className="flex items-center gap-2">
                                        {testResults.cache.success ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                        <span className="font-medium break-words">{testResults.cache.message}</span>
                                    </div>
                                    <div className="text-xs mt-1">
                                        {testResults.cache.timestamp}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Logs d'envoi d'emails */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Logs d'envoi d'emails
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Contrôles des logs */}
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                    onClick={() => loadEmailLogs()}
                                    disabled={loading.emailLogs}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    {loading.emailLogs ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                    Actualiser
                                </Button>

                                <Button
                                    onClick={() => cleanEmailLogs()}
                                    disabled={loading.cleanLogs}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    {loading.cleanLogs ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    Nettoyer
                                </Button>

                                {/* Sélecteur de nombre de lignes */}
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="logLines" className="text-sm whitespace-nowrap">Lignes:</Label>
                                    <select
                                        id="logLines"
                                        value={logLines}
                                        onChange={(e) => {
                                            const newLines = parseInt(e.target.value);
                                            setLogLines(newLines);
                                            loadEmailLogs(newLines);
                                        }}
                                        className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                        <option value={150}>150</option>
                                        <option value={200}>200</option>
                                        <option value={300}>300</option>
                                        <option value={500}>500</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={autoRefresh}
                                        onChange={(e) => setAutoRefresh(e.target.checked)}
                                        className="rounded"
                                    />
                                    <Clock className="w-4 h-4" />
                                    Auto-actualisation
                                </label>
                            </div>
                        </div>

                        {/* Affichage des logs */}
                        <div className="max-h-96 overflow-y-auto border rounded-lg">
                            {loading.emailLogs ? (
                                <div className="flex items-center justify-center p-8">
                                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                                    <span>Chargement des logs...</span>
                                </div>
                            ) : emailLogs.length === 0 ? (
                                <div className="flex items-center justify-center p-8 text-muted-foreground">
                                    <FileText className="w-6 h-6 mr-2" />
                                    <span>Aucun log d'email trouvé</span>
                                </div>
                            ) : (
                                <div className="space-y-1 p-2">
                                    {emailLogs.map((log, index) => {
                                        const isSession = log.formatted?.isSession;
                                        const isSeparator = log.formatted?.isSeparator;
                                        const hasIcon = log.formatted?.hasIcon;

                                        if (isSeparator) {
                                            return (
                                                <div key={index} className="text-gray-400 font-mono text-xs py-1">
                                                    {log.raw}
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={index}
                                                className={`text-xs font-mono p-2 rounded border-l-4 ${
                                                    isSession
                                                        ? 'bg-purple-50 border-purple-400 text-purple-800'
                                                        : hasIcon
                                                        ? getLogLevelStyle(log.level)
                                                        : 'bg-gray-50 border-gray-300 text-gray-700'
                                                }`}
                                            >
                                                <div className="whitespace-pre-wrap break-all">
                                                    {log.raw}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Informations sur les logs */}
                        {emailLogs.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                                {emailLogs.length} lignes affichées (dernières {logLines} lignes) •
                                Logs stockés dans storage/logs/emails.log •
                                {autoRefresh && 'Actualisation automatique activée'}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
