import { useEffect, useRef, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';

interface RealtimeConfig {
    url: string;
    anon_key: string;
    realtime_url: string;
}

interface RealtimeEvent {
    table: string;
    event: string;
    data: any;
    user_id?: number;
    timestamp: number;
}

interface UseSupabaseRealtimeOptions {
    clientId?: number;
    userId?: number;
    onTodoReorder?: (todos: any[]) => void;
    onTodoCreated?: (todo: any) => void;
    onTodoUpdated?: (todo: any) => void;
    onTodoDeleted?: (todoId: number) => void;
    onTodoToggled?: (todoId: number, termine: boolean) => void;
}

export const useSupabaseRealtime = (options: UseSupabaseRealtimeOptions = {}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [config, setConfig] = useState<RealtimeConfig | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const maxReconnectAttempts = 5;

    // Charger la configuration Supabase
    const loadConfig = useCallback(async () => {
        try {
            const response = await fetch('/api/realtime/config');
            if (response.ok) {
                const data = await response.json();
                setConfig(data.config);
                return data.config;
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la config real-time:', error);
        }
        return null;
    }, []);

    // Gérer les événements real-time
    const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
        // Ignorer ses propres événements
        if (event.user_id === options.userId) {
            return;
        }

        console.log('Événement real-time reçu:', event);

        switch (event.event) {
            case 'reorder':
                if (event.data.client_id === options.clientId && options.onTodoReorder) {
                    options.onTodoReorder(event.data.todos);
                }
                break;

            case 'created':
                if (event.data.client_id === options.clientId && options.onTodoCreated) {
                    options.onTodoCreated(event.data);
                }
                break;

            case 'updated':
                if (event.data.client_id === options.clientId && options.onTodoUpdated) {
                    options.onTodoUpdated(event.data);
                }
                break;

            case 'deleted':
                if (event.data.client_id === options.clientId && options.onTodoDeleted) {
                    options.onTodoDeleted(event.data.id);
                }
                break;

            case 'toggled':
                if (event.data.client_id === options.clientId && options.onTodoToggled) {
                    options.onTodoToggled(event.data.id, event.data.termine);
                }
                break;
        }
    }, [options]);

    // Connecter au WebSocket
    const connect = useCallback(async (realtimeConfig: RealtimeConfig) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            console.log('Tentative de connexion WebSocket à:', realtimeConfig.realtime_url);
            const ws = new WebSocket(realtimeConfig.realtime_url);

            ws.onopen = () => {
                console.log('Connexion WebSocket établie');
                setIsConnected(true);
                setReconnectAttempts(0);

                // Envoyer un heartbeat pour maintenir la connexion
                const heartbeat = {
                    topic: 'phoenix',
                    event: 'heartbeat',
                    payload: {},
                    ref: Date.now().toString()
                };
                ws.send(JSON.stringify(heartbeat));

                // S'abonner aux changements de la table todos avec le protocole Phoenix
                const subscribeMessage = {
                    topic: `realtime:public:todos`,
                    event: 'phx_join',
                    payload: {
                        config: {
                            postgres_changes: [
                                {
                                    event: '*',
                                    schema: 'public',
                                    table: 'todos'
                                }
                            ]
                        }
                    },
                    ref: Date.now().toString()
                };

                console.log('Envoi du message de souscription:', subscribeMessage);
                ws.send(JSON.stringify(subscribeMessage));
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('Message WebSocket reçu:', message);

                    // Gérer les différents types de messages Phoenix
                    if (message.event === 'phx_reply' && message.payload?.status === 'ok') {
                        console.log('Souscription confirmée');
                    } else if (message.event === 'postgres_changes' && message.payload) {
                        const changeEvent: RealtimeEvent = {
                            table: 'todos',
                            event: message.payload.eventType || 'unknown',
                            data: message.payload.new || message.payload.old,
                            timestamp: Date.now()
                        };

                        handleRealtimeEvent(changeEvent);
                    }
                } catch (error) {
                    console.error('Erreur lors du parsing du message WebSocket:', error);
                }
            };

            ws.onclose = (event) => {
                console.log('Connexion WebSocket fermée:', event.code, event.reason);
                setIsConnected(false);

                // Tentative de reconnexion
                if (reconnectAttempts < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                    console.log(`Reconnexion dans ${delay}ms (tentative ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        setReconnectAttempts(prev => prev + 1);
                        connect(realtimeConfig);
                    }, delay);
                }
            };

            ws.onerror = (error) => {
                console.error('Erreur WebSocket:', error);
                console.error('État de la connexion:', ws.readyState);
                console.error('URL utilisée:', realtimeConfig.realtime_url);
                setIsConnected(false);
            };

            wsRef.current = ws;

            // Heartbeat périodique pour maintenir la connexion
            const heartbeatInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    const heartbeat = {
                        topic: 'phoenix',
                        event: 'heartbeat',
                        payload: {},
                        ref: Date.now().toString()
                    };
                    ws.send(JSON.stringify(heartbeat));
                }
            }, 30000); // Heartbeat toutes les 30 secondes

            // Nettoyer l'interval lors de la fermeture
            ws.addEventListener('close', () => {
                clearInterval(heartbeatInterval);
            });

        } catch (error) {
            console.error('Erreur lors de la connexion WebSocket:', error);
        }
    }, [handleRealtimeEvent, reconnectAttempts]);

    // Déconnecter
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
        setReconnectAttempts(0);
    }, []);

    // Initialiser la connexion
    useEffect(() => {
        const initConnection = async () => {
            const realtimeConfig = await loadConfig();
            if (realtimeConfig) {
                await connect(realtimeConfig);
            }
        };

        initConnection();

        return () => {
            disconnect();
        };
    }, [loadConfig, connect, disconnect]);

    // Tester la connexion
    const testConnection = useCallback(async () => {
        try {
            const response = await fetch('/api/realtime/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Test real-time:', data);
                return data.success;
            }
        } catch (error) {
            console.error('Erreur lors du test real-time:', error);
        }
        return false;
    }, []);

    return {
        isConnected,
        config,
        testConnection,
        disconnect,
        reconnectAttempts
    };
};
