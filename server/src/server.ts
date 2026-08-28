import 'dotenv/config'; // must be first — loads .env before any other module reads process.env
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import authRoutes from './routes/auth';
import vehicleRoutes from './routes/vehicles';
import driverRoutes from './routes/drivers';
import dispatchRoutes from './routes/dispatches';
import tripRoutes from './routes/trips';
import analyticsRoutes from './routes/analytics';
import serviceLogRoutes from './routes/serviceLogs';
import employeeAccountRoutes from './routes/employeeAccounts';
import transportRequestRoutes from './routes/transportRequests';
import { initWebSocket } from './websocket';
import seedDatabase from './seed';

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleetos';

// 2. Load globally standard Express Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or standard server-to-server calls)
    if (!origin) return callback(null, true);
    
    // Check if origin matches localhost or 127.0.0.1 on any port
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Auto-seed is opt-out in development, opt-in everywhere else — set SEED_DB=true/false to override.
const shouldSeed = process.env.SEED_DB
  ? process.env.SEED_DB === 'true'
  : process.env.NODE_ENV !== 'production';

// 3. Connect to MongoDB with robust event monitoring and reconnect parameters
const connectWithRetry = () => {
  console.log('🔌 Attempting MongoDB connection...');
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(async () => {
    console.log(`🔌 Connected to MongoDB instance at: ${MONGODB_URI.split('@').pop()}`);
    if (shouldSeed) {
      // Auto-seed baseline fleet records if empty
      await seedDatabase();
    } else {
      console.log('🌱 Skipping auto-seed (NODE_ENV=production). Set SEED_DB=true to force it.');
    }
  })
  .catch((err: any) => {
    console.error('❌ MongoDB connection failed. Retrying in 5 seconds...', err.message);
    setTimeout(connectWithRetry, 5000);
  });
};

// Monitor MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.warn('🔌 MongoDB disconnected! Command execution will buffer until connection is restored.');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔌 MongoDB reconnected successfully!');
});

mongoose.connection.on('error', (err: any) => {
  console.error('❌ MongoDB connection error event:', err.message);
});

connectWithRetry();

// 4. Register REST API Router endpoints
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', serviceLogRoutes);
app.use('/api/employee-accounts', employeeAccountRoutes);
app.use('/api/transport-requests', transportRequestRoutes);

// Base Health Check path
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(), 
    service: 'FleetOS Enterprise Dispatch Server' 
  });
});

const server = http.createServer(app);
initWebSocket(server);

// Catch server start errors (such as EADDRINUSE)
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\n================================================================');
    console.error(`❌ ERROR: Port ${PORT} is already in use by another process!`);
    console.error(`👉 Run this PowerShell command to instantly free the port:`);
    console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
    console.error('================================================================\n');
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});

// 5. Fire operational server listener
server.listen(PORT, () => {
  console.log(`🚀 FleetOS Dispatch API active on: http://localhost:${PORT}`);
  console.log(`🛡️  Health check coordinates: http://localhost:${PORT}/health`);
});
