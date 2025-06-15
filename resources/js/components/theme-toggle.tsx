import { Sun, Moon, Monitor } from 'lucide-react';
import { Appearance, useAppearance } from '@/hooks/use-appearance';

const icons = {
    light: <Sun className="h-5 w-5" />,
    dark: <Moon className="h-5 w-5" />,
    system: <Monitor className="h-5 w-5" />,
};

const labels = {
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
};

export default function ThemeToggle() {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
            {(['light', 'dark', 'system'] as Appearance[]).map((mode) => (
                <button
                    key={mode}
                    onClick={() => updateAppearance(mode)}
                    className={`flex items-center rounded-md px-2 py-1.5 transition-colors text-xs font-medium
                        ${appearance === mode
                            ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                            : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60'}
                    `}
                    aria-label={`Activer le mode ${labels[mode]}`}
                >
                    {icons[mode]}
                </button>
            ))}
        </div>
    );
}
