const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:5001');

ws.on('open', async () => {
  console.log('⚡ Connected to local WebSocket server. Preparing to post telemetry update...');
  
  // Post telemetry update
  try {
    const res = await fetch('http://localhost:5001/api/vehicles/6a212789d7b0e338f01babf4/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationName: 'Voi Checkpoint',
        odometer: 89600,
        fuelLevel: 30
      })
    });
    console.log('Response status:', res.status);
  } catch (err) {
    console.error('Failed to post telemetry:', err);
    ws.close();
    process.exit(1);
  }
});

let messageCount = 0;

ws.on('message', (data) => {
  messageCount++;
  console.log(`\n📥 Received WS Message #${messageCount}:`);
  const msg = JSON.parse(data);
  console.log('Type:', msg.type);
  console.log('Payload:', JSON.stringify(msg.payload, null, 2));
  
  if (msg.type === 'CHECKPOINT_LOGGED') {
    console.log('\n🎉 SUCCESS! Received CHECKPOINT_LOGGED event with full telemetry data!');
    ws.close();
    process.exit(0);
  }
});

ws.on('error', (err) => {
  console.error('❌ Connection error:', err);
  process.exit(1);
});

// Set a timeout to prevent hanging if no message received
setTimeout(() => {
  console.error('❌ Timeout waiting for WebSocket message!');
  ws.close();
  process.exit(1);
}, 6000);
