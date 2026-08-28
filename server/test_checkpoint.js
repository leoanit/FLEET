require('dotenv').config();
const mongoose = require('mongoose');

// Define schemas to access Mongo collections
const TripSchema = new mongoose.Schema({
  dispatchId: String,
  status: String,
  checkpoints: [
    {
      locationName: String,
      timestamp: { type: Date, default: Date.now },
      odometer: Number,
      fuelLevel: Number,
    }
  ]
});

const Trip = mongoose.model('Trip', TripSchema);

async function runTest() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fleetos';
  console.log('Connecting to MongoDB at:', uri.split('@').pop());
  await mongoose.connect(uri);
  console.log('Connected!');

  const dispatchId = '6a212789d7b0e338f01babfc'; // DISP-1001
  const vehicleId = '6a212789d7b0e338f01babf4';  // Scania flatbed KCA 882P

  // 1. Fetch current trip status
  let trip = await Trip.findOne({ dispatchId, status: 'In Progress' });
  if (!trip) {
    console.error('Could not find active in-progress trip for DISP-1001!');
    process.exit(1);
  }
  console.log('Initial checkpoints:', JSON.stringify(trip.checkpoints, null, 2));

  // 2. Post a telemetry update for Voi (a custom location or town)
  console.log('\nPosting telemetry update for town: Voi...');
  const res1 = await fetch(`http://localhost:5001/api/vehicles/${vehicleId}/telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locationName: 'Voi',
      odometer: 89450,
      fuelLevel: 40
    })
  });
  console.log('Response status:', res1.status);
  const data1 = await res1.json();
  console.log('Response body:', JSON.stringify(data1, null, 2));

  // 3. Fetch trip checkpoints again to verify Voi was added
  trip = await Trip.findOne({ dispatchId, status: 'In Progress' });
  console.log('\nCheckpoints after Voi check-in:', JSON.stringify(trip.checkpoints, null, 2));

  // 4. Post telemetry update for a custom specific town like "Mtito Andei"
  console.log('\nPosting telemetry update for custom town: Mtito Andei...');
  const res2 = await fetch(`http://localhost:5001/api/vehicles/${vehicleId}/telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locationName: 'Mtito Andei',
      odometer: 89550,
      fuelLevel: 35
    })
  });
  console.log('Response status:', res2.status);
  const data2 = await res2.json();
  console.log('Response body:', JSON.stringify(data2, null, 2));

  // 5. Fetch trip checkpoints again to verify Mtito Andei was added
  trip = await Trip.findOne({ dispatchId, status: 'In Progress' });
  console.log('\nCheckpoints after Mtito Andei check-in:', JSON.stringify(trip.checkpoints, null, 2));

  // Clean up
  await mongoose.disconnect();
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
