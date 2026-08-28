import React, { useState, useEffect } from 'react';
import { Trip } from '../types';
import { Clock, Truck, User, MapPin, CheckCircle, ArrowRight } from '@phosphor-icons/react';

interface ActiveTripCardProps {
  trip: Trip;
  onEndTrip: (dispatchId: string) => void;
  onSelect: (tripId: string) => void;
  isEnding?: boolean;
}

export const ActiveTripCard: React.FC<ActiveTripCardProps> = ({
  trip, onEndTrip, onSelect, isEnding = false,
}) => {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(trip.startTime).getTime();
      const diff = Math.max(0, Date.now() - start);
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      const fmt = (n: number) => n.toString().padStart(2, '0');
      return `${fmt(hrs)}:${fmt(mins)}:${fmt(secs)}`;
    };

    setElapsed(calculateElapsed());
    const timer = setInterval(() => setElapsed(calculateElapsed()), 1000);
    return () => clearInterval(timer);
  }, [trip.startTime]);

  const dispatch = trip.dispatch;

  return (
    <div className="surface-card p-5 transition-all duration-200"
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-0)')}>

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
        <div>
          <span className="text-xs font-700 tracking-wider" style={{ color: '#F97316', fontFamily: 'IBM Plex Mono' }}>
            {dispatch?.referenceNumber || 'TRIP-ACTIVE'}
          </span>
          <h4 className="text-xs font-600 uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Active Logistics Run
          </h4>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-700 uppercase tracking-widest px-2.5 py-0.5 rounded-full animate-pulse"
          style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399' }}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" /> In Transit
        </span>
      </div>

      {/* Route */}
      <div className="space-y-3.5 mb-5">
        <div className="flex items-start gap-3">
          <MapPin size={15} weight="duotone" style={{ color: '#60A5FA', marginTop: 2, flexShrink: 0 }} />
          <div className="text-xs">
            <span className="text-[10px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Route Origin</span>
            <span className="font-600 text-sm block mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {dispatch?.origin || 'Pending'}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin size={15} weight="duotone" style={{ color: '#F87171', marginTop: 2, flexShrink: 0 }} />
          <div className="text-xs">
            <span className="text-[10px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Destination Hub</span>
            <span className="font-600 text-sm block mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {dispatch?.destination || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Assets */}
      <div className="grid grid-cols-2 gap-3 pt-4 pb-1 mb-5" style={{ borderTop: '1px solid var(--border-0)' }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
            <User size={13} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Operator</span>
            <span className="text-xs font-700 truncate block" style={{ color: 'var(--text-secondary)' }}>
              {dispatch?.driverName || 'Unassigned'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
            <Truck size={13} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Fleet Asset</span>
            <span className="text-xs font-700 truncate block" style={{ color: 'var(--text-secondary)' }}>
              {dispatch?.vehicleName || 'Unassigned'}
            </span>
          </div>
        </div>
      </div>

      {/* Timer + Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
        <div className="flex items-center gap-2">
          <Clock size={15} weight="duotone" style={{ color: '#34D399' }} />
          <div>
            <span className="text-[9px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Transit Time</span>
            <span className="font-700 text-sm tracking-widest block" style={{ color: '#34D399', fontFamily: 'IBM Plex Mono' }}>
              {elapsed}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => onSelect(trip.id)}
            className="flex items-center gap-1 h-8 px-3 rounded-lg text-[10px] font-700 uppercase tracking-wider transition-all"
            style={{ border: '1px solid var(--border-1)', color: 'var(--text-secondary)', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            Telemetry <ArrowRight size={12} />
          </button>

          <button onClick={() => { if (dispatch) onEndTrip(dispatch.id); }}
            disabled={isEnding}
            className="flex items-center gap-1 h-8 px-3 rounded-lg text-[10px] font-700 uppercase tracking-wider transition-all"
            style={{ background: isEnding ? 'rgba(248,113,113,0.5)' : '#F87171', color: '#04060F' }}
            onMouseEnter={e => !isEnding && (e.currentTarget.style.boxShadow = '0 0 12px rgba(248,113,113,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
            {isEnding
              ? <><div className="h-3 w-3 rounded-full border-2 border-black/30 border-t-black animate-spin" /> Ending...</>
              : <><CheckCircle size={12} weight="bold" /> Complete</>}
          </button>
        </div>
      </div>
    </div>
  );
};
