import { Badge } from '@/components/ui/badge';
import { Database, TestTube } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TestModeIndicatorProps {
    className?: string;
}

export default function TestModeIndicator({ className = '' }: TestModeIndicatorProps) {
    const [mode, setMode] = useState<'production' | 'test' | null>(null);
    const [loading, setLoading] = useState(true);

    const checkMode = async () => {
        // Seulement en mode local
        if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
            setMode('production');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/monitoring/current-mode', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                setMode(result.mode);
            } else {
                setMode('production');
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du mode:', error);
            setMode('production');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkMode();

        // Vérifier le mode toutes les 30 secondes
        const interval = setInterval(checkMode, 30000);

        return () => clearInterval(interval);
    }, []);

    if (loading || !mode) {
        return null;
    }

    // Ne pas afficher en mode production normal
    if (mode === 'production' && (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'))) {
        return null;
    }

    return (
        <Badge
            variant={mode === 'test' ? 'default' : 'secondary'}
            className={`
                ${mode === 'test'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
                flex items-center gap-1 ${className}
            `}
        >
            {mode === 'test' ? (
                <TestTube className="w-3 h-3" />
            ) : (
                <Database className="w-3 h-3" />
            )}
            {mode === 'test' ? 'MODE TEST' : 'MODE PROD'}
        </Badge>
    );
}
