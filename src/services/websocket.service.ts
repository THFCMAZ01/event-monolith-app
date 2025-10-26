import { ServerWebSocket } from 'bun';

interface WebSocketClient extends ServerWebSocket<any> {
  isAlive: boolean;
  heartbeatInterval?: NodeJS.Timeout;
}

class WebSocketService {
  private static instance: WebSocketService;
  private connections: Set<WebSocketClient> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach((ws) => {
        if (!ws.isAlive) {
          this.removeConnection(ws);
          return;
        }
        ws.isAlive = false;
        try {
          ws.ping();
        } catch (error) {
          this.removeConnection(ws);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  addConnection(ws: ServerWebSocket<any>): void {
    const client = ws as WebSocketClient;
    client.isAlive = true;
    this.connections.add(client);
    console.log(`✓ WebSocket connected. Total connections: ${this.connections.size}`);
  }

  removeConnection(ws: ServerWebSocket<any> | WebSocketClient): void {
    const client = ws as WebSocketClient;
    if (client.heartbeatInterval) {
      clearTimeout(client.heartbeatInterval);
      client.heartbeatInterval = undefined;
    }
    this.connections.delete(client);
    console.log(`✗ WebSocket disconnected. Total connections: ${this.connections.size}`);
  }

  broadcast(message: any): void {
    const payload = JSON.stringify(message);
    let sentCount = 0;

    this.connections.forEach((ws) => {
      try {
        ws.send(payload);
        sentCount++;
      } catch (error) {
        console.error('Error sending to client:', error);
        this.connections.delete(ws);
      }
    });

    console.log(`📡 Broadcast to ${sentCount} clients:`, message.type);
  }

  notifyEventCreated(event: any): void {
    this.broadcast({
      type: 'EVENT_CREATED',
      payload: event,
      timestamp: new Date().toISOString(),
    });
  }

  notifyEventUpdated(event: any): void {
    this.broadcast({
      type: 'EVENT_UPDATED',
      payload: event,
      timestamp: new Date().toISOString(),
    });
  }

  notifyEventDeleted(eventId: string): void {
    this.broadcast({
      type: 'EVENT_DELETED',
      payload: { eventId },
      timestamp: new Date().toISOString(),
    });
  }

  notifyEventApproved(event: any): void {
    this.broadcast({
      type: 'EVENT_APPROVED',
      payload: event,
      timestamp: new Date().toISOString(),
    });
  }

  notifyRSVPCreated(rsvp: any): void {
    this.broadcast({
      type: 'RSVP_CREATED',
      payload: rsvp,
      timestamp: new Date().toISOString(),
    });
  }

  notifyRSVPUpdated(rsvp: any): void {
    this.broadcast({
      type: 'RSVP_UPDATED',
      payload: rsvp,
      timestamp: new Date().toISOString(),
    });
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}

export default WebSocketService.getInstance();
