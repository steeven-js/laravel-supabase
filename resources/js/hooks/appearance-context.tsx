import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

interface AppearanceContextProps {
    appearance: Appearance;
    updateAppearance: (mode: Appearance) => void;
}

const AppearanceContext = createContext<AppearanceContextProps | undefined>(undefined);

const prefersDark = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (appearance: Appearance) => {
    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());
    document.documentElement.classList.toggle('dark', isDark);
};

const mediaQuery = () => {
    if (typeof window === 'undefined') return null;
    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = () => {
    const currentAppearance = localStorage.getItem('appearance') as Appearance;
    applyTheme(currentAppearance || 'system');
};

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [appearance, setAppearance] = useState<Appearance>('system');

    const updateAppearance = useCallback((mode: Appearance) => {
        setAppearance(mode);
        localStorage.setItem('appearance', mode);
        setCookie('appearance', mode);
        applyTheme(mode);
    }, []);

    useEffect(() => {
        const savedAppearance = localStorage.getItem('appearance') as Appearance | null;
        setAppearance(savedAppearance || 'system');
        applyTheme(savedAppearance || 'system');

        // Synchronisation entre onglets et composants
        const onStorage = (event: StorageEvent) => {
            if (event.key === 'appearance') {
                const newAppearance = (event.newValue as Appearance) || 'system';
                setAppearance(newAppearance);
                applyTheme(newAppearance);
            }
        };
        window.addEventListener('storage', onStorage);
        mediaQuery()?.addEventListener('change', handleSystemThemeChange);
        return () => {
            window.removeEventListener('storage', onStorage);
            mediaQuery()?.removeEventListener('change', handleSystemThemeChange);
        };
    }, []);

    return (
        <AppearanceContext.Provider value={{ appearance, updateAppearance }}>
            {children}
        </AppearanceContext.Provider>
    );
};

export function useAppearanceContext() {
    const context = useContext(AppearanceContext);
    if (!context) {
        throw new Error('useAppearanceContext must be used within an AppearanceProvider');
    }
    return context;
}
