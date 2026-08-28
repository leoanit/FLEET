import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useVehicleDetails, useVehicleActions } from '../../features/vehicles/hooks/useVehicles';
import { useGPSStore } from '../../services/websocket';
import { useServiceLogs, useCreateServiceLog } from '../../hooks/useServiceLogs';
import { getKenyanTown } from '../../utils/location';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import {
  ArrowLeft, MapPin, Gauge, GasPump, User, Calendar,
  Compass, ClipboardText, Plus, X, Wrench, CheckCircle,
} from '@phosphor-icons/react';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  'oil-change': 'Oil Change',
  'tire-rotation': 'Tire Rotation',
  'brake-inspection': 'Brake Inspection',
  'transmission-service': 'Transmission Service',
  'engine-tune-up': 'Engine Tune-Up',
  'electrical-diagnostic': 'Electrical Diagnostic',
  'coolant-flush': 'Coolant Flush',
  'air-filter-replacement': 'Air Filter Replacement',
  'battery-replacement': 'Battery Replacement',
  'general-inspection': 'General Inspection',
  'other': 'Other',
};

const Spinner: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <div className="rounded-full border-2 animate-spin flex-shrink-0"
    style={{ width: size, height: size, borderColor: 'rgba(249,115,22,0.2)', borderTopColor: '#F97316' }} />
);

// ─── Log Service Modal ────────────────────────────────────────────────────────

interface LogServiceModalProps {
  vehicleId: string;
  currentOdometer: number;
  onClose: () => void;
}

const LogServiceModal: React.FC<LogServiceModalProps> = ({ vehicleId, currentOdometer, onClose }) => {
  const createLog = useCreateServiceLog(vehicleId);
  const [form, setForm] = useState({
    serviceType: 'oil-change',
    description: '',
    odometerAtService: currentOdometer,
    cost: '',
    performedBy: '',
    serviceDate: new Date().toISOString().split('T')[0],
    nextServiceMileage: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLog.mutateAsync({
        serviceType: form.serviceType,
        description: form.description,
        odometerAtService: form.odometerAtService,
        cost: form.cost ? parseFloat(form.cost) : 0,
        performedBy: form.performedBy,
        serviceDate: form.serviceDate,
        nextServiceMileage: form.nextServiceMileage ? parseFloat(form.nextServiceMileage) : undefined,
      });
      setSubmitted(true);
      setTimeout(onClose, 1500);
    } catch { /* error shown via mutation state */ }
  };

  const inputCls: React.CSSProperties = {
    width: '100%', borderRadius: 10, background: 'var(--surface-2)',
    border: '1px solid var(--border-1)', color: 'var(--text-primary)',
    padding: '9px 14px', fontSize: 13, fontFamily: 'DM Sans',
    outline: 'none', transition: 'border-color 0.15s',
  };

  const setFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)');
  const setBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = 'var(--border-1)');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <Wrench size={15} weight="duotone" style={{ color: '#F97316' }} />
            </div>
            <span className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Log Service Entry</span>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}>
            <X size={16} weight="bold" />
          </button>
        </div>

        {submitted ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <CheckCircle size={28} weight="duotone" style={{ color: '#34D399' }} />
            </div>
            <p className="font-700 text-lg" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Service Log Recorded!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Maintenance history updated successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-micro font-700 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Service Type</label>
                <select value={form.serviceType}
                  onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}
                  style={{ ...inputCls, appearance: 'none' } as React.CSSProperties}
                  onFocus={setFocus} onBlur={setBlur}>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-micro font-700 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Odometer (km)</label>
                <input type="number" required min="0" value={form.odometerAtService}
                  onChange={e => setForm(f => ({ ...f, odometerAtService: parseInt(e.target.value) || 0 }))}
                  style={inputCls} onFocus={setFocus} onBlur={setBlur} />
              </div>
              <div>
                <label className="block text-micro font-700 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Cost (KSh)</label>
                <input type="number" step="0.01" min="0" value={form.cost}
                  onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                  placeholder="0.00" style={inputCls} onFocus={setFocus} onBlur={setBlur} />
              </div>
              <div>
                <label className="block text-micro font-700 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Service Date</label>
                <input type="date" value={form.serviceDate}
                  onChange={e => setForm(f => ({ ...f, serviceDate: e.target.value }))}
                  style={inputCls} onFocus={setFocus} onBlur={setBlur} />
              </div>
              <div>
                <label className="block text-micro font-700 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Next Service (km)</label>
                <input type="number" min="0" value={form.nextServiceMileage}
                  onChange={e => setForm(f => ({ ...f, nextServiceMileage: e.target.value }))}
                  placeholder="Optional" style={inputCls} onFocus={setFocus} onBlur={setBlur} />
              </div>
              <div className="col-span-2">
                <label className="block text-micro font-700 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Performed By</label>
                <input type="text" value={form.performedBy}
                  onChange={e => setForm(f => ({ ...f, performedBy: e.target.value }))}
                  placeholder="Service center or technician name"
                  style={inputCls} onFocus={setFocus} onBlur={setBlur} />
              </div>
              <div className="col-span-2">
                <label className="block text-micro font-700 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Description / Notes</label>
                <textarea rows={3} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe what was done..."
                  style={{ ...inputCls, resize: 'none' } as React.CSSProperties}
                  onFocus={setFocus} onBlur={setBlur} />
              </div>
            </div>

            {createLog.isError && (
              <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
                {(createLog.error as any)?.message || 'Failed to save service log. Please retry.'}
              </div>
            )}

            <button type="submit" disabled={createLog.isPending}
              className="w-full rounded-xl font-600 flex items-center justify-center gap-2"
              style={{
                background: '#F97316', color: '#04060F', padding: '12px 0', border: 'none',
                cursor: createLog.isPending ? 'not-allowed' : 'pointer', opacity: createLog.isPending ? 0.7 : 1,
                fontFamily: 'Space Grotesk', fontSize: 13,
              }}>
              {createLog.isPending ? <><Spinner size={14} /> Saving...</> : 'Save Service Log'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Main Vehicle Detail Page ─────────────────────────────────────────────────

export const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showLogModal, setShowLogModal] = useState(false);

  const queryClient = useQueryClient();
  const { updateVehicle, isUpdating } = useVehicleActions();

  const { data: vehicle, isLoading, isError } = useVehicleDetails(id || '');
  const { data: serviceLogs, isLoading: logsLoading } = useServiceLogs(id || '');
  const livePositions = useGPSStore(state => state.positions);
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; onConfirm: () => void; isDangerous?: boolean } | null>(null);

  const handleCheckIntoMaintenance = () => {
    if (!vehicle) return;
    setConfirmState({
      title: 'Confirm Maintenance',
      message: `Transition ${vehicle.name} to maintenance status?`,
      isDangerous: false,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await updateVehicle({ id: vehicle.id, status: 'maintenance' });
          queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] });
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        } catch (err) {
          console.error('Failed to transition vehicle to maintenance:', err);
        }
      },
    });
  };

  const handleReleaseFromMaintenance = () => {
    if (!vehicle) return;
    setConfirmState({
      title: 'Release Vehicle',
      message: `Release ${vehicle.name} back to fleet?`,
      isDangerous: false,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await updateVehicle({ id: vehicle.id, status: 'idle' });
          queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] });
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        } catch (err) {
          console.error('Failed to release vehicle from maintenance:', err);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner size={32} />
        <p className="text-micro uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Querying vehicle logs...</p>
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-600 mb-4" style={{ color: '#F87171' }}>Vehicle record could not be retrieved.</p>
        <button onClick={() => navigate('/vehicles')}
          className="rounded-xl font-600 text-sm"
          style={{ background: '#F97316', color: '#04060F', padding: '8px 20px', border: 'none', cursor: 'pointer' }}>
          Back to Fleet
        </button>
      </div>
    );
  }

  const liveTelemetry = livePositions[vehicle.id];
  const currentSpeed      = liveTelemetry ? liveTelemetry.speed        : vehicle.telemetry.speed;
  const currentLat        = liveTelemetry ? liveTelemetry.latitude     : vehicle.telemetry.latitude;
  const currentLng        = liveTelemetry ? liveTelemetry.longitude    : vehicle.telemetry.longitude;
  const currentFuel       = liveTelemetry ? liveTelemetry.fuelLevel    : vehicle.telemetry.fuelLevel;
  const currentStatus     = liveTelemetry ? liveTelemetry.status       : vehicle.status;
  const currentHeading    = liveTelemetry ? liveTelemetry.heading      : vehicle.telemetry.heading;
  const currentLocationName = liveTelemetry ? liveTelemetry.locationName : vehicle.telemetry.locationName;

  const statusColorMap: Record<string, string> = {
    active: '#34D399', idle: '#FBBF24', maintenance: '#F87171', offline: '#94A3B8',
  };
  const statusColor = statusColorMap[currentStatus] ?? '#94A3B8';

  return (
    <>
      <div style={{ color: 'var(--text-primary)', fontFamily: 'DM Sans' }}>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/vehicles')}
            className="p-2 rounded-xl transition-all"
            style={{ border: '1px solid var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-secondary)', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
            <ArrowLeft size={18} weight="bold" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-700 leading-none" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.03em' }}>
                {vehicle.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-700 uppercase tracking-widest"
                style={{ background: `${statusColor}12`, border: `1px solid ${statusColor}25`, color: statusColor }}>
                {currentStatus}
              </span>
            </div>
            <p className="text-micro font-700 uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', fontFamily: 'IBM Plex Mono' }}>
              Registration: {vehicle.plateNumber}
            </p>
          </div>
        </div>

        {/* Core specs grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-5">

          {/* Asset Parameters */}
          <div className="surface-card anim-in">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <p className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Asset Parameters</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Mechanical specifications and limits</p>
            </div>
            <div className="px-5 py-2">
              {[
                { label: 'Manufacturer', value: vehicle.make },
                { label: 'Model', value: vehicle.model },
                { label: 'Year', value: String(vehicle.year) },
                { label: 'Type', value: vehicle.type, capitalize: true },
                { label: 'Odometer', value: `${vehicle.telemetry.odometer.toLocaleString()} km`, mono: true, accent: '#F97316' },
                { label: 'Enrolled', value: new Date(vehicle.createdAt).toLocaleDateString('en-KE'), icon: Calendar },
              ].map((row, i, arr) => (
                <div key={row.label} className="flex justify-between items-center py-2.5 text-xs"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-0)' : 'none' }}>
                  <span className="font-600 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{row.label}</span>
                  <span className="font-600 flex items-center gap-1.5"
                    style={{ color: row.accent ?? 'var(--text-primary)', fontFamily: row.mono ? 'IBM Plex Mono' : 'DM Sans', textTransform: row.capitalize ? 'capitalize' : undefined }}>
                    {row.icon && <row.icon size={13} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />}
                    {row.value}
                  </span>
                </div>
              ))}
              <div className="pt-4 pb-2">
                {currentStatus === 'maintenance' ? (
                  <button onClick={handleReleaseFromMaintenance} disabled={isUpdating}
                    className="w-full rounded-xl font-600 flex items-center justify-center gap-2"
                    style={{ background: '#34D399', color: '#04060F', padding: '10px 0', border: 'none', cursor: isUpdating ? 'not-allowed' : 'pointer', opacity: isUpdating ? 0.7 : 1, fontFamily: 'Space Grotesk', fontSize: 13 }}>
                    {isUpdating ? <Spinner size={14} /> : <CheckCircle size={14} weight="bold" />}
                    Release to Fleet (Idle)
                  </button>
                ) : (
                  <button onClick={handleCheckIntoMaintenance} disabled={isUpdating}
                    className="w-full rounded-xl font-600 flex items-center justify-center gap-2"
                    style={{ background: '#FBBF24', color: '#04060F', padding: '10px 0', border: 'none', cursor: isUpdating ? 'not-allowed' : 'pointer', opacity: isUpdating ? 0.7 : 1, fontFamily: 'Space Grotesk', fontSize: 13 }}>
                    {isUpdating ? <Spinner size={14} /> : <Wrench size={14} weight="bold" />}
                    Check into Maintenance
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Real-Time Metrics */}
          <div className="surface-card anim-in d-100">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <p className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Real-Time Metrics</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Live telematics feeds</p>
            </div>
            <div className="p-5 space-y-3">
              {/* Speed */}
              <div className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                  <Gauge size={18} weight="duotone" style={{ color: '#F97316' }} />
                </div>
                <div>
                  <span className="text-micro uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Speed</span>
                  <span className="text-lg font-700" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>{currentSpeed} kph</span>
                </div>
              </div>

              {/* Fuel */}
              <div className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: currentFuel < 20 ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                    border: `1px solid ${currentFuel < 20 ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
                  }}>
                  <GasPump size={18} weight="duotone" style={{ color: currentFuel < 20 ? '#F87171' : '#34D399' }} />
                </div>
                <div className="flex-1">
                  <span className="text-micro uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Fuel Level</span>
                  <span className="text-lg font-700" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
                    {Math.round(currentFuel)}%
                  </span>
                </div>
              </div>

              {/* Heading */}
              <div className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
                  <Compass size={18} weight="duotone" style={{ color: '#A78BFA' }} />
                </div>
                <div>
                  <span className="text-micro uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Bearing</span>
                  <span className="text-lg font-700" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
                    {currentHeading}°
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Driver */}
          <div className="surface-card anim-in d-200">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <p className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Assigned Operator</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Driver details and status</p>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-6 min-h-[220px]">
              {vehicle.assignedDriver ? (
                <div className="space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full flex items-center justify-center text-xl font-700"
                    style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316' }}>
                    {vehicle.assignedDriver.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-600 text-base mb-2" style={{ color: 'var(--text-primary)' }}>
                      {vehicle.assignedDriver.name}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-700 uppercase tracking-widest"
                      style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', color: '#F97316' }}>
                      Certified Operator
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <User size={40} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-sm font-500" style={{ color: 'var(--text-secondary)' }}>No active driver dispatched</p>
                  <p className="text-micro uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Assign from Dispatch terminal</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map + Audit log */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-5">

          {/* Map panel */}
          <div className="surface-card lg:col-span-2 overflow-hidden anim-in d-200">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <p className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Live Position</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Real-time coordinate stream</p>
            </div>
            <div className="h-80 relative flex items-center justify-center overflow-hidden"
              style={{ background: 'var(--surface-0)' }}>
              {/* Radar rings */}
              <div className="absolute h-72 w-72 rounded-full pointer-events-none"
                style={{ border: '1px solid rgba(249,115,22,0.06)' }}>
                <div className="h-48 w-48 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ border: '1px solid rgba(249,115,22,0.06)' }}>
                  <div className="h-24 w-24 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ border: '1px solid rgba(249,115,22,0.10)' }} />
                </div>
              </div>

              {/* Sweep */}
              <div className="absolute h-72 w-72 rounded-full pointer-events-none animate-spin"
                style={{ borderRight: '1px solid rgba(249,115,22,0.15)', borderTop: '1px solid rgba(249,115,22,0.08)', animationDuration: '10s' }} />

              {/* Marker */}
              <div className="absolute flex flex-col items-center gap-2">
                <div className="rounded-lg px-3 py-1.5 text-[10px] font-600 flex items-center gap-1.5 shadow-xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', color: 'var(--text-primary)' }}>
                  <span className="h-1.5 w-1.5 rounded-full animate-ping" style={{ background: '#34D399' }} />
                  {vehicle.name}: {currentSpeed} kph
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-20 animate-ping" style={{ background: '#F97316' }} />
                  <div className="z-10 h-3.5 w-3.5 rounded-full border border-white" style={{ background: '#F97316' }} />
                </div>
              </div>

              {/* Location tag */}
              <div className="absolute bottom-4 left-4 rounded-xl px-3.5 py-2 text-xs font-600 shadow-2xl"
                style={{ background: 'rgba(4,6,15,0.9)', border: '1px solid var(--border-1)' }}>
                <div className="flex items-center gap-2">
                  <MapPin size={14} weight="duotone" style={{ color: '#F97316' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Location: <span style={{ color: '#F97316' }}>{currentLocationName || getKenyanTown(currentLat, currentLng)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry audit */}
          <div className="surface-card anim-in d-300">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <p className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Telematic Audit Trail</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Live IoT transponder log</p>
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {[
                { label: 'Position Packet Synced', lat: currentLat, lng: currentLng, speed: currentSpeed, fuel: currentFuel, time: 'Just Now', accent: true },
                { label: 'Position Packet Synced', lat: currentLat - 0.0003, lng: currentLng + 0.0002, speed: Math.max(0, currentSpeed - 2), fuel: currentFuel, time: '3s ago', accent: false },
                { label: 'Position Packet Synced', lat: currentLat - 0.0005, lng: currentLng + 0.0005, speed: Math.max(0, currentSpeed - 5), fuel: currentFuel, time: '6s ago', accent: false },
              ].map((item, i) => (
                <div key={i} className="p-3.5 text-xs space-y-1 transition-colors"
                  style={{ borderBottom: '1px solid var(--border-0)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <div className="flex justify-between items-center">
                    <span className="font-600" style={{ color: item.accent ? '#F97316' : 'var(--text-secondary)' }}>{item.label}</span>
                    <span className="text-micro" style={{ color: 'var(--text-tertiary)' }}>{item.time}</span>
                  </div>
                  <p className="font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    Coords: {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                  </p>
                  <p className="text-micro" style={{ color: 'var(--text-tertiary)' }}>
                    Speed: {item.speed} kph | Fuel: {Math.round(item.fuel)}%
                  </p>
                </div>
              ))}
              <div className="p-3.5 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-600 flex items-center gap-1.5" style={{ color: '#34D399' }}>
                    <ClipboardText size={14} weight="duotone" /> Diagnostic OK
                  </span>
                  <span className="text-micro" style={{ color: 'var(--text-tertiary)' }}>10s ago</span>
                </div>
                <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>Standard operational envelope verified</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service History */}
        <div className="surface-card overflow-hidden anim-in d-300">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-0)' }}>
            <div>
              <p className="font-600 text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
                <ClipboardText size={15} weight="duotone" style={{ color: '#F97316' }} /> Service History
              </p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Maintenance records and upcoming service thresholds</p>
            </div>
            <button id="log-service-btn" onClick={() => setShowLogModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg font-600 text-xs"
              style={{ background: '#F97316', color: '#04060F', padding: '7px 14px', border: 'none', cursor: 'pointer' }}>
              <Plus size={14} weight="bold" /> Log Service
            </button>
          </div>
          <div>
            {logsLoading ? (
              <div className="p-8 flex flex-col items-center gap-3">
                <Spinner size={24} />
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Loading service history...</p>
              </div>
            ) : !serviceLogs || serviceLogs.length === 0 ? (
              <div className="p-10 text-center">
                <Wrench size={36} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm font-500 mt-3" style={{ color: 'var(--text-secondary)' }}>No service logs recorded yet</p>
                <p className="text-micro mt-1" style={{ color: 'var(--text-tertiary)' }}>Click "Log Service" to add the first entry.</p>
              </div>
            ) : (
              <div>
                {serviceLogs.map((log, i) => {
                  const progress = log.nextServiceMileage && vehicle
                    ? Math.min(100, Math.round((vehicle.telemetry.odometer / log.nextServiceMileage) * 100))
                    : null;
                  const progressColor = progress === null ? '#F97316' : progress >= 90 ? '#F87171' : progress >= 70 ? '#FBBF24' : '#34D399';

                  return (
                    <div key={log.id} className="p-5 transition-colors"
                      style={{ borderBottom: i < serviceLogs.length - 1 ? '1px solid var(--border-0)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <div className="flex items-start gap-4">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
                          <Wrench size={15} weight="duotone" style={{ color: '#F97316' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                            <span className="font-600 text-sm" style={{ color: 'var(--text-primary)' }}>
                              {SERVICE_TYPE_LABELS[log.serviceType] || log.serviceType}
                            </span>
                            <span className="text-micro" style={{ color: 'var(--text-tertiary)' }}>
                              {new Date(log.serviceDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          {log.description && (
                            <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>{log.description}</p>
                          )}
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                              Odometer: <span className="font-600" style={{ color: 'var(--text-secondary)' }}>
                                {log.odometerAtService.toLocaleString()} km
                              </span>
                            </span>
                            {log.cost > 0 && (
                              <span className="text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                Cost: <span className="font-600" style={{ color: '#34D399' }}>
                                  KSh {log.cost.toLocaleString()}
                                </span>
                              </span>
                            )}
                            {log.performedBy && (
                              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                                By: <span style={{ color: 'var(--text-secondary)' }}>{log.performedBy}</span>
                              </span>
                            )}
                          </div>
                          {log.nextServiceMileage && vehicle && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-micro uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                  Next service at {log.nextServiceMileage.toLocaleString()} km
                                </span>
                                <span className="text-micro font-700" style={{ color: progressColor }}>{progress}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--border-0)' }}>
                                <div className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${progress}%`, background: progressColor }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showLogModal && vehicle && (
        <LogServiceModal
          vehicleId={vehicle.id}
          currentOdometer={vehicle.telemetry.odometer}
          onClose={() => setShowLogModal(false)}
        />
      )}

      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          isDangerous={confirmState.isDangerous}
          onConfirm={confirmState.onConfirm}
          onClose={() => setConfirmState(null)}
        />
      )}
    </>
  );
};
