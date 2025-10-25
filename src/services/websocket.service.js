class WebSocketService {
    constructor() {
        this.connections = new Set();
    }
    static getInstance() {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }
    addConnection(ws) {
        this.connections.add(ws);
        console.log(`✓ WebSocket connected. Total connections: ${this.connections.size}`);
    }
    removeConnection(ws) {
        this.connections.delete(ws);
        console.log(`✗ WebSocket disconnected. Total connections: ${this.connections.size}`);
    }
    broadcast(message) {
        const payload = JSON.stringify(message);
        let sentCount = 0;
        this.connections.forEach((ws) => {
            try {
                ws.send(payload);
                sentCount++;
            }
            catch (error) {
                console.error('Error sending to client:', error);
                this.connections.delete(ws);
            }
        });
        console.log(`📡 Broadcast to ${sentCount} clients:`, message.type);
    }
    notifyEventCreated(event) {
        this.broadcast({
            type: 'EVENT_CREATED',
            payload: event,
            timestamp: new Date().toISOString(),
        });
    }
    notifyEventUpdated(event) {
        this.broadcast({
            type: 'EVENT_UPDATED',
            payload: event,
            timestamp: new Date().toISOString(),
        });
    }
    notifyEventDeleted(eventId) {
        this.broadcast({
            type: 'EVENT_DELETED',
            payload: { eventId },
            timestamp: new Date().toISOString(),
        });
    }
    notifyEventApproved(event) {
        this.broadcast({
            type: 'EVENT_APPROVED',
            payload: event,
            timestamp: new Date().toISOString(),
        });
    }
    notifyRSVPCreated(rsvp) {
        this.broadcast({
            type: 'RSVP_CREATED',
            payload: rsvp,
            timestamp: new Date().toISOString(),
        });
    }
    notifyRSVPUpdated(rsvp) {
        this.broadcast({
            type: 'RSVP_UPDATED',
            payload: rsvp,
            timestamp: new Date().toISOString(),
        });
    }
    getConnectionCount() {
        return this.connections.size;
    }
}
export default WebSocketService.getInstance();
