import AppLogo from '@/components/app-logo';
import { SessionToasts } from '@/components/session-toasts';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { Toaster } from 'sonner';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                            <div className="mb-1 flex h-20 w-44 items-center justify-center rounded-md">
                                <AppLogo />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">{description}</p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
            <Toaster
                richColors
                position="top-right"
                expand={true}
                closeButton={true}
            />
            <SessionToasts />
        </div>
    );
}
