import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
    Cpu
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
            const isGetRequest = endpoint === 'tables-stats';
            const response = await fetch(`/monitoring/${endpoint}`, {
                method: isGetRequest ? 'GET' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: isGetRequest ? undefined : JSON.stringify(payload || {}),
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

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* PHP Info */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">PHP</CardTitle>
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{diagnostics.php.version}</div>
                            <div className="space-y-1 mt-2">
                                {Object.entries(diagnostics.php.extensions).map(([ext, loaded]) => (
                                    <div key={ext} className="flex items-center justify-between text-xs">
                                        <span>{ext}</span>
                                        {getStatusIcon(loaded)}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Laravel Info */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Laravel</CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{diagnostics.laravel.version}</div>
                            <div className="space-y-1 mt-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span>Environnement</span>
                                    <Badge variant="secondary">{diagnostics.laravel.environment}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Debug</span>
                                    {getStatusBadge(diagnostics.laravel.debug_mode, 'ON', 'OFF')}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Timezone</span>
                                    <span>{diagnostics.laravel.timezone}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Database Status */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Base de données</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {getStatusBadge(diagnostics.database.status === 'connected', 'Connecté', 'Erreur')}
                            </div>
                            {diagnostics.database.status === 'connected' ? (
                                <div className="space-y-1 mt-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span>Driver</span>
                                        <span>{diagnostics.database.driver}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Host</span>
                                        <span className="truncate max-w-24">{diagnostics.database.host}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Database</span>
                                        <span className="truncate max-w-24">{diagnostics.database.database}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-red-600 mt-2">
                                    {diagnostics.database.message}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Storage Info */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stockage</CardTitle>
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatBytes(diagnostics.storage.disk_space.free)}
                            </div>
                            <div className="space-y-1 mt-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span>Total</span>
                                    <span>{formatBytes(diagnostics.storage.disk_space.total)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Logs</span>
                                    {getStatusIcon(diagnostics.storage.logs_writable)}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Cache</span>
                                    {getStatusIcon(diagnostics.storage.cache_writable)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mail Config */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Email</CardTitle>
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{diagnostics.mail.driver}</div>
                            <div className="space-y-1 mt-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span>Host</span>
                                    <span className="truncate max-w-24">{diagnostics.mail.host}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Port</span>
                                    <span>{diagnostics.mail.port}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>From</span>
                                    <span className="truncate max-w-24">{diagnostics.mail.from_address}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Environment */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Environnement</CardTitle>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{diagnostics.environment.app_env.toUpperCase()}</div>
                            <div className="space-y-1 mt-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span>URL</span>
                                    <span className="truncate max-w-24">{diagnostics.environment.app_url}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Supabase</span>
                                    {getStatusIcon(!!diagnostics.environment.supabase_url)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

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
                                <div className={`p-3 rounded-md ${testResults.email.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    <div className="flex items-center gap-2">
                                        {testResults.email.success ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                        <span className="font-medium">{testResults.email.message}</span>
                                    </div>
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
                                <div className={`p-3 rounded-md ${testResults.database.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    <div className="flex items-center gap-2">
                                        {testResults.database.success ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                        <span className="font-medium">{testResults.database.message}</span>
                                    </div>
                                    {testResults.database.details && (
                                        <div className="text-xs mt-2 space-y-1">
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
                                <div className={`p-3 rounded-md ${testResults.cache.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    <div className="flex items-center gap-2">
                                        {testResults.cache.success ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                        <span className="font-medium">{testResults.cache.message}</span>
                                    </div>
                                    <div className="text-xs mt-1">
                                        {testResults.cache.timestamp}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tables de Test Section */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            Tables de Test
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Switch Mode Test */}
                        <div className="space-y-3">
                            <h3 className="font-semibold">Mode de données</h3>
                            <div className="flex items-center gap-4">
                                <Badge variant="outline" className="text-blue-600">
                                    Production : tables devis/factures
                                </Badge>
                                <Badge variant="outline" className="text-green-600">
                                    Test : tables test_devis/test_factures
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Les tables de test ont la même structure que les tables de production mais contiennent des données de test.
                            </p>
                        </div>

                        {/* Statistiques des tables */}
                        <div className="space-y-3">
                            <h3 className="font-semibold">Statistiques des tables</h3>
                            <Button
                                onClick={() => runTest('stats', 'tables-stats')}
                                disabled={loading.stats}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                {loading.stats ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Activity className="w-4 h-4" />
                                )}
                                Afficher les statistiques
                            </Button>
                            {testResults.stats && testResults.stats.success && (
                                <div className="grid md:grid-cols-2 gap-4 mt-4">
                                    {/* Production Stats */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">Tables Production</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Devis:</span>
                                                <Badge variant="secondary">{testResults.stats.stats.production.devis}</Badge>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Factures:</span>
                                                <Badge variant="secondary">{testResults.stats.stats.production.factures}</Badge>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Lignes devis:</span>
                                                <Badge variant="outline">{testResults.stats.stats.production.lignes_devis}</Badge>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Lignes factures:</span>
                                                <Badge variant="outline">{testResults.stats.stats.production.lignes_factures}</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Test Stats */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">Tables Test</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Devis test:</span>
                                                <Badge variant="secondary">{testResults.stats.stats.test.devis}</Badge>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Factures test:</span>
                                                <Badge variant="secondary">{testResults.stats.stats.test.factures}</Badge>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Lignes devis:</span>
                                                <Badge variant="outline">{testResults.stats.stats.test.lignes_devis}</Badge>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Lignes factures:</span>
                                                <Badge variant="outline">{testResults.stats.stats.test.lignes_factures}</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>

                        {/* Réinitialiser les tables de test */}
                        <div className="space-y-3">
                            <h3 className="font-semibold">Réinitialiser les données de test</h3>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-yellow-800">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="font-medium">Attention</span>
                                </div>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Cette action va vider toutes les tables de test et générer de nouvelles données de test.
                                </p>
                            </div>
                            <Button
                                onClick={() => runTest('reset', 'reset-test-tables')}
                                disabled={loading.reset}
                                variant="destructive"
                                className="flex items-center gap-2"
                            >
                                {loading.reset ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Vider et régénérer les tables de test
                            </Button>
                            {testResults.reset && (
                                <div className={`p-3 rounded-md ${testResults.reset.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    <div className="flex items-center gap-2">
                                        {testResults.reset.success ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                        <span className="font-medium">{testResults.reset.message}</span>
                                    </div>
                                    {testResults.reset.details && (
                                        <div className="text-xs mt-2 space-y-1">
                                            <div>Tables nettoyées: {testResults.reset.details.tables_cleaned.join(', ')}</div>
                                            <div>Seeders exécutés: {testResults.reset.details.seeders_run.join(', ')}</div>
                                        </div>
                                    )}
                                    <div className="text-xs mt-1">
                                        {testResults.reset.timestamp}
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
