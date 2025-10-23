import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { authRoutes } from './routes/auth.routes';
import { eventRoutes } from './routes/event.routes';
import wsService from './services/websocket.service';

const PORT = process.env.PORT || 3000;

const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Event Management API',
          version: '1.0.0',
          description: 'Real-time event management system with authentication and role-based access control',
        },
        tags: [
          { name: 'Auth', description: 'Authentication endpoints' },
          { name: 'Events', description: 'Event management endpoints' },
          { name: 'RSVPs', description: 'RSVP management endpoints' },
          { name: 'WebSocket', description: 'Real-time WebSocket connection' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Enter your JWT token from login',
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
      path: '/swagger',
    })
  )
  .get('/', () => ({
    message: 'Event Management API is running! 🚀',
    version: '1.0.0',
    endpoints: {
      swagger: '/swagger',
      websocket: '/ws',
      auth: '/auth/*',
      events: '/events/*',
    },
    wsConnections: wsService.getConnectionCount(),
  }))
  .ws('/ws', {
    open(ws) {
      console.log('🔌 WebSocket connection opened');
      wsService.addConnection(ws);
      ws.send(
        JSON.stringify({
          type: 'CONNECTED',
          message: 'Successfully connected to Event Management WebSocket',
          timestamp: new Date().toISOString(),
        })
      );
    },
    message(ws, message) {
      console.log('📨 Received message:', message);
      ws.send(
        JSON.stringify({
          type: 'ECHO',
          payload: message,
          timestamp: new Date().toISOString(),
        })
      );
    },
    close(ws) {
      console.log('🔌 WebSocket connection closed');
      wsService.removeConnection(ws);
    },
  })
  .use(authRoutes)
  .use(eventRoutes)
  .onError(({ code, error, set }) => {
    console.error('Error:', error);

    if (code === 'VALIDATION') {
      set.status = 400;
      return { error: 'Validation error', details: error.message };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: 'Route not found' };
    }

    set.status = 500;
    return { error: 'Internal server error', message: error.message };
  })
  .listen(PORT);

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎉 Event Management API Server Running                 ║
║                                                           ║
║   🌐 Server:     http://localhost:${PORT}                   ║
║   📚 Swagger:    http://localhost:${PORT}/swagger           ║
║   🔌 WebSocket:  ws://localhost:${PORT}/ws                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

export type App = typeof app;
