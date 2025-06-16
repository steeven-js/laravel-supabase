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
import { Plus, MoreHorizontal, Eye, Edit, Trash2, UserCog, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
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
    admins: PaginationData;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Administration',
        href: '/admin',
    },
    {
        title: 'Administrateurs',
        href: '/admin/admins',
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

const getRoleIcon = (role: string) => {
    return role === 'super_admin' ?
        <Shield className="h-4 w-4 text-purple-600" /> :
        <UserCog className="h-4 w-4 text-blue-600" />;
};

const handleDelete = (user: User) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'administrateur "${user.name}" ?`)) {
        router.delete(`/admin/users/${user.id}`, {
            onSuccess: () => {
                toast.success('Administrateur supprimé avec succès');
            },
            onError: (errors) => {
                toast.error(errors.message || 'Erreur lors de la suppression');
            }
        });
    }
};

export default function AdminsIndex({ admins }: Props) {
    return (
        <>
            <Head title="Administration - Administrateurs" />

            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Administrateurs du système</h1>
                            <p className="text-gray-600">
                                {admins.total} administrateur{admins.total > 1 ? 's' : ''} au total
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <Link href="/admin/users">
                                <Button variant="outline">
                                    Tous les utilisateurs
                                </Button>
                            </Link>
                            <Link href="/admin/users/create">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nouvel utilisateur
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Admins Stats */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Super Administrateurs</CardTitle>
                                <Shield className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {admins.data.filter(admin => admin.role === 'super_admin').length}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Accès complet au système
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
                                <UserCog className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {admins.data.filter(admin => admin.role === 'admin').length}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Gestion courante du système
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Admins Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <UserCog className="mr-2 h-5 w-5" />
                                Liste des administrateurs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Administrateur</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Niveau d'accès</TableHead>
                                        <TableHead>Date de création</TableHead>
                                        <TableHead className="w-[70px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {admins.data.length > 0 ? (
                                        admins.data.map((admin) => (
                                            <TableRow key={admin.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                                            admin.role === 'super_admin'
                                                                ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                                                                : 'bg-gradient-to-br from-blue-500 to-blue-700'
                                                        }`}>
                                                            <span className="text-sm font-medium text-white">
                                                                {admin.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-medium">{admin.name}</span>
                                                            {getRoleIcon(admin.role)}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    {admin.email}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getRoleBadgeColor(admin.role)}>
                                                        {getRoleDisplay(admin.role)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    {new Date(admin.created_at).toLocaleDateString('fr-FR')}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <Link href={`/admin/users/${admin.id}`}>
                                                                <DropdownMenuItem>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Voir
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            <Link href={`/admin/users/${admin.id}/edit`}>
                                                                <DropdownMenuItem>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Modifier
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(admin)}
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
                                                Aucun administrateur trouvé
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {admins.last_page > 1 && (
                                <div className="flex items-center justify-between mt-6">
                                    <div className="text-sm text-gray-600">
                                        Affichage de {admins.from} à {admins.to} sur {admins.total} résultats
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {admins.current_page > 1 && (
                                            <Link href={`/admin/admins?page=${admins.current_page - 1}`}>
                                                <Button variant="outline" size="sm">
                                                    Précédent
                                                </Button>
                                            </Link>
                                        )}

                                        <span className="text-sm text-gray-600">
                                            Page {admins.current_page} sur {admins.last_page}
                                        </span>

                                        {admins.current_page < admins.last_page && (
                                            <Link href={`/admin/admins?page=${admins.current_page + 1}`}>
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
