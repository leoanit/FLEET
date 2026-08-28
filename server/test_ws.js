const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:5001');

ws.on('open', () => {
  console.log('⚡ Connected to local WebSocket server successfully!');
  ws.close();
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('❌ Connection failed:', err);
  process.exit(1);
});
