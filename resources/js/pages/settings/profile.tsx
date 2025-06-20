import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Camera, Check, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Paramètres du profil',
        href: '/settings/profile',
    },
];

type ProfileForm = {
    name: string;
    email: string;
    telephone: string;
    ville: string;
    adresse: string;
    code_postal: string;
    pays: string;
};

export default function Profile({ mustVerifyEmail, status, user }: {
    mustVerifyEmail: boolean;
    status?: string;
    user: any;
}) {
    const { auth } = usePage<SharedData>().props;
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm<Required<ProfileForm>>({
        name: user.name || '',
        email: user.email || '',
        telephone: user.telephone || '',
        ville: user.ville || '',
        adresse: user.adresse || '',
        code_postal: user.code_postal || '',
        pays: user.pays || '',
    });

    const avatarForm = useForm({
        avatar: null as File | null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Profil mis à jour avec succès');
            },
        });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            avatarForm.setData('avatar', file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarUpload = () => {
        if (!avatarForm.data.avatar) return;

        avatarForm.post(route('profile.avatar.update'), {
            onSuccess: () => {
                setAvatarPreview(null);
                avatarForm.reset();
                toast.success('Avatar mis à jour avec succès');
            },
            onError: () => {
                toast.error('Erreur lors de la mise à jour de l\'avatar');
            }
        });
    };

    const handleAvatarDelete = () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer votre avatar ?')) {
            avatarForm.delete(route('profile.avatar.delete'), {
                onSuccess: () => {
                    toast.success('Avatar supprimé avec succès');
                },
                onError: () => {
                    toast.error('Erreur lors de la suppression de l\'avatar');
                }
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Paramètres du profil" />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Section Avatar */}
                    <div>
                        <HeadingSmall title="Photo de profil" description="Ajoutez une photo à votre profil" />

                        <div className="mt-6 flex items-center gap-4">
                            <div className="relative">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage
                                        src={avatarPreview || (user.avatar ? `/storage/${user.avatar}` : undefined)}
                                        alt={user.name}
                                    />
                                    <AvatarFallback className="text-lg font-semibold">
                                        {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1">
                                    <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90">
                                        <Camera className="h-4 w-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex-1">
                                {avatarPreview ? (
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" onClick={handleAvatarUpload} disabled={avatarForm.processing}>
                                            <Check className="mr-2 h-4 w-4" />
                                            Confirmer
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setAvatarPreview(null)}>
                                            <X className="mr-2 h-4 w-4" />
                                            Annuler
                                        </Button>
                                    </div>
                                ) : user.avatar ? (
                                    <Button size="sm" variant="destructive" onClick={handleAvatarDelete}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer la photo
                                    </Button>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Cliquez sur l'icône pour ajouter une photo de profil
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section Informations personnelles */}
                    <div>
                        <HeadingSmall title="Informations personnelles" description="Mettez à jour vos informations personnelles" />

                        <form onSubmit={submit} className="mt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nom complet</Label>
                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        autoComplete="name"
                                        placeholder="Nom complet"
                                    />
                                    <InputError className="mt-2" message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Adresse email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        autoComplete="username"
                                        placeholder="Adresse email"
                                    />
                                    <InputError className="mt-2" message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="telephone">Téléphone</Label>
                                    <Input
                                        id="telephone"
                                        type="tel"
                                        className="mt-1 block w-full"
                                        value={data.telephone}
                                        onChange={(e) => setData('telephone', e.target.value)}
                                        autoComplete="tel"
                                        placeholder="+33 1 23 45 67 89"
                                    />
                                    <InputError className="mt-2" message={errors.telephone} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="ville">Ville</Label>
                                    <Input
                                        id="ville"
                                        className="mt-1 block w-full"
                                        value={data.ville}
                                        onChange={(e) => setData('ville', e.target.value)}
                                        autoComplete="address-level2"
                                        placeholder="Paris"
                                    />
                                    <InputError className="mt-2" message={errors.ville} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="adresse">Adresse complète</Label>
                                <Textarea
                                    id="adresse"
                                    className="mt-1 block w-full min-h-[80px]"
                                    value={data.adresse}
                                    onChange={(e) => setData('adresse', e.target.value)}
                                    autoComplete="street-address"
                                    placeholder="123 Rue de la République"
                                />
                                <InputError className="mt-2" message={errors.adresse} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="code_postal">Code postal</Label>
                                    <Input
                                        id="code_postal"
                                        className="mt-1 block w-full"
                                        value={data.code_postal}
                                        onChange={(e) => setData('code_postal', e.target.value)}
                                        autoComplete="postal-code"
                                        placeholder="75001"
                                    />
                                    <InputError className="mt-2" message={errors.code_postal} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="pays">Pays</Label>
                                    <Input
                                        id="pays"
                                        className="mt-1 block w-full"
                                        value={data.pays}
                                        onChange={(e) => setData('pays', e.target.value)}
                                        autoComplete="country"
                                        placeholder="France"
                                    />
                                    <InputError className="mt-2" message={errors.pays} />
                                </div>
                            </div>

                            {mustVerifyEmail && auth.user.email_verified_at === null && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Votre adresse email n'est pas vérifiée.{' '}
                                        <Link
                                            href={route('verification.send')}
                                            method="post"
                                            as="button"
                                            className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                        >
                                            Cliquez ici pour renvoyer l'email de vérification.
                                        </Link>
                                    </p>

                                    {status === 'verification-link-sent' && (
                                        <div className="mt-2 text-sm font-medium text-green-600">
                                            Un nouveau lien de vérification a été envoyé à votre adresse email.
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <Button disabled={processing}>Sauvegarder</Button>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-sm text-green-600">Sauvegardé</p>
                                </Transition>
                            </div>
                        </form>
                    </div>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
