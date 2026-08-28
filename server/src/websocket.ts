import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

let wss: WebSocketServer | null = null;

export const initWebSocket = (server: Server) => {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 WebSocket Client Connected');

    ws.on('close', () => {
      console.log('🔌 WebSocket Client Disconnected');
    });

    ws.on('error', (err) => {
      console.error('❌ WebSocket Client Error:', err);
    });
  });

  console.log('🔌 WebSocket Server initialized successfully');
  return wss;
};

export const broadcast = (event: string, payload: any) => {
  if (!wss) {
    console.warn('⚠️ WebSocket server not initialized yet');
    return;
  }

  const message = JSON.stringify({ type: event, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};
