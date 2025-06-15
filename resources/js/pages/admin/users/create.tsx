import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Administration',
        href: '/admin',
    },
    {
        title: 'Utilisateurs',
        href: '/admin/users',
    },
    {
        title: 'Créer un utilisateur',
        href: '/admin/users/create',
    },
];

export default function CreateUser() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'admin',
        telephone: '',
        ville: '',
        adresse: '',
        code_postal: '',
        pays: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/users');
    };

    return (
        <>
            <Head title="Administration - Créer un utilisateur" />

            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Créer un nouvel utilisateur</h1>
                            <p className="text-gray-600">Ajouter un nouvel utilisateur au système</p>
                        </div>
                        <Button variant="outline" onClick={() => window.history.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Button>
                    </div>

                    {/* Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations utilisateur</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Informations de base */}
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nom complet *</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className={errors.name ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className={errors.email ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-600">{errors.email}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Mot de passe *</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className={errors.password ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.password && (
                                            <p className="text-sm text-red-600">{errors.password}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation">Confirmer le mot de passe *</Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className={errors.password_confirmation ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.password_confirmation && (
                                            <p className="text-sm text-red-600">{errors.password_confirmation}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="role">Rôle *</Label>
                                        <Select
                                            value={data.role}
                                            onValueChange={(value) => setData('role', value)}
                                        >
                                            <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Sélectionner un rôle" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Administrateur</SelectItem>
                                                <SelectItem value="superadmin">Super Administrateur</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.role && (
                                            <p className="text-sm text-red-600">{errors.role}</p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            Admin : Accès standard • Super Admin : Accès complet au système
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="telephone">Téléphone</Label>
                                        <Input
                                            id="telephone"
                                            type="tel"
                                            value={data.telephone}
                                            onChange={(e) => setData('telephone', e.target.value)}
                                            className={errors.telephone ? 'border-red-500' : ''}
                                        />
                                        {errors.telephone && (
                                            <p className="text-sm text-red-600">{errors.telephone}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Adresse */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900">Adresse (optionnel)</h3>

                                    <div className="space-y-2">
                                        <Label htmlFor="adresse">Adresse</Label>
                                        <Input
                                            id="adresse"
                                            type="text"
                                            value={data.adresse}
                                            onChange={(e) => setData('adresse', e.target.value)}
                                            className={errors.adresse ? 'border-red-500' : ''}
                                        />
                                        {errors.adresse && (
                                            <p className="text-sm text-red-600">{errors.adresse}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="code_postal">Code postal</Label>
                                            <Input
                                                id="code_postal"
                                                type="text"
                                                value={data.code_postal}
                                                onChange={(e) => setData('code_postal', e.target.value)}
                                                className={errors.code_postal ? 'border-red-500' : ''}
                                            />
                                            {errors.code_postal && (
                                                <p className="text-sm text-red-600">{errors.code_postal}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="ville">Ville</Label>
                                            <Input
                                                id="ville"
                                                type="text"
                                                value={data.ville}
                                                onChange={(e) => setData('ville', e.target.value)}
                                                className={errors.ville ? 'border-red-500' : ''}
                                            />
                                            {errors.ville && (
                                                <p className="text-sm text-red-600">{errors.ville}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="pays">Pays</Label>
                                            <Input
                                                id="pays"
                                                type="text"
                                                value={data.pays}
                                                onChange={(e) => setData('pays', e.target.value)}
                                                className={errors.pays ? 'border-red-500' : ''}
                                            />
                                            {errors.pays && (
                                                <p className="text-sm text-red-600">{errors.pays}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end space-x-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                    >
                                        Annuler
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? (
                                            'Création...'
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Créer l'utilisateur
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        </>
    );
}
