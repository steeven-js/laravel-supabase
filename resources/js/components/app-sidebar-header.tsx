import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationsDropdown } from '@/components/notifications-dropdown';
import { SidebarTrigger } from '@/components/ui/sidebar';
import ThemeToggle from '@/components/theme-toggle';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const page = usePage<SharedData>();
    const { auth } = page.props;

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-2">
                {/* Notifications pour les admins */}
                {auth.user?.user_role?.name && ['admin', 'super_admin'].includes(auth.user.user_role.name) && (
                    <NotificationsDropdown
                        notifications={Array.isArray((page.props as any).notifications) ? (page.props as any).notifications : []}
                        unreadCount={(page.props as any).unreadNotificationsCount || 0}
                    />
                )}
                <ThemeToggle />
            </div>
        </header>
    );
}
