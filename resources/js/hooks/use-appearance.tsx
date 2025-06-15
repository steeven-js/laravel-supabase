import { useCallback, useEffect, useState, useContext } from 'react';
import { AppearanceProvider, useAppearanceContext, Appearance } from './appearance-context';

export type { Appearance };

const prefersDark = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (appearance: Appearance) => {
    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());

    document.documentElement.classList.toggle('dark', isDark);
};

const mediaQuery = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = () => {
    const currentAppearance = localStorage.getItem('appearance') as Appearance;
    applyTheme(currentAppearance || 'system');
};

export function initializeTheme() {
    const savedAppearance = (localStorage.getItem('appearance') as Appearance) || 'system';

    applyTheme(savedAppearance);

    // Add the event listener for system theme changes...
    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    try {
        return useAppearanceContext();
    } catch {
        // fallback pour compatibilité (dev/test hors provider)
        // Ancienne logique (non réactive entre composants)
        const appearance = (typeof window !== 'undefined' ? (localStorage.getItem('appearance') as Appearance) : 'system') || 'system';
        return {
            appearance,
            updateAppearance: () => {},
        };
    }
}

// Exporter le provider pour l'utiliser dans l'app
export { AppearanceProvider };
