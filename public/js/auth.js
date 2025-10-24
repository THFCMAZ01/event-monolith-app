
import { API_URL } from './main.js';
import { showNotification } from './ui.js';
import { loadEvents } from './events.js';
import { disconnectWebSocket, connectWebSocket } from './websockets.js';

let token = localStorage.getItem('token');
let currentUser = null;

export function getToken() {
    return token;
}

export function getCurrentUser() {
    return currentUser;
}

export async function signup() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const role = document.getElementById('authRole').value;

    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            await loadProfile();
            connectWebSocket();
            showNotification(data.message, 'success');
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Signup failed: ' + error.message, 'error');
    }
}

export async function login() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            await loadProfile();
            connectWebSocket();
            showNotification('Login successful!', 'success');
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Login failed: ' + error.message, 'error');
    }
}

export function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('loggedInSection').classList.add('hidden');
    document.getElementById('userRole').textContent = 'Not logged in';
    const createEventBtn = document.getElementById('createEventBtn');
    if(createEventBtn) createEventBtn.classList.add('hidden');
    disconnectWebSocket();
    loadEvents();
    showNotification('Logged out', 'info');
}

export async function loadProfile() {
    if (!token) return;
    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data;
            document.getElementById('authSection').classList.add('hidden');
            document.getElementById('loggedInSection').classList.remove('hidden');
            document.getElementById('userEmail').textContent = data.email;
            document.getElementById('currentRole').textContent = data.role;
            document.getElementById('userRole').textContent = `Logged in as ${data.role}`;

            const createEventBtn = document.getElementById('createEventBtn');
            if(createEventBtn) {
                if (data.role === 'ORGANIZER' || data.role === 'ADMIN') {
                    createEventBtn.classList.remove('hidden');
                } else {
                    createEventBtn.classList.add('hidden');
                }
            }

        } else {
            logout();
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
        logout();
    }
}
