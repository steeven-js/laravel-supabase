<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Test Server-Sent Events</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .connected {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .disconnected {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .event {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 10px;
            margin: 5px 0;
            border-radius: 3px;
            font-family: monospace;
            font-size: 12px;
        }
        button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background-color: #0056b3;
        }
        #events {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #dee2e6;
            padding: 10px;
            background-color: #f8f9fa;
        }
    </style>
</head>
<body>
    <h1>Test Server-Sent Events</h1>

    <div id="status" class="status disconnected">
        Déconnecté
    </div>

    <div>
        <button onclick="connect()">Se connecter</button>
        <button onclick="disconnect()">Se déconnecter</button>
        <button onclick="testEvent()">Envoyer un test</button>
        <button onclick="clearEvents()">Effacer les événements</button>
    </div>

    <h2>Événements reçus :</h2>
    <div id="events"></div>

    <script>
        let eventSource = null;
        const statusDiv = document.getElementById('status');
        const eventsDiv = document.getElementById('events');

        function updateStatus(connected) {
            if (connected) {
                statusDiv.textContent = 'Connecté';
                statusDiv.className = 'status connected';
            } else {
                statusDiv.textContent = 'Déconnecté';
                statusDiv.className = 'status disconnected';
            }
        }

        function addEvent(data) {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            eventDiv.textContent = new Date().toLocaleTimeString() + ' - ' + JSON.stringify(data, null, 2);
            eventsDiv.appendChild(eventDiv);
            eventsDiv.scrollTop = eventsDiv.scrollHeight;
        }

        function connect() {
            if (eventSource) {
                eventSource.close();
            }

            console.log('Connexion aux Server-Sent Events...');
            eventSource = new EventSource('/api/realtime/stream');

            eventSource.onopen = function(event) {
                console.log('Connexion SSE ouverte');
                updateStatus(true);
                addEvent({ type: 'connection', message: 'Connexion établie' });
            };

            eventSource.onmessage = function(event) {
                console.log('Message SSE reçu:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    addEvent(data);
                } catch (e) {
                    addEvent({ type: 'raw', data: event.data });
                }
            };

            eventSource.onerror = function(event) {
                console.error('Erreur SSE:', event);
                updateStatus(false);
                addEvent({ type: 'error', message: 'Erreur de connexion' });
            };
        }

        function disconnect() {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
            }
            updateStatus(false);
            addEvent({ type: 'disconnection', message: 'Connexion fermée' });
        }

        function testEvent() {
            fetch('/api/realtime/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({ client_id: 1 })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Test envoyé:', data);
                addEvent({ type: 'test_sent', data: data });
            })
            .catch(error => {
                console.error('Erreur lors du test:', error);
                addEvent({ type: 'test_error', error: error.message });
            });
        }

        function clearEvents() {
            eventsDiv.innerHTML = '';
        }

        // Se connecter automatiquement au chargement de la page
        window.onload = function() {
            connect();
        };

        // Se déconnecter proprement lors de la fermeture de la page
        window.onbeforeunload = function() {
            disconnect();
        };
    </script>
</body>
</html>
