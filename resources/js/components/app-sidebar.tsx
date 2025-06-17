import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users, Building2, FileText, Receipt, Monitor, Package, Building, Mail } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Madin.IA',
        href: '/madinia',
        icon: Building,
    },
    {
        title: 'Clients',
        href: '/clients',
        icon: Users,
    },
    {
        title: 'Entreprises',
        href: '/entreprises',
        icon: Building2,
    },
    {
        title: 'Services',
        href: '/services',
        icon: Package,
    },
    {
        title: 'Devis',
        href: '/devis',
        icon: FileText,
    },
    {
        title: 'Factures',
        href: '/factures',
        icon: Receipt,
    },
    {
        title: 'Modèles d\'Email',
        href: '/email-templates',
        icon: Mail,
    },
    {
        title: 'Utilisateurs',
        href: '/admin/users',
        icon: Users,
        requiresSuperAdmin: true,
    },
    {
        title: 'Monitoring',
        href: '/admin/monitoring',
        icon: Monitor,
        requiresSuperAdmin: true,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/steeven-js/laravel-supabase',
        icon: Folder,
        requiresSuperAdmin: true,
    },
    {
        title: 'Documentation',
        href: 'https://laravel-supabase-docs.vercel.app',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { props } = usePage();
    const auth = (props as any).auth;
    const user = auth?.user;

    // Filtrer les éléments de navigation en fonction du rôle de l'utilisateur
    const navigationItems = mainNavItems.filter(item => {
        // Si l'élément nécessite un super admin
        if (item.requiresSuperAdmin) {
            return user?.user_role?.name === 'super_admin';
        }
        // Sinon, l'élément est accessible à tous les utilisateurs connectés
        return true;
    });

    // Filtrer également les éléments du footer
    const filteredFooterItems = footerNavItems.filter(item => {
        if (item.requiresSuperAdmin) {
            return user?.user_role?.name === 'super_admin';
        }
        return true;
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navigationItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={filteredFooterItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
