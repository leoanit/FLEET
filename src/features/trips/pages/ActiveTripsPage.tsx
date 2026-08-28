import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowsClockwise, Compass, Pulse, Play } from '@phosphor-icons/react';
import { ActiveTripCard } from '../components/ActiveTripCard';
import { useActiveTrips, useEndTrip } from '../hooks/useTrips';
import EndTripModal from '../../../pages/driver/EndTripModal';

export const ActiveTripsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: activeTrips = [], isLoading, isError, refetch } = useActiveTrips();
  const endTripMutation = useEndTrip();
  const [endTripDispatchId, setEndTripDispatchId] = useState<string | null>(null);

  const handleEndTrip = (dispatchId: string) => {
    setEndTripDispatchId(dispatchId);
  };

  const endingTrip = activeTrips.find(t => t.dispatchId === endTripDispatchId);

  const activeCount = activeTrips.length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5"
        style={{ borderBottom: '1px solid var(--border-0)' }}>
        <div>
          <h1 className="text-2xl font-700 flex items-center gap-2.5"
            style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
            Active Operations
            <span className="h-2 w-2 rounded-full animate-pulse"
              style={{ background: '#34D399', boxShadow: '0 0 8px rgba(52,211,153,0.5)' }} />
          </h1>
          <p className="text-[10px] font-600 uppercase tracking-wider mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Monitor real-time transit telemetry and register hub arrivals
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()}
            className="h-9 w-9 rounded-xl flex items-center justify-center transition-all"
            style={{ border: '1px solid var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--surface-1)'; }}
            title="Refresh">
            <ArrowsClockwise size={15} />
          </button>
          <button onClick={() => navigate('/trips')}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-700 transition-all"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-1)'; }}>
            <Compass size={14} weight="duotone" /> Dispatch Desk
          </button>
        </div>
      </div>

      {/* RADAR PANEL */}
      <div className="surface-card p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
              <Pulse size={20} weight="duotone" style={{ color: '#F97316' }} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-700 uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Real-Time Tracking Feed
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {activeCount > 0
                  ? `Monitoring ${activeCount} active dispatch run${activeCount !== 1 ? 's' : ''} on route.`
                  : 'No ongoing transits. All fleet assets reported idle.'}
              </p>
            </div>
          </div>
          {activeCount > 0 && (
            <div className="flex items-center gap-1.5 text-[9px] font-700 uppercase tracking-widest px-3 py-1 rounded-full animate-pulse"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399', fontFamily: 'IBM Plex Mono' }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#34D399' }} />
              Radar Active • {activeCount} Live
            </div>
          )}
        </div>
      </div>

      {/* CARDS / STATE */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-8 w-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--border-1)', borderTopColor: '#F97316' }} />
          <p className="text-xs font-600 uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
            Connecting telemetry feeds...
          </p>
        </div>
      ) : isError ? (
        <div className="text-center py-12 rounded-xl text-xs font-700"
          style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
          Telemetry link failed. Confirm logistics services are active.
        </div>
      ) : activeCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-xl"
          style={{ border: '1px dashed var(--border-1)', background: 'var(--surface-1)' }}>
          <div className="p-3 rounded-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
            <Compass size={28} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="text-center">
            <h4 className="text-sm font-700 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              No Active Transits En Route
            </h4>
            <p className="text-xs mt-1 max-w-sm" style={{ color: 'var(--text-tertiary)' }}>
              All fleet assets are currently idle or offline. Dispatch a route to begin monitoring.
            </p>
          </div>
          <button onClick={() => navigate('/trips')}
            className="flex items-center gap-2 h-8 px-4 rounded-lg text-xs font-700 transition-all"
            style={{ background: '#F97316', color: '#04060F' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
            <Play size={12} weight="fill" /> Dispatch a Route
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeTrips.map((trip) => (
            <ActiveTripCard
              key={trip.id}
              trip={trip}
              onEndTrip={handleEndTrip}
              onSelect={(tripId) => navigate(`/trips/${tripId}`)}
              isEnding={endTripMutation.isPending}
            />
          ))}
        </div>
      )}

      {endTripDispatchId !== null && (
        <EndTripModal
          dispatchId={endTripDispatchId}
          dispatchRef={endingTrip?.dispatch?.referenceNumber || endTripDispatchId.slice(0, 8)}
          onClose={() => setEndTripDispatchId(null)}
          onConfirm={async (endingOdometer, fuelUsed) => {
            const completedTrip = await endTripMutation.mutateAsync({
              dispatchId: endTripDispatchId,
              endingOdometer,
              fuelUsed,
            });
            navigate(`/trips/${completedTrip.id}`);
          }}
        />
      )}
    </div>
  );
};
