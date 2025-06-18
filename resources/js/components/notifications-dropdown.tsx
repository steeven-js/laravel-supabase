import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
    Bell,
    BellRing,
    Users,
    Building2,
    FileText,
    Receipt,
    Settings2,
    Wrench,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';
import { useState } from 'react';

export interface Notification {
    id: string;
    type: string;
    data: {
        title: string;
        message: string;
        model_type?: string;
        model_id?: number;
        action_url?: string;
        icon_type?: string;
    };
    read_at?: string;
    created_at: string;
}

interface NotificationsDropdownProps {
    notifications: Notification[];
    unreadCount: number;
}

// Mapping des icônes par type de modèle
const getNotificationIcon = (iconType?: string, type?: string) => {
    if (iconType) {
        switch (iconType) {
            case 'client':
            case 'App\\Models\\Client':
                return <Users className="h-4 w-4 text-blue-500" />;
            case 'entreprise':
            case 'App\\Models\\Entreprise':
                return <Building2 className="h-4 w-4 text-purple-500" />;
            case 'devis':
            case 'App\\Models\\Devis':
                return <FileText className="h-4 w-4 text-orange-500" />;
            case 'facture':
            case 'App\\Models\\Facture':
                return <Receipt className="h-4 w-4 text-green-500" />;
            case 'service':
            case 'App\\Models\\Service':
                return <Wrench className="h-4 w-4 text-indigo-500" />;
            case 'madinia':
            case 'App\\Models\\Madinia':
                return <Settings2 className="h-4 w-4 text-gray-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    }

    // Fallback basé sur le type de notification
    if (type?.includes('Client')) return <Users className="h-4 w-4 text-blue-500" />;
    if (type?.includes('Entreprise')) return <Building2 className="h-4 w-4 text-purple-500" />;
    if (type?.includes('Devis')) return <FileText className="h-4 w-4 text-orange-500" />;
    if (type?.includes('Facture')) return <Receipt className="h-4 w-4 text-green-500" />;
    if (type?.includes('Service')) return <Wrench className="h-4 w-4 text-indigo-500" />;
    if (type?.includes('Madinia')) return <Settings2 className="h-4 w-4 text-gray-500" />;

    return <Bell className="h-4 w-4 text-gray-500" />;
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
        month: 'short'
    });
};

export function NotificationsDropdown({ notifications, unreadCount }: NotificationsDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    // S'assurer que notifications est toujours un tableau
    const safeNotifications = Array.isArray(notifications) ? notifications : [];

    const handleNotificationClick = (notification: Notification) => {
        // Marquer comme lue si pas encore lue
        if (!notification.read_at) {
            router.patch(`/notifications/${notification.id}/mark-as-read`, {}, {
                preserveState: true,
                preserveScroll: true,
            });
        }

        // Rediriger vers l'URL d'action si elle existe
        if (notification.data.action_url) {
            router.visit(notification.data.action_url);
        }

        setIsOpen(false);
    };

    const markAllAsRead = () => {
        router.post('/notifications/mark-all-as-read', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="group relative h-9 w-9 cursor-pointer"
                            >
                                {unreadCount > 0 ? (
                                    <BellRing className="!size-5 opacity-80 group-hover:opacity-100" />
                                ) : (
                                    <Bell className="!size-5 opacity-80 group-hover:opacity-100" />
                                )}
                                {unreadCount > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                                    >
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Notifications{unreadCount > 0 && ` (${unreadCount})`}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <DropdownMenuContent className="w-80" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs"
                        >
                            Tout marquer comme lu
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-96">
                    {safeNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Aucune notification
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {safeNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={cn(
                                        "flex items-start space-x-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                        !notification.read_at && "bg-blue-50 dark:bg-blue-950/20 border-l-2 border-blue-500"
                                    )}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getNotificationIcon(notification.data.icon_type, notification.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className={cn(
                                                "text-sm truncate",
                                                !notification.read_at && "font-semibold"
                                            )}>
                                                {notification.data.title}
                                            </p>
                                            <div className="flex items-center space-x-1">
                                                {!notification.read_at && (
                                                    <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                                                )}
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {notification.data.message}
                                        </p>

                                        <p className="text-xs text-muted-foreground mt-2">
                                            {formatTimeAgo(notification.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {safeNotifications.length > 0 && (
                    <div className="border-t p-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => router.visit('/notifications')}
                        >
                            Voir toutes les notifications
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
