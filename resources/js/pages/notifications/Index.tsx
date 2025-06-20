import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { type Notification } from '@/components/notifications-dropdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Building2,
    FileText,
    Receipt,
    Settings2,
    Wrench,
    AlertCircle,
    Clock
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Notifications',
        href: '/notifications',
    },
];

interface Props {
    notifications: {
        data: Notification[];
        total: number;
    };
}

const getNotificationIcon = (iconType?: string, type?: string) => {
    if (iconType) {
        switch (iconType) {
            case 'client':
                return <Users className="h-5 w-5 text-blue-500" />;
            case 'entreprise':
                return <Building2 className="h-5 w-5 text-purple-500" />;
            case 'devis':
                return <FileText className="h-5 w-5 text-orange-500" />;
            case 'facture':
                return <Receipt className="h-5 w-5 text-green-500" />;
            case 'service':
                return <Wrench className="h-5 w-5 text-indigo-500" />;
            case 'madinia':
                return <Settings2 className="h-5 w-5 text-gray-500" />;
            default:
                return <AlertCircle className="h-5 w-5 text-gray-500" />;
        }
    }
    return <AlertCircle className="h-5 w-5 text-gray-500" />;
};

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;

    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

export default function NotificationsIndex({ notifications }: Props) {
    // Fonction pour gérer le clic sur une notification
    const handleNotificationClick = (notification: Notification) => {
        // Marquer comme lue si pas encore lue
        if (!notification.read_at) {
            router.patch(`/notifications/${notification.id}/mark-as-read`, {}, {
                preserveState: true,
                preserveScroll: true,
            });
        }

        // Rediriger vers l'URL appropriée
        const redirectUrl = getRedirectUrl(notification);
        if (redirectUrl) {
            router.visit(redirectUrl);
        }
    };

    // Fonction pour générer l'URL de redirection
    const getRedirectUrl = (notification: Notification): string | null => {
        // Si une URL d'action est fournie, l'utiliser en priorité
        if (notification.data.action_url) {
            return notification.data.action_url;
        }

        // Sinon, générer l'URL basée sur le type et l'ID
        const modelType = notification.data.model_type || notification.data.icon_type;
        const modelId = notification.data.model_id;

        if (!modelType || !modelId) {
            return null;
        }

        // Mapper les types vers les routes
        switch (modelType) {
            case 'client':
                return `/clients/${modelId}`;
            case 'entreprise':
                return `/entreprises/${modelId}`;
            case 'devis':
                return `/devis/${modelId}`;
            case 'facture':
                return `/factures/${modelId}`;
            case 'service':
                return `/services/${modelId}`;
            default:
                return null;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                            <p className="text-muted-foreground">
                                Gérez toutes vos notifications administratives
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {notifications.data.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Aucune notification</h3>
                                <p className="text-muted-foreground text-center">
                                    Vous n'avez aucune notification pour le moment.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        notifications.data.map((notification) => (
                            <Card
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={cn(
                                    "cursor-pointer transition-colors hover:bg-muted/50",
                                    !notification.read_at && "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20"
                                )}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0 mt-1">
                                            {getNotificationIcon(notification.data.icon_type, notification.type)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className={cn(
                                                    "text-base font-medium",
                                                    !notification.read_at && "font-semibold"
                                                )}>
                                                    {notification.data.title}
                                                </h3>

                                                <div className="flex items-center space-x-2">
                                                    {!notification.read_at && (
                                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                            Non lu
                                                        </Badge>
                                                    )}
                                                    <div className="flex items-center text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {formatTimeAgo(notification.created_at)}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-sm text-muted-foreground mb-3">
                                                {notification.data.message}
                                            </p>

                                            {(notification.data.action_url || notification.data.model_id) && (
                                                <div className="text-xs text-blue-600 hover:text-blue-800">
                                                    Cliquez pour voir les détails →
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
