
import { showNotification } from './ui.js';
import { loadEvents } from './events.js';
import { WS_URL } from './main.js';

let ws = null;

export function connectWebSocket() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('WebSocket connected');
        document.getElementById('wsStatus').classList.add('connected');
        document.getElementById('wsText').textContent = 'Connected';
        showNotification('WebSocket connected!', 'success');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        handleWebSocketMessage(data);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        showNotification('WebSocket error', 'error');
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        document.getElementById('wsStatus').classList.remove('connected');
        document.getElementById('wsText').textContent = 'Disconnected';
        setTimeout(connectWebSocket, 3000);
    };
}

function handleWebSocketMessage(data) {
    switch(data.type) {
        case 'EVENT_CREATED':
            showNotification('New event created!', 'info');
            loadEvents();
            break;
        case 'EVENT_UPDATED':
            showNotification('Event updated!', 'info');
            loadEvents();
            break;
        case 'EVENT_DELETED':
            showNotification('Event deleted!', 'info');
            loadEvents();
            break;
        case 'EVENT_APPROVED':
            showNotification('Event approved!', 'success');
            loadEvents();
            break;
        case 'RSVP_CREATED':
        case 'RSVP_UPDATED':
            showNotification('RSVP updated!', 'info');
            loadEvents();
            break;
    }
}
