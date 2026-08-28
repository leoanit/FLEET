import { create } from 'zustand';
import { useUIStore } from '../store/useUIStore';

export const getWebSocketUrl = (): string => {
  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001/api';
  // Replace the REST API base path /api
  let wsUrl = apiUrl.replace(/\/api$/, '');
  // Switch protocol: http -> ws, https -> wss
  wsUrl = wsUrl.replace(/^http/, 'ws');
  return wsUrl;
};

export interface TelemetryPayload {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  fuelLevel: number;
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  locationName?: string;
  timestamp: string;
}

interface GPSStore {
  positions: Record<string, TelemetryPayload>;
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
  updatePosition: (payload: TelemetryPayload) => void;
  clearPositions: () => void;
}

// Global real-time GPS telemetry Zustand Store
export const useGPSStore = create<GPSStore>((set) => ({
  positions: {},
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),
  updatePosition: (payload) =>
    set((state) => ({
      positions: {
        ...state.positions,
        [payload.vehicleId]: payload,
      },
    })),
  clearPositions: () => set({ positions: {} }),
}));

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectInterval = 5000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionalDisconnect = false;
  private simulatorTimer: ReturnType<typeof setInterval> | null = null;

  constructor(url: string) {
    this.url = url;
  }

  // Connects to WebSocket server. Defaults to mock simulation fallback if connection fails.
  connect(useSimulatorAsFallback = true) {
    this.isIntentionalDisconnect = false;
    
    // Clear existing simulator if active
    if (this.simulatorTimer) {
      clearInterval(this.simulatorTimer);
      this.simulatorTimer = null;
    }

    try {
      console.log(`🔌 Initializing telemetry stream socket to: ${this.url}`);
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('⚡ Fleet Telemetry WebSocket Connected');
        useGPSStore.getState().setConnected(true);
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'GPS_UPDATE') {
            useGPSStore.getState().updatePosition(message.payload);
          } else if (message.type === 'CHECKPOINT_LOGGED') {
            const { driverName, vehicleName, plateNumber, locationName, odometer, fuelLevel } = message.payload;
            useUIStore.getState().addNotification(
              'success',
              `Checkpoint: ${locationName}`,
              `Driver ${driverName} (${plateNumber}) operating "${vehicleName}" checked in at ${locationName}. Odometer: ${odometer?.toLocaleString() || 'N/A'} km | Fuel: ${fuelLevel}%`
            );
          }
        } catch (err) {
          console.error('Error parsing live telemetry frame:', err);
        }
      };

      this.socket.onclose = (event) => {
        useGPSStore.getState().setConnected(false);
        if (!this.isIntentionalDisconnect) {
          console.warn(`🔌 WebSocket stream terminated (code: ${event.code}). Reconnecting in ${this.reconnectInterval}ms...`);
          
          if (useSimulatorAsFallback) {
            this.startMockSimulation();
          }

          this.reconnectTimer = setTimeout(() => this.connect(useSimulatorAsFallback), this.reconnectInterval);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket telemetry connection error:', error);
      };

    } catch (err) {
      console.error('Failed to create WebSocket client:', err);
      useGPSStore.getState().setConnected(false);
      if (useSimulatorAsFallback) {
        this.startMockSimulation();
      }
    }
  }

  // Gracefully shuts down connection
  disconnect() {
    this.isIntentionalDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.simulatorTimer) {
      clearInterval(this.simulatorTimer);
      this.simulatorTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    useGPSStore.getState().setConnected(false);
    console.log('🔌 WebSocket disconnected intentionally');
  }

  // Emulates dynamic GPS coordinate updates (useful for local development/showcases)
  private async startMockSimulation() {
    if (this.simulatorTimer) return;
    
    console.log('🧪 Starting high-fidelity fleet telemetry simulation');
    
    try {
      // Query the backend dynamically to fetch real vehicles
      const response = await fetch('/api/vehicles');
      if (!response.ok) throw new Error('Failed to fetch real vehicles');
      const realVehicles = await response.json();
      
      const vehicles = realVehicles.map((v: any) => ({
        id: v.id,
        lat: v.telemetry?.latitude || -1.2921,
        lng: v.telemetry?.longitude || 36.8219,
        speed: v.status === 'active' ? 55 : 0,
        heading: v.telemetry?.heading || 0,
        fuelLevel: v.telemetry?.fuelLevel || 85,
        status: v.status,
        locationName: v.telemetry?.locationName || 'Nairobi',
      }));

      // Seed initial position values
      vehicles.forEach((v: any) => {
        useGPSStore.getState().updatePosition({
          vehicleId: v.id,
          latitude: v.lat,
          longitude: v.lng,
          speed: v.speed,
          heading: v.heading,
          fuelLevel: v.fuelLevel,
          status: v.status,
          locationName: v.locationName,
          timestamp: new Date().toISOString(),
        });
      });

      this.simulatorTimer = setInterval(async () => {
        // Re-fetch vehicle statuses dynamically to keep UI transitions seamless
        try {
          const freshResponse = await fetch('/api/vehicles');
          if (freshResponse.ok) {
            const freshList = await freshResponse.json();
            freshList.forEach((freshV: any) => {
              const localV = vehicles.find((v: any) => v.id === freshV.id);
              if (localV) {
                // Trigger one-time notification when status shifts in the database
                if (localV.status !== freshV.status) {
                  const statusMap: Record<string, { type: 'success' | 'warning' | 'info'; title: string; desc: string }> = {
                    active: { type: 'success', title: 'Asset Departed', desc: `Vehicle ${freshV.plateNumber} is now active on a dispatch route.` },
                    idle: { type: 'info', title: 'Asset Parked', desc: `Vehicle ${freshV.plateNumber} has arrived and is now idle.` },
                    maintenance: { type: 'warning', title: 'Asset in Servicing', desc: `Vehicle ${freshV.plateNumber} has checked into preventative maintenance.` },
                    offline: { type: 'warning', title: 'Asset Offline', desc: `Vehicle ${freshV.plateNumber} is no longer transmitting telemetry.` },
                  };
                  
                  const transition = statusMap[freshV.status];
                  if (transition) {
                    useUIStore.getState().addNotification(transition.type, transition.title, transition.desc);
                  }
                }

                localV.status = freshV.status;
                if (freshV.status !== 'active') {
                  localV.speed = 0;
                } else if (localV.speed === 0) {
                  localV.speed = 55; // start moving
                }
                // Sync manual telemetry updates immediately if coordinates changed or locationName changed
                if (freshV.telemetry) {
                  localV.locationName = freshV.telemetry.locationName || localV.locationName;
                  if (Math.abs(freshV.telemetry.latitude - localV.lat) > 0.01) {
                    localV.lat = freshV.telemetry.latitude;
                    localV.lng = freshV.telemetry.longitude;
                  }
                  localV.fuelLevel = freshV.telemetry.fuelLevel;
                }
              } else {
                // Add new vehicle dynamically if enrolled
                vehicles.push({
                  id: freshV.id,
                  lat: freshV.telemetry?.latitude || -1.2921,
                  lng: freshV.telemetry?.longitude || 36.8219,
                  speed: freshV.status === 'active' ? 55 : 0,
                  heading: freshV.telemetry?.heading || 0,
                  fuelLevel: freshV.telemetry?.fuelLevel || 85,
                  status: freshV.status,
                  locationName: freshV.telemetry?.locationName || 'Nairobi',
                });
              }
            });
          }
        } catch (err) {
          console.warn('Simulator failed to pull fresh status sync, using local simulation state:', err);
        }

        vehicles.forEach((v: any) => {
          // Only update coords if moving
          if (v.status === 'active') {
            // Drifts coordinate offsets slightly to simulate real road movement
            v.lat += (Math.random() - 0.5) * 0.0015;
            v.lng += (Math.random() - 0.5) * 0.0015;
            v.speed = Math.max(30, Math.min(75, v.speed + Math.floor((Math.random() - 0.5) * 10)));
            v.heading = (v.heading + Math.floor((Math.random() - 0.5) * 20) + 360) % 360;
            v.fuelLevel = Math.max(10, v.fuelLevel - (Math.random() * 0.3));
            
            // Re-geofence simulated movements to display closest town
            const kenyanCitiesList = [
              { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
              { name: 'Mombasa', lat: -4.0435, lng: 39.6682 },
              { name: 'Nakuru', lat: -0.3030, lng: 36.0800 },
              { name: 'Kisumu', lat: -0.1022, lng: 34.7617 },
              { name: 'Eldoret', lat: 0.5143, lng: 35.2698 },
              { name: 'Thika', lat: -1.0396, lng: 37.0900 },
            ];
            let closest = kenyanCitiesList[0];
            let minD = Infinity;
            for (const city of kenyanCitiesList) {
              const d = Math.pow(v.lat - city.lat, 2) + Math.pow(v.lng - city.lng, 2);
              if (d < minD) {
                minD = d;
                closest = city;
              }
            }
            v.locationName = closest.name;
          }

          useGPSStore.getState().updatePosition({
            vehicleId: v.id,
            latitude: Number(v.lat.toFixed(6)),
            longitude: Number(v.lng.toFixed(6)),
            speed: v.speed,
            heading: v.heading,
            fuelLevel: Math.round(v.fuelLevel),
            status: v.status,
            locationName: v.locationName,
            timestamp: new Date().toISOString(),
          });
        });
      }, 3000);
    } catch (e) {
      console.warn('Failed to start database-backed fleet simulation, falling back to static v-1, v-2, v-3', e);
      // Revert to original static mock
      const staticVehicles = [
        { id: 'v-1', lat: -1.2921, lng: 36.8219, speed: 45, heading: 90, locationName: 'Nairobi' },
        { id: 'v-2', lat: -1.2863, lng: 36.8172, speed: 0, heading: 0, locationName: 'Nairobi' },
        { id: 'v-3', lat: -1.3033, lng: 36.8400, speed: 60, heading: 180, locationName: 'Nairobi' },
      ];
      staticVehicles.forEach(v => {
        useGPSStore.getState().updatePosition({
          vehicleId: v.id,
          latitude: v.lat,
          longitude: v.lng,
          speed: v.speed,
          heading: v.heading,
          fuelLevel: 85,
          status: v.speed > 0 ? 'active' : 'idle',
          locationName: v.locationName,
          timestamp: new Date().toISOString(),
        });
      });
      
      this.simulatorTimer = setInterval(() => {
        staticVehicles.forEach(v => {
          if (v.speed > 0) {
            v.lat += (Math.random() - 0.5) * 0.001;
            v.lng += (Math.random() - 0.5) * 0.001;
            v.speed = Math.max(30, Math.min(75, v.speed + Math.floor((Math.random() - 0.5) * 10)));
            v.heading = (v.heading + Math.floor((Math.random() - 0.5) * 20) + 360) % 360;
          }
          useGPSStore.getState().updatePosition({
            vehicleId: v.id,
            latitude: Number(v.lat.toFixed(6)),
            longitude: Number(v.lng.toFixed(6)),
            speed: v.speed,
            heading: v.heading,
            fuelLevel: 85,
            status: v.speed > 0 ? 'active' : 'idle',
            locationName: v.locationName,
            timestamp: new Date().toISOString(),
          });
        });
      }, 3000);
    }
  }
}
