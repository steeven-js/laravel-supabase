import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Users, UserCog, Shield, Plus, Eye } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

interface Props {
    totalUsers: number;
    totalAdmins: number;
    totalSuperAdmins: number;
    recentUsers: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Administration',
        href: '/admin',
    },
    {
        title: 'Tableau de bord',
        href: '/admin',
    },
];

const getRoleDisplay = (role: string) => {
    switch (role) {
        case 'admin':
            return 'Administrateur';
        case 'superadmin':
            return 'Super Administrateur';
        default:
            return 'Administrateur';
    }
};

const getRoleBadgeColor = (role: string) => {
    switch (role) {
        case 'admin':
            return 'bg-blue-100 text-blue-800';
        case 'superadmin':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-blue-100 text-blue-800';
    }
};

export default function AdminDashboard({ totalUsers, totalAdmins, totalSuperAdmins, recentUsers }: Props) {
    return (
        <>
            <Head title="Administration - Tableau de bord" />

            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Super Admin</h1>
                            <p className="text-gray-600">Vue d'ensemble de la gestion des utilisateurs</p>
                        </div>
                        <Link href="/admin/users/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nouvel utilisateur
                            </Button>
                        </Link>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total utilisateurs</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalUsers}</div>
                                <p className="text-xs text-muted-foreground">
                                    Tous les utilisateurs du système
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
                                <UserCog className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalAdmins}</div>
                                <p className="text-xs text-muted-foreground">
                                    Utilisateurs avec droits admin
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Super Administrateurs</CardTitle>
                                <Shield className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalSuperAdmins}</div>
                                <p className="text-xs text-muted-foreground">
                                    Accès complet au système
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Users */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Utilisateurs récents</CardTitle>
                            <Link href="/admin/users">
                                <Button variant="outline" size="sm">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir tous
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentUsers.length > 0 ? (
                                    recentUsers.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-white">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Badge className={getRoleBadgeColor(user.role)}>
                                                    {getRoleDisplay(user.role)}
                                                </Badge>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 py-8">Aucun utilisateur récent</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions rapides</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <Link href="/admin/users">
                                    <Button variant="outline" className="w-full justify-start">
                                        <Users className="mr-2 h-4 w-4" />
                                        Gérer les utilisateurs
                                    </Button>
                                </Link>
                                <Link href="/admin/admins">
                                    <Button variant="outline" className="w-full justify-start">
                                        <UserCog className="mr-2 h-4 w-4" />
                                        Voir les administrateurs
                                    </Button>
                                </Link>
                                <Link href="/admin/users/create">
                                    <Button variant="outline" className="w-full justify-start">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Créer un utilisateur
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        </>
    );
}
