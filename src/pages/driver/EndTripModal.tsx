import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Gauge, GasPump, Path } from '@phosphor-icons/react';
import apiClient from '../../services/apiClient';

interface EndTripModalProps {
  onClose: () => void;
  dispatchId: string;
  dispatchRef: string;
  onConfirm: (endingOdometer: number, fuelUsed: number) => Promise<void>;
}

const Spinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <div
    className="rounded-full border-2 animate-spin flex-shrink-0"
    style={{ width: size, height: size, borderColor: 'rgba(249,115,22,0.2)', borderTopColor: '#F97316' }}
  />
);

const EndTripModal: React.FC<EndTripModalProps> = ({ onClose, dispatchId, dispatchRef, onConfirm }) => {
  const [endingOdometer, setEndingOdometer] = useState('');
  const [fuelUsed, setFuelUsed] = useState('');
  const [startOdometer, setStartOdometer] = useState<number>(0);
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [lastInsertedOdometer, setLastInsertedOdometer] = useState<number | null>(null);
  const [lastInsertedFuel, setLastInsertedFuel] = useState<number | null>(null);

  useEffect(() => {
    const fetchTripAndAssetData = async () => {
      try {
        setIsLoadingTrip(true);
        const tripResponse = await apiClient.get(`/trips/${dispatchId}`);
        const trip = tripResponse.data;
        if (!trip) return;

        if (trip.startOdometer !== undefined) setStartOdometer(trip.startOdometer);

        const vehicleId = trip.dispatch?.vehicleId;
        if (vehicleId) {
          const [vehicleResponse, logsResponse] = await Promise.all([
            apiClient.get(`/vehicles/${vehicleId}`),
            apiClient.get(`/vehicles/${vehicleId}/service-logs`),
          ]);

          const vehicle = vehicleResponse.data;
          const logs = logsResponse.data;

          if (vehicle?.telemetry?.odometer && vehicle.telemetry.odometer >= trip.startOdometer) {
            setLastInsertedOdometer(vehicle.telemetry.odometer);
            setEndingOdometer(String(vehicle.telemetry.odometer));
          }

          if (logs && Array.isArray(logs)) {
            const tripStartTime = new Date(trip.startTime).getTime();
            let totalFuelDuringTrip = 0;
            logs.forEach((log: any) => {
              const logTime = new Date(log.serviceDate).getTime();
              if (logTime >= tripStartTime) {
                const match = log.description?.match(/Pumped ([\d.]+) liters/i);
                if (match) totalFuelDuringTrip += Number(match[1]);
              }
            });
            if (totalFuelDuringTrip > 0) {
              setLastInsertedFuel(totalFuelDuringTrip);
              setFuelUsed(String(totalFuelDuringTrip));
            }
          }
        }
      } catch (err) {
        console.error('Failed to retrieve active trip and asset telemetry:', err);
      } finally {
        setIsLoadingTrip(false);
      }
    };

    fetchTripAndAssetData();
  }, [dispatchId]);

  const endOdoNum = Number(endingOdometer);
  const fuelNum = Number(fuelUsed);
  const isValidOdometer = endingOdometer !== '' && !isNaN(endOdoNum) && endOdoNum >= startOdometer;
  const isValidFuel = fuelUsed !== '' && !isNaN(fuelNum) && fuelNum >= 0;
  const tripDistance = isValidOdometer ? (endOdoNum - startOdometer) : 0;
  const canSubmit = isValidOdometer && isValidFuel && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setIsSubmitting(true);
    try {
      await onConfirm(endOdoNum, fuelNum);
      setSubmitted(true);
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete trip. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelCls: React.CSSProperties = {
    display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 6, color: 'var(--text-tertiary)', fontFamily: 'DM Sans',
  };

  const inputBase: React.CSSProperties = {
    width: '100%', borderRadius: 12, background: 'var(--surface-2)',
    border: '1px solid var(--border-1)', padding: '12px 16px',
    fontSize: 15, color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono',
    outline: 'none', transition: 'border-color 0.15s',
  };

  const setFocusOrange = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)');
  const setBlurDefault = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = 'var(--border-1)');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
              <Gauge size={17} weight="duotone" style={{ color: '#F87171' }} />
            </div>
            <div>
              <span className="font-600 block text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Complete Trip</span>
              <span className="text-micro uppercase tracking-wider" style={{ color: 'var(--text-tertiary)', fontFamily: 'DM Sans' }}>
                Dispatch #{dispatchRef}
              </span>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}>
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-10 text-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <CheckCircle size={30} weight="duotone" style={{ color: '#34D399' }} />
            </div>
            <p className="font-700 text-lg mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Trip Completed!</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}>
              {tripDistance.toLocaleString()} km covered · {fuelNum} L consumed
            </p>
            <p className="text-micro mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Vehicle odometer and trip logs have been updated.
            </p>
          </div>
        ) : isLoadingTrip ? (
          <div className="p-10 flex flex-col items-center gap-4">
            <Spinner size={32} />
            <p className="text-micro uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
              Loading trip data...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">

            {error && (
              <div className="rounded-xl p-3 flex items-center gap-2 text-xs font-600"
                style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
                <X size={14} weight="bold" style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Starting Odometer (read-only) */}
            <div>
              <label style={labelCls}>Starting Odometer (km)</label>
              <div className="flex items-center gap-3 rounded-xl py-3.5 px-4"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                <Gauge size={16} weight="duotone" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <span className="text-base" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }}>
                  {startOdometer.toLocaleString()} km
                </span>
              </div>
            </div>

            {/* Ending Odometer */}
            <div>
              <label style={labelCls}>
                Ending Odometer (km) <span style={{ color: '#F87171' }}>*</span>
              </label>
              <div className="relative">
                <Gauge size={16} weight="duotone" style={{
                  color: 'var(--text-tertiary)', position: 'absolute', left: 16,
                  top: '50%', transform: 'translateY(-50%)', flexShrink: 0,
                }} />
                <input
                  type="number" min={startOdometer} step="0.1" required
                  value={endingOdometer} onChange={e => setEndingOdometer(e.target.value)}
                  style={{
                    ...inputBase, paddingLeft: 44,
                    borderColor: endingOdometer && !isValidOdometer ? 'rgba(248,113,113,0.5)' : 'var(--border-1)',
                  }}
                  placeholder={`Min ${startOdometer.toLocaleString()}`}
                  onFocus={setFocusOrange} onBlur={setBlurDefault}
                />
              </div>
              {lastInsertedOdometer !== null && (
                <p className="text-micro mt-1.5 pl-1" style={{ color: '#34D399' }}>
                  Pre-filled from last reported odometer: {lastInsertedOdometer.toLocaleString()} km
                </p>
              )}
              {endingOdometer && !isValidOdometer && (
                <p className="text-micro mt-1.5 pl-1" style={{ color: '#F87171' }}>
                  Must be ≥ starting odometer ({startOdometer.toLocaleString()} km)
                </p>
              )}
            </div>

            {/* Fuel Consumed */}
            <div>
              <label style={labelCls}>
                Fuel Consumed (Liters) <span style={{ color: '#F87171' }}>*</span>
              </label>
              <div className="relative">
                <GasPump size={16} weight="duotone" style={{
                  color: 'var(--text-tertiary)', position: 'absolute', left: 16,
                  top: '50%', transform: 'translateY(-50%)', flexShrink: 0,
                }} />
                <input
                  type="number" min="0" step="0.1" required
                  value={fuelUsed} onChange={e => setFuelUsed(e.target.value)}
                  style={{ ...inputBase, paddingLeft: 44 }}
                  placeholder="0.0"
                  onFocus={setFocusOrange} onBlur={setBlurDefault}
                />
              </div>
              {lastInsertedFuel !== null && (
                <p className="text-micro mt-1.5 pl-1" style={{ color: '#34D399' }}>
                  Pre-filled from logged fuel refills: {lastInsertedFuel} L
                </p>
              )}
            </div>

            {/* Trip Summary */}
            {isValidOdometer && isValidFuel && (
              <div className="rounded-xl p-4 space-y-2.5"
                style={{ background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.15)' }}>
                <p className="text-micro font-700 uppercase tracking-widest" style={{ color: '#F97316' }}>Trip Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5">
                    <Path size={16} weight="duotone" style={{ color: '#F97316', flexShrink: 0 }} />
                    <div>
                      <p className="text-micro uppercase" style={{ color: 'var(--text-tertiary)' }}>Distance</p>
                      <p className="text-sm font-700" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
                        {tripDistance.toLocaleString()} km
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <GasPump size={16} weight="duotone" style={{ color: '#FBBF24', flexShrink: 0 }} />
                    <div>
                      <p className="text-micro uppercase" style={{ color: 'var(--text-tertiary)' }}>Fuel Used</p>
                      <p className="text-sm font-700" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
                        {fuelNum} L
                      </p>
                    </div>
                  </div>
                </div>
                {tripDistance > 0 && fuelNum > 0 && (
                  <div className="pt-2 flex items-center justify-between"
                    style={{ borderTop: '1px solid rgba(249,115,22,0.1)' }}>
                    <span className="text-micro uppercase" style={{ color: 'var(--text-tertiary)' }}>Efficiency</span>
                    <span className="text-xs font-700" style={{ color: '#F97316', fontFamily: 'IBM Plex Mono' }}>
                      {(tripDistance / fuelNum).toFixed(1)} km/L
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={!canSubmit}
              className="w-full rounded-xl font-700 text-base flex items-center justify-center gap-2.5"
              style={{
                background: canSubmit ? '#F97316' : 'var(--surface-2)',
                color: canSubmit ? '#04060F' : 'var(--text-tertiary)',
                padding: '14px 0', border: 'none',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                fontFamily: 'Space Grotesk',
                boxShadow: canSubmit ? '0 0 20px rgba(249,115,22,0.3)' : 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (canSubmit) e.currentTarget.style.boxShadow = '0 0 30px rgba(249,115,22,0.45)'; }}
              onMouseLeave={e => { if (canSubmit) e.currentTarget.style.boxShadow = canSubmit ? '0 0 20px rgba(249,115,22,0.3)' : 'none'; }}>
              {isSubmitting ? (
                <><Spinner size={18} /> Processing...</>
              ) : (
                'Confirm & Complete Trip'
              )}
            </button>

            <p className="text-micro text-center leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              This action finalizes the dispatch, updates vehicle telemetry, and releases driver and vehicle to idle.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default EndTripModal;
