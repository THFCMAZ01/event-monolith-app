
import { showNotification } from './ui.js';
import { loadEvents } from './events.js';
import { WS_URL } from './main.js';
import { getToken } from './auth.js';

let ws = null;
let reconnectAttempts = 0;
let reconnectTimeoutId = null;
const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;

// Debounce function to limit how often a function can run
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Create a debounced version of loadEvents to prevent rapid reloads
const debouncedLoadEvents = debounce(loadEvents, 500);

function connect() {
    const token = getToken();
    if (!token || ws) {
        return;
    }

    ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.onopen = () => {
        console.log('WebSocket connected');
        document.getElementById('wsStatus').classList.add('connected');
        document.getElementById('wsText').textContent = 'Connected';
        reconnectAttempts = 0;
        if (reconnectTimeoutId) {
            clearTimeout(reconnectTimeoutId);
            reconnectTimeoutId = null;
        }
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message:', data);
            handleWebSocketMessage(data);
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            showNotification('Error processing real-time update', 'error');
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        document.getElementById('wsStatus').classList.remove('connected');
        document.getElementById('wsText').textContent = 'Disconnected';
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        document.getElementById('wsStatus').classList.remove('connected');
        document.getElementById('wsText').textContent = 'Reconnecting...';
        ws = null;

        const reconnectDelay = Math.min(
            INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
            MAX_RECONNECT_DELAY
        );
        console.log(`Will try to reconnect in ${reconnectDelay / 1000}s`);

        reconnectAttempts++;
        reconnectTimeoutId = setTimeout(connect, reconnectDelay);
    };
}

export function connectWebSocket() {
    // Clear any previous lingering timeouts
    if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId);
        reconnectTimeoutId = null;
    }
    reconnectAttempts = 0;
    connect();
}

export function disconnectWebSocket() {
    if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId);
        reconnectTimeoutId = null;
    }
    if (ws) {
        // Prevent the automatic reconnection logic from firing upon manual disconnection.
        ws.onclose = null; 
        ws.close();
        ws = null;
    }
    document.getElementById('wsStatus').classList.remove('connected');
    document.getElementById('wsText').textContent = 'Disconnected';
    reconnectAttempts = 0; // Reset for good measure
}

function handleWebSocketMessage(data) {
    showNotification(`[WS] ${data.message}`, data.type.endsWith('_ERROR') ? 'error' : 'info');
    // Use the debounced function to avoid flooding the server with requests
    debouncedLoadEvents();
}
