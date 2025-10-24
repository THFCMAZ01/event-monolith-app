
import { getToken, loadProfile, signup, login, logout } from './auth.js';
import { loadEvents, createEvent, approveEvent, deleteEvent, rsvpEvent, filterEvents } from './events.js';
import { openCreateModal, closeCreateModal } from './ui.js';
import { connectWebSocket } from './websockets.js';

export const API_URL = 'http://localhost:3000';
export const WS_URL = 'ws://localhost:3000/ws';

document.addEventListener('DOMContentLoaded', async () => {
    if (getToken()) {
        await loadProfile();
    }
    connectWebSocket();
    loadEvents();

    // Attach event listeners to window object for global access from HTML
    window.signup = signup;
    window.login = login;
    window.logout = logout;
    window.loadEvents = loadEvents;
    window.createEvent = createEvent;
    window.approveEvent = approveEvent;
    window.deleteEvent = deleteEvent;
    window.rsvpEvent = rsvpEvent;
    window.openCreateModal = openCreateModal;
    window.closeCreateModal = closeCreateModal;

    document.getElementById('eventSearch').addEventListener('input', (e) => {
        filterEvents(e.target.value);
    });
});
