import { Elysia } from 'elysia';

console.log('Starting minimal test...');

const app = new Elysia()
  .get('/', () => ({ message: 'Server works!' }))
  .ws('/ws', {
    open(ws) {
      console.log('✅ WebSocket OPENED');
      ws.send(JSON.stringify({ type: 'connected' }));
    },
    message(ws, message) {
      console.log('📨 Message received:', message);
    },
    close(ws) {
      console.log('❌ WebSocket CLOSED');
    },
    error(ws, error) {
      console.error('🔥 WebSocket ERROR:', error);
    }
  })
  .listen(3002);

console.log('✅ Minimal server running on http://localhost:3002');
console.log('Test WebSocket: ws://localhost:3002/ws');
