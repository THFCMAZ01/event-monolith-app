
import { showNotification } from './ui.js';
import { loadEvents } from './events.js';
import { WS_URL } from './main.js';
import { getToken } from './auth.js';

let ws = null;
let reconnectTimeout = null;

function connect() {
    const token = getToken();
    if (!token || (ws && ws.readyState === WebSocket.OPEN)) {
        return;
    }

    ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.onopen = () => {
        console.log('WebSocket connected');
        document.getElementById('wsStatus').classList.add('connected');
        document.getElementById('wsText').textContent = 'Connected';
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        handleWebSocketMessage(data);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        document.getElementById('wsStatus').classList.remove('connected');
        document.getElementById('wsText').textContent = 'Disconnected';
        ws = null;
        if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(connect, 3000);
        }
    };
}

export function connectWebSocket() {
    connect();
}

export function disconnectWebSocket() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    if (ws) {
        ws.close();
        ws = null;
    }
    document.getElementById('wsStatus').classList.remove('connected');
    document.getElementById('wsText').textContent = 'Disconnected';
}

function handleWebSocketMessage(data) {
    showNotification(`[WS] ${data.message}`, data.type.endsWith('_ERROR') ? 'error' : 'info');
    loadEvents();
}
