import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface FlashMessages {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
}

export function SessionToasts() {
    const { props } = usePage<{
        flash: FlashMessages;
    }>();

    useEffect(() => {
        const flash = props.flash;

        if (flash?.success) {
            toast.success(flash.success, {
                duration: 5000,
                position: 'top-right',
            });
        }

        if (flash?.error) {
            toast.error(flash.error, {
                duration: 6000,
                position: 'top-right',
            });
        }

        if (flash?.warning) {
            toast.warning(flash.warning, {
                duration: 5000,
                position: 'top-right',
            });
        }

        if (flash?.info) {
            toast.info(flash.info, {
                duration: 4000,
                position: 'top-right',
            });
        }
    }, [props.flash]);

    return null;
}
