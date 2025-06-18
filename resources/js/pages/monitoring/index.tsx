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
    Eye
} from 'lucide-react';
import { useState } from 'react';

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

    const { data, setData } = useForm({
        email: diagnostics.mail.from_address,
    });

    const runTest = async (testType: string, endpoint: string, payload?: any) => {
        setLoading(prev => ({ ...prev, [testType]: true }));

        try {
            const response = await fetch(`/monitoring/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(payload || {}),
            });

            const result = await response.json();
            setTestResults(prev => ({ ...prev, [testType]: result }));
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
            <Badge variant={status ? 'success' : 'destructive'}>
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
                                    <Badge variant={diagnostics.environment.app_env === 'production' ? 'destructive' : 'secondary'}>
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
                                <div className={`p-3 rounded-md ${testResults.email.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
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
                                <div className={`p-3 rounded-md ${testResults.database.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
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
                                <div className={`p-3 rounded-md ${testResults.cache.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
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
            </div>
        </AppLayout>
    );
}
