import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { authRoutes } from './routes/auth.routes';
import { eventRoutes } from './routes/event.routes';
import wsService from './services/websocket.service';
import { verifyToken } from './utils/jwt.utils';
import { ApiError } from './utils/errors';
const PORT = process.env.PORT || 3000;
const app = new Elysia()
    .use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}))
    .use(swagger({
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
}))
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
    async open(ws) {
        const { token } = ws.data.query;
        if (!token) {
            console.log('🔌 WebSocket connection rejected: No token provided.');
            ws.close(4001, 'Unauthorized: Token not provided');
            return;
        }
        try {
            const user = await verifyToken(token);
            if (!user) {
                ws.close(4001, 'Unauthorized: Invalid token');
                return;
            }
            ws.data.user = user;
            wsService.addConnection(ws);
            console.log(`🔌 WebSocket connection opened for user: ${user.email}`);
            ws.send(JSON.stringify({
                type: 'CONNECTED',
                message: 'Successfully connected to Event Management WebSocket',
                timestamp: new Date().toISOString(),
            }));
        }
        catch (error) {
            console.log('🔌 WebSocket connection rejected: Invalid token.', error);
            ws.close(4001, 'Unauthorized: Invalid token');
        }
    },
    message(ws, message) {
        console.log('Received message:', message);
    },
    close(ws) {
        if (ws.data.user) {
            console.log(`🔌 WebSocket connection closed for user: ${ws.data.user.email}`);
        }
        wsService.removeConnection(ws);
    },
})
    .use(authRoutes)
    .use(eventRoutes)
    .onError(({ code, error, set }) => {
    if (error instanceof ApiError) {
        set.status = error.status;
        return { error: error.message };
    }
    console.error('Error:', error);
    switch (code) {
        case 'VALIDATION':
            set.status = 400;
            return { error: 'Validation error', details: error.message };
        case 'NOT_FOUND':
            set.status = 404;
            return { error: 'Route not found' };
        case 'INTERNAL_SERVER_ERROR':
        default:
            set.status = 500;
            return { error: 'Internal server error', message: error.message };
    }
});
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
app.start();
