
import { API_URL } from './main.js';
import { showNotification } from './ui.js';
import { getToken, getCurrentUser } from './auth.js';

let allEvents = [];

export async function loadEvents() {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/events`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            allEvents = data;
            const currentUser = getCurrentUser();
            displayEvents(allEvents, currentUser);
        } else {
            showNotification('Failed to load events', 'error');
        }
    } catch (error) {
        console.error('Failed to load events:', error);
    }
}

export function displayEvents(events, currentUser) {
    const container = document.getElementById('eventsList');
    
    if (events.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No events available yet.</p>';
        return;
    }

    container.innerHTML = events.map(event => `
        <div class="event-card" id="event-${event.id}">
            <div class="event-header">
                <div>
                    <div class="event-title">${event.title}</div>
                    <div class="event-info">
                        📍 ${event.location}<br>
                        📅 ${new Date(event.date).toLocaleString()}<br>
                        👤 By: ${event.organizer.email}
                    </div>
                    <div class="rsvp-count">👥 ${event._count.rsvps} RSVPs</div>
                </div>
                <span class="event-status ${event.approved ? 'status-approved' : 'status-pending'}">
                    ${event.approved ? 'Approved' : 'Pending'}
                </span>
            </div>
            <p style="color: #4b5563; margin-bottom: 10px;">${event.description}</p>
            <div class="event-actions">
                ${event.approved ? `
                    <button class="btn-success" onclick="rsvpEvent('${event.id}', 'GOING')">✓ Going</button>
                    <button class="btn-secondary" onclick="rsvpEvent('${event.id}', 'MAYBE')">? Maybe</button>
                    <button class="btn-danger" onclick="rsvpEvent('${event.id}', 'NOT_GOING')">✗ Not Going</button>
                ` : ''}
                ${currentUser && currentUser.role === 'ADMIN' && !event.approved ? `
                    <button class="btn-success" onclick="approveEvent('${event.id}')">Approve Event</button>
                ` : ''}
                ${currentUser && (currentUser.role === 'ADMIN' || event.organizerId === currentUser.id) ? `
                    <button class="btn-danger" onclick="deleteEvent('${event.id}')">Delete</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

export async function createNewEvent() {
    const token = getToken();
    const title = document.getElementById('eventTitle').value;
    const description = document.getElementById('eventDescription').value;
    const date = document.getElementById('eventDate').value;
    const location = document.getElementById('eventLocation').value;

    if (!title || !description || !date || !location) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                date: new Date(date).toISOString(),
                location
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Event created! Awaiting admin approval.', 'success');
            closeCreateModal();
            loadEvents();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Failed to create event: ' + error.message, 'error');
    }
}

export async function approveEvent(eventId) {
    const token = getToken();
    if (!confirm('Approve this event?')) return;

    try {
        const response = await fetch(`${API_URL}/events/${eventId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Event approved!', 'success');
            loadEvents();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Failed to approve event: ' + error.message, 'error');
    }
}

export async function deleteEvent(eventId) {
    const token = getToken();
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Event deleted!', 'success');
            loadEvents();
        } else {
            showNotification(data.error, 'error');
        }n    } catch (error) {
        showNotification('Failed to delete event: ' + error.message, 'error');
    }
}

export async function rsvpEvent(eventId, status) {
    const token = getToken();
    try {
        const response = await fetch(`${API_URL}/events/${eventId}/rsvp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification(`RSVP updated to ${status}!`, 'success');
            loadEvents();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Failed to RSVP: ' + error.message, 'error');
    }
}

export function filterEvents(searchTerm) {
    const currentUser = getCurrentUser();
    const filteredEvents = allEvents.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    displayEvents(filteredEvents, currentUser);
}
