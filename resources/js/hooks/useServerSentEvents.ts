import { useEffect, useRef, useState, useCallback } from 'react';

interface SSEEvent {
    type: string;
    data?: any;
    timestamp: string;
}

interface UseServerSentEventsOptions {
    clientId?: number;
    userId?: number;
    onTodoReorder?: (todos: any[]) => void;
    onTodoCreated?: (todo: any) => void;
    onTodoUpdated?: (todo: any) => void;
    onTodoDeleted?: (todoId: number) => void;
    onTodoToggled?: (todoId: number, termine: boolean) => void;
}

export const useServerSentEvents = (options: UseServerSentEventsOptions = {}) => {
    const [isConnected, setIsConnected] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const maxReconnectAttempts = 5;

    // Gérer les événements SSE
    const handleSSEEvent = useCallback((event: SSEEvent) => {
        console.log('Événement SSE reçu:', event);

        switch (event.type) {
            case 'todo_reorder':
                if (event.data?.client_id === options.clientId && options.onTodoReorder) {
                    options.onTodoReorder(event.data.todos);
                }
                break;

            case 'todo_created':
                if (event.data?.client_id === options.clientId && options.onTodoCreated) {
                    options.onTodoCreated(event.data);
                }
                break;

            case 'todo_updated':
                if (event.data?.client_id === options.clientId && options.onTodoUpdated) {
                    options.onTodoUpdated(event.data);
                }
                break;

            case 'todo_deleted':
                if (event.data?.client_id === options.clientId && options.onTodoDeleted) {
                    options.onTodoDeleted(event.data.id);
                }
                break;

            case 'todo_toggled':
                if (event.data?.client_id === options.clientId && options.onTodoToggled) {
                    options.onTodoToggled(event.data.id, event.data.termine);
                }
                break;
        }
    }, [options]);

    // Connecter aux Server-Sent Events
    const connect = useCallback(() => {
        if (eventSourceRef.current?.readyState === EventSource.OPEN) {
            return;
        }

        try {
            console.log('Connexion aux Server-Sent Events...');
            const eventSource = new EventSource('/api/realtime/stream');

            eventSource.onopen = () => {
                console.log('Connexion SSE établie');
                setIsConnected(true);
                setReconnectAttempts(0);
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'connected') {
                        console.log('Connexion SSE confirmée');
                    } else if (data.type === 'heartbeat') {
                        // Heartbeat reçu, connexion active
                    } else {
                        handleSSEEvent(data);
                    }
                } catch (error) {
                    console.error('Erreur lors du parsing du message SSE:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('Erreur SSE:', error);
                setIsConnected(false);

                // Tentative de reconnexion
                if (reconnectAttempts < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                    console.log(`Reconnexion SSE dans ${delay}ms (tentative ${reconnectAttempts + 1}/${maxReconnectAttempts})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        setReconnectAttempts(prev => prev + 1);
                        eventSource.close();
                        connect();
                    }, delay);
                }
            };

            eventSourceRef.current = eventSource;
        } catch (error) {
            console.error('Erreur lors de la connexion SSE:', error);
        }
    }, [handleSSEEvent, reconnectAttempts]);

    // Déconnecter
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setIsConnected(false);
        setReconnectAttempts(0);
    }, []);

    // Test de connexion
    const testConnection = useCallback(async () => {
        try {
            const response = await fetch('/api/realtime/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Erreur lors du test de connexion:', error);
            return false;
        }
    }, []);

    // Initialiser la connexion
    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected,
        reconnectAttempts,
        testConnection,
        disconnect,
        connect
    };
};
