import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useVehiclesList } from '../../features/vehicles/hooks/useVehicles';
import { useGPSStore, TelemetryPayload } from '../../services/websocket';
import { Vehicle } from '../../features/vehicles/types';
import {
  Truck, GasPump, MapPin, Clock, User, X,
  NavigationArrow, WifiHigh, WifiX, Warning,
} from '@phosphor-icons/react';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active:      '#34D399',
  idle:        '#94A3B8',
  maintenance: '#FBBF24',
  offline:     '#F87171',
};

const STATUS_LABELS: Record<string, string> = {
  active:      'Active',
  idle:        'Idle',
  maintenance: 'Maintenance',
  offline:     'Offline',
};

// ─── GeoJSON Builder ─────────────────────────────────────────────────────────
// Merges vehicle metadata (name, plate, driver) with live GPS positions.
// Live positions take precedence over stored telemetry when available.

function buildGeoJSON(
  vehicles: Vehicle[],
  positions: Record<string, TelemetryPayload>
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: vehicles.map(v => {
      const live = positions[v.id];
      const vAny = v as any;
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            live?.longitude ?? v.telemetry?.longitude ?? 36.8219,
            live?.latitude  ?? v.telemetry?.latitude  ?? -1.2921,
          ],
        },
        properties: {
          vehicleId:    v.id,
          name:         v.name,
          plateNumber:  v.plateNumber,
          status:       live?.status ?? v.status,
          speed:        live?.speed  ?? 0,
          fuelLevel:    live?.fuelLevel ?? v.telemetry?.fuelLevel ?? 0,
          locationName: live?.locationName ?? v.telemetry?.locationName ?? '',
          driverName:   vAny.assignedDriverName ?? 'Unassigned',
          timestamp:    live?.timestamp ?? v.telemetry?.lastUpdated ?? '',
        },
      };
    }),
  };
}

// ─── Token Missing Banner ─────────────────────────────────────────────────────

const TokenMissingBanner: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-8"
    style={{ background: 'var(--surface-0)' }}>
    <div className="h-20 w-20 rounded-2xl flex items-center justify-center"
      style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
      <Warning size={40} weight="duotone" style={{ color: '#FBBF24' }} />
    </div>
    <div className="max-w-sm">
      <h2 className="text-xl font-700 mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
        Mapbox Token Required
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}>
        Add your Mapbox public token to{' '}
        <code className="px-1.5 py-0.5 rounded" style={{ color: '#F97316', background: 'var(--surface-2)', fontFamily: 'IBM Plex Mono' }}>.env</code>{' '}
        in the project root:
      </p>
      <pre className="mt-4 text-left rounded-xl px-5 py-4 text-xs whitespace-pre-wrap"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', color: '#F97316', fontFamily: 'IBM Plex Mono' }}>
        VITE_MAPBOX_TOKEN=pk.eyJ1Ijoixxxx...
      </pre>
      <p className="text-xs mt-4 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        Get a free token at{' '}
        <span style={{ color: '#F97316', fontWeight: 600 }}>mapbox.com</span>
        {' '}→ Account → Tokens. Then restart the dev server.
      </p>
    </div>
  </div>
);

// ─── Vehicle Side Panel ───────────────────────────────────────────────────────

interface VehiclePanelProps {
  vehicleId: string;
  vehicles: Vehicle[];
  positions: Record<string, TelemetryPayload>;
  onClose: () => void;
}

const VehiclePanel: React.FC<VehiclePanelProps> = ({ vehicleId, vehicles, positions, onClose }) => {
  const vehicle = vehicles.find(v => v.id === vehicleId);
  const live = positions[vehicleId];

  if (!vehicle) return null;

  const vAny = vehicle as any;
  const status       = live?.status      ?? vehicle.status;
  const fuelLevel    = live?.fuelLevel   ?? vehicle.telemetry?.fuelLevel ?? 0;
  const speed        = live?.speed       ?? 0;
  const location     = live?.locationName ?? vehicle.telemetry?.locationName ?? '—';
  const driverName   = vAny.assignedDriverName ?? 'Unassigned';
  const lastUpdated  = live?.timestamp   ?? vehicle.telemetry?.lastUpdated ?? '';
  const statusColor  = STATUS_COLORS[status] ?? '#64748b';
  const statusLabel  = STATUS_LABELS[status] ?? status;

  const timeAgo = (ts: string): string => {
    if (!ts) return '—';
    const diff = Date.now() - new Date(ts).getTime();
    const sec  = Math.floor(diff / 1000);
    if (sec < 60)  return `${sec}s ago`;
    const min  = Math.floor(sec / 60);
    if (min < 60)  return `${min}m ago`;
    return `${Math.floor(min / 60)}h ago`;
  };

  const fuelColor = fuelLevel < 20 ? '#F87171' : fuelLevel < 40 ? '#FBBF24' : '#34D399';

  return (
    <div className="absolute top-4 right-4 z-10 w-72 rounded-2xl shadow-2xl overflow-hidden"
      style={{ background: 'rgba(4,6,15,0.95)', border: '1px solid var(--border-1)', backdropFilter: 'blur(12px)' }}>

      {/* Header */}
      <div className="flex items-start justify-between p-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
            <Truck size={18} weight="duotone" style={{ color: '#F97316' }} />
          </div>
          <div>
            <p className="font-600 text-sm leading-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>{vehicle.name}</p>
            <p className="text-micro font-700 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)', fontFamily: 'IBM Plex Mono' }}>{vehicle.plateNumber}</p>
          </div>
        </div>
        <button onClick={onClose}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}>
          <X size={15} weight="bold" />
        </button>
      </div>

      {/* Status badge */}
      <div className="px-4 pt-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-600"
          style={{ background: `${statusColor}18`, color: statusColor }}>
          <span className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'animate-pulse' : ''}`}
            style={{ background: statusColor }} />
          {statusLabel}
          {status === 'active' && speed > 0 && ` · ${speed} km/h`}
        </span>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-3">

        {/* Fuel gauge */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <GasPump size={13} weight="duotone" />
              <span>Fuel Level</span>
            </div>
            <span className="text-xs font-700" style={{ color: fuelColor }}>
              {Math.round(fuelLevel)}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--border-0)' }}>
            <div className="h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${fuelLevel}%`, background: fuelColor }} />
          </div>
        </div>

        {/* Speed + Location */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-1)' }}>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-tertiary)' }}>
              <NavigationArrow size={11} weight="duotone" />
              <span className="text-[9px] font-700 uppercase tracking-wide">Speed</span>
            </div>
            <p className="text-sm font-700" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
              {speed} <span className="text-xs font-400" style={{ color: 'var(--text-tertiary)' }}>km/h</span>
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-1)' }}>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-tertiary)' }}>
              <MapPin size={11} weight="duotone" />
              <span className="text-[9px] font-700 uppercase tracking-wide">Location</span>
            </div>
            <p className="text-sm font-700 truncate" style={{ color: 'var(--text-primary)' }}>{location || '—'}</p>
          </div>
        </div>

        {/* Driver */}
        <div className="rounded-xl p-3" style={{ background: 'var(--surface-1)' }}>
          <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-tertiary)' }}>
            <User size={11} weight="duotone" />
            <span className="text-[9px] font-700 uppercase tracking-wide">Driver</span>
          </div>
          <p className="text-sm font-600" style={{ color: 'var(--text-primary)' }}>{driverName}</p>
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-1.5 text-xs pl-0.5" style={{ color: 'var(--text-tertiary)' }}>
          <Clock size={11} weight="duotone" />
          <span>Updated {timeAgo(lastUpdated)}</span>
        </div>
      </div>

      {/* Footer link */}
      <div className="px-4 pb-4">
        <Link to={`/vehicles/${vehicle.id}`}
          className="block w-full text-center py-2.5 rounded-xl text-xs font-600 transition-colors"
          style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', color: '#F97316' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.1)')}>
          View Full Details →
        </Link>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const GpsMapPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<mapboxgl.Map | null>(null);
  const mapLoadedRef    = useRef(false);
  const [mapReady, setMapReady]               = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const { data: vehicles = [] } = useVehiclesList();
  const positions    = useGPSStore(state => state.positions);
  const isConnected  = useGPSStore(state => state.isConnected);

  const token = (import.meta as any).env?.VITE_MAPBOX_TOKEN;
  const hasToken = token && token !== 'pk.your_token_here';

  // Memoised GeoJSON — only rebuilds when vehicles or positions change
  const getGeoJSON = useCallback(
    () => buildGeoJSON(vehicles, positions),
    [vehicles, positions]
  );

  // Fleet summary counts per status
  const counts = vehicles.reduce<Record<string, number>>((acc, v) => {
    const s = positions[v.id]?.status ?? v.status;
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  // ── Initialize Mapbox once on mount ──────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || !hasToken || mapRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style:     'mapbox://styles/mapbox/dark-v11',
      center:    [37.5, -1.0], // Kenya
      zoom:      5.5,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      // Add a GeoJSON source — this is the single data object the map reads from.
      // We call source.setData() later to update positions without re-creating layers.
      map.addSource('vehicles', {
        type: 'geojson',
        data: buildGeoJSON(vehicles, positions),
      });

      // Glow halo — a blurred large circle behind each marker
      map.addLayer({
        id:     'vehicles-glow',
        type:   'circle',
        source: 'vehicles',
        paint: {
          'circle-radius':  24,
          'circle-color':   buildColorExpression(),
          'circle-opacity': 0.12,
          'circle-blur':    1,
        },
      });

      // Main marker dot
      map.addLayer({
        id:     'vehicles-circles',
        type:   'circle',
        source: 'vehicles',
        paint: {
          'circle-radius':        9,
          'circle-color':         buildColorExpression(),
          'circle-stroke-width':  2.5,
          'circle-stroke-color':  '#0f172a',
        },
      });

      // Click on a marker → select that vehicle
      map.on('click', 'vehicles-circles', (e) => {
        const id = e.features?.[0]?.properties?.vehicleId;
        if (id) setSelectedVehicleId(id);
      });

      // Click on the map background → deselect
      map.on('click', (e) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: ['vehicles-circles'] });
        if (!hits.length) setSelectedVehicleId(null);
      });

      map.on('mouseenter', 'vehicles-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'vehicles-circles', () => { map.getCanvas().style.cursor = ''; });

      mapLoadedRef.current = true;
      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      mapLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // Intentionally empty deps — we only want to initialize once.
    // getGeoJSON updates are handled by the separate effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken]);

  // ── Live update: push new GeoJSON to the source whenever data changes ─────
  // This is the core of the live map. Instead of destroying and recreating
  // layers, we just swap the data. Mapbox re-renders only what changed.
  useEffect(() => {
    if (!mapRef.current || !mapLoadedRef.current) return;
    const source = mapRef.current.getSource('vehicles') as mapboxgl.GeoJSONSource | undefined;
    source?.setData(getGeoJSON());
  }, [getGeoJSON, mapReady]);

  return (
    // -m-6 breaks out of the DashboardLayout's p-6 padding so the map is edge-to-edge
    <div className="-m-6 relative overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>

      {!hasToken ? (
        <TokenMissingBanner />
      ) : (
        <>
          {/* Map canvas — Mapbox renders into this div */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* ── Top-left overlay: connection status + vehicle count ── */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-xl px-3 py-2 shadow-lg"
            style={{ background: 'rgba(4,6,15,0.9)', border: '1px solid var(--border-1)', backdropFilter: 'blur(8px)' }}>
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#34D399' }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#34D399' }} />
                </span>
                <WifiHigh size={13} weight="duotone" style={{ color: '#34D399' }} />
                <span className="text-[11px] font-700 uppercase tracking-widest" style={{ color: '#34D399' }}>Live</span>
              </>
            ) : (
              <>
                <WifiX size={13} weight="duotone" style={{ color: '#FBBF24' }} />
                <span className="text-[11px] font-700 uppercase tracking-widest" style={{ color: '#FBBF24' }}>Simulated</span>
              </>
            )}
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 700 }}>·</span>
            <span className="text-[11px] font-500" style={{ color: 'var(--text-secondary)' }}>{vehicles.length} vehicles</span>
          </div>

          {/* ── Fleet status chips below the connection pill ── */}
          <div className="absolute top-14 left-4 z-10 flex flex-col gap-1.5">
            {Object.entries(STATUS_LABELS).map(([key, label]) =>
              counts[key] ? (
                <div key={key} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 shadow-md"
                  style={{ background: 'rgba(4,6,15,0.9)', border: '1px solid var(--border-1)', backdropFilter: 'blur(8px)' }}>
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[key] }} />
                  <span className="text-[11px] font-500" style={{ color: 'var(--text-secondary)' }}>
                    {counts[key]} {label}
                  </span>
                </div>
              ) : null
            )}
          </div>

          {/* ── Vehicle detail panel (slides in from right on marker click) ── */}
          {selectedVehicleId && (
            <VehiclePanel
              vehicleId={selectedVehicleId}
              vehicles={vehicles}
              positions={positions}
              onClose={() => setSelectedVehicleId(null)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default GpsMapPage;

// ─── Mapbox paint expression helper ──────────────────────────────────────────
// Returns a Mapbox GL expression that maps the 'status' property to a color.
// Defined outside the component so it isn't recreated on every render.
function buildColorExpression(): mapboxgl.Expression {
  return [
    'match', ['get', 'status'],
    'active',      STATUS_COLORS.active,
    'idle',        STATUS_COLORS.idle,
    'maintenance', STATUS_COLORS.maintenance,
    'offline',     STATUS_COLORS.offline,
    '#64748b',
  ];
}
