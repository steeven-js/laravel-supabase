import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, MoreHorizontal, Eye, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface UserRole {
    id: number;
    name: 'super_admin' | 'admin';
    display_name: string;
    description?: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    user_role_id?: number;
    user_role?: UserRole;
    role?: string; // Getter pour compatibilité
    created_at: string;
    updated_at: string;
}

interface PaginationData {
    current_page: number;
    data: User[];
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
}

interface Props {
    users: PaginationData;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Administration',
        href: '/admin',
    },
    {
        title: 'Utilisateurs',
        href: '/admin/users',
    },
];

const getRoleDisplay = (user: User): string => {
    return user.user_role?.display_name || 'Administrateur';
};

const getRoleBadgeColor = (user: User): string => {
    const roleName = user.user_role?.name || user.role;
    switch (roleName) {
        case 'admin':
            return 'bg-blue-100 text-blue-800';
        case 'super_admin':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-blue-100 text-blue-800';
    }
};

const handleDelete = (user: User) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.name}" ?`)) {
        router.delete(`/admin/users/${user.id}`, {
            onSuccess: () => {
                toast.success('Utilisateur supprimé avec succès');
            },
            onError: (errors) => {
                toast.error(errors.message || 'Erreur lors de la suppression');
            }
        });
    }
};

export default function UsersIndex({ users }: Props) {
    return (
        <>
            <Head title="Administration - Utilisateurs" />

            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="page-container">
                    {/* Header */}
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Gestion des utilisateurs</h1>
                            <p className="page-subtitle">
                                {users.total} utilisateur{users.total > 1 ? 's' : ''} au total
                            </p>
                        </div>
                        <Link href="/admin/users/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nouvel utilisateur
                            </Button>
                        </Link>
                    </div>

                    {/* Users Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Users className="mr-2 h-5 w-5" />
                                Liste des utilisateurs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Utilisateur</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Rôle</TableHead>
                                        <TableHead>Date de création</TableHead>
                                        <TableHead className="w-[70px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.data.length > 0 ? (
                                        users.data.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                                            (user.user_role?.name || user.role) === 'super_admin'
                                                                ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                                                                : 'bg-gradient-to-br from-blue-500 to-blue-700'
                                                        }`}>
                                                            <span className="text-sm font-medium text-white">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <span className="font-medium">{user.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    {user.email}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getRoleBadgeColor(user)}>
                                                        {getRoleDisplay(user)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <Link href={`/admin/users/${user.id}`}>
                                                                <DropdownMenuItem>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Voir
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            <Link href={`/admin/users/${user.id}/edit`}>
                                                                <DropdownMenuItem>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Modifier
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(user)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                Aucun utilisateur trouvé
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {users.last_page > 1 && (
                                <div className="flex items-center justify-between mt-6">
                                    <div className="text-sm text-gray-600">
                                        Affichage de {users.from} à {users.to} sur {users.total} résultats
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {users.current_page > 1 && (
                                            <Link href={`/admin/users?page=${users.current_page - 1}`}>
                                                <Button variant="outline" size="sm">
                                                    Précédent
                                                </Button>
                                            </Link>
                                        )}

                                        <span className="text-sm text-gray-600">
                                            Page {users.current_page} sur {users.last_page}
                                        </span>

                                        {users.current_page < users.last_page && (
                                            <Link href={`/admin/users?page=${users.current_page + 1}`}>
                                                <Button variant="outline" size="sm">
                                                    Suivant
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        </>
    );
}
