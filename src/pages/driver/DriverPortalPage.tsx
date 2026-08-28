import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useDispatches, useStartTrip, useEndTrip } from '../../features/trips/hooks/useTrips';
import apiClient from '../../services/apiClient';
import EndTripModal from './EndTripModal';
import {
  Truck, MapPin, NavigationArrow, GasPump, Warning, SignOut,
  Play, Square, CaretRight, CheckCircle, Pulse, X, Lock,
} from '@phosphor-icons/react';

const Spinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <div className="rounded-full border-2 animate-spin flex-shrink-0"
    style={{ width: size, height: size, borderColor: 'rgba(249,115,22,0.2)', borderTopColor: '#F97316' }} />
);

// ─── Fuel Log Modal ────────────────────────────────────────────────────────────

interface FuelLogModalProps {
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
}

const FuelLogModal: React.FC<FuelLogModalProps> = ({ onClose, vehicleId, vehicleName }) => {
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [odometer, setOdometer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fuelError, setFuelError] = useState('');

  const inputCls: React.CSSProperties = {
    width: '100%', borderRadius: 12, background: 'var(--surface-2)',
    border: '1px solid var(--border-1)', color: 'var(--text-primary)',
    padding: '12px 16px', fontSize: 14, fontFamily: 'DM Sans',
    outline: 'none', transition: 'border-color 0.15s',
  };

  const setFocus = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)');
  const setBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = 'var(--border-1)');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFuelError('');
    setIsSubmitting(true);
    const totalCost = Number(liters) * Number(pricePerLiter);
    try {
      await apiClient.post(`/vehicles/${vehicleId}/service-logs`, {
        serviceType: 'other',
        description: `Fuel Refill: Pumped ${liters} liters of diesel at KSh ${pricePerLiter}/liter.`,
        odometerAtService: Number(odometer),
        cost: totalCost,
        performedBy: 'Local Fuel Station',
        serviceDate: new Date().toISOString(),
      });
      await apiClient.post(`/vehicles/${vehicleId}/telemetry`, {
        odometer: Number(odometer),
        fuelLevel: 100,
      });
      setSubmitted(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error('Failed to log fuel refill:', err);
      setFuelError('Failed to submit fuel receipt. Please check server connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <GasPump size={15} weight="duotone" style={{ color: '#FBBF24' }} />
            </div>
            <span className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
              Log Fuel: {vehicleName}
            </span>
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
          <div className="p-8 text-center">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <CheckCircle size={24} weight="duotone" style={{ color: '#34D399' }} />
            </div>
            <p className="font-700 mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Fuel Logged!</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Odometer & fuel level updated.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-micro font-700 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Liters Pumped</label>
              <input type="number" step="0.01" min="0" required value={liters}
                onChange={e => setLiters(e.target.value)} style={inputCls} placeholder="0.00"
                onFocus={setFocus} onBlur={setBlur} />
            </div>
            <div>
              <label className="block text-micro font-700 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Price per Liter (KSh)</label>
              <input type="number" step="0.01" min="0" required value={pricePerLiter}
                onChange={e => setPricePerLiter(e.target.value)} style={inputCls} placeholder="0.00"
                onFocus={setFocus} onBlur={setBlur} />
            </div>
            <div>
              <label className="block text-micro font-700 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Current Odometer (km)</label>
              <input type="number" min="0" required value={odometer}
                onChange={e => setOdometer(e.target.value)} style={inputCls} placeholder="Enter odometer in km"
                onFocus={setFocus} onBlur={setBlur} />
            </div>
            {liters && pricePerLiter && (
              <div className="rounded-xl p-3.5 flex justify-between items-center"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                <span className="text-sm font-500" style={{ color: 'var(--text-secondary)' }}>Total Cost</span>
                <span className="font-700 text-base" style={{ color: '#FBBF24', fontFamily: 'IBM Plex Mono' }}>
                  KSh {(Number(liters) * Number(pricePerLiter)).toLocaleString()}
                </span>
              </div>
            )}
            {fuelError && (
              <div className="rounded-xl p-3 flex items-center gap-2 text-xs font-600"
                style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
                <Warning size={14} weight="duotone" style={{ flexShrink: 0 }} />
                {fuelError}
              </div>
            )}
            <button type="submit" disabled={isSubmitting}
              className="w-full rounded-xl font-700 text-base flex items-center justify-center gap-2"
              style={{ background: '#FBBF24', color: '#04060F', padding: '14px 0', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1, fontFamily: 'Space Grotesk' }}>
              {isSubmitting ? <><Spinner size={18} /> Saving...</> : 'Submit Fuel Log'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Telemetry Update Modal ───────────────────────────────────────────────────

interface TelemetryUpdateModalProps {
  onClose: () => void;
  vehicleId: string;
}

const TelemetryUpdateModal: React.FC<TelemetryUpdateModalProps> = ({ onClose, vehicleId }) => {
  const [odometer, setOdometer] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');
  const [locationName, setLocationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [telemetryError, setTelemetryError] = useState('');

  const cities = ['Nairobi', 'Mombasa', 'Nakuru', 'Kisumu', 'Eldoret', 'Thika'];

  useEffect(() => {
    const fetchCurrentTelemetry = async () => {
      try {
        const response = await apiClient.get(`/vehicles/${vehicleId}`);
        if (response.data?.telemetry) {
          setOdometer(String(response.data.telemetry.odometer || ''));
          setFuelLevel(String(Math.round(response.data.telemetry.fuelLevel) || ''));
        }
      } catch (err) {
        console.error('Failed to pre-fill status telemetry:', err);
      }
    };
    fetchCurrentTelemetry();
  }, [vehicleId]);

  const inputCls: React.CSSProperties = {
    width: '100%', borderRadius: 12, background: 'var(--surface-2)',
    border: '1px solid var(--border-1)', color: 'var(--text-primary)',
    padding: '12px 16px', fontSize: 14, fontFamily: 'DM Sans',
    outline: 'none', transition: 'border-color 0.15s',
  };

  const setFocus = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)');
  const setBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = 'var(--border-1)');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTelemetryError('');
    setIsSubmitting(true);
    try {
      await apiClient.post(`/vehicles/${vehicleId}/telemetry`, {
        odometer: odometer ? Number(odometer) : undefined,
        fuelLevel: fuelLevel ? Number(fuelLevel) : undefined,
        locationName: locationName || undefined,
      });
      setSubmitted(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error('Failed to update telemetry:', err);
      setTelemetryError('Failed to report telemetry. Please check server connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <MapPin size={15} weight="duotone" style={{ color: '#F97316' }} />
            </div>
            <span className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
              Report Status Update
            </span>
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
          <div className="p-8 text-center">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <CheckCircle size={24} weight="duotone" style={{ color: '#34D399' }} />
            </div>
            <p className="font-700 mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Status Reported!</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Dispatcher has been updated.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-micro font-700 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                Odometer (km) <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input type="number" min="0" value={odometer}
                onChange={e => setOdometer(e.target.value)} style={inputCls}
                placeholder="Current reading in km" onFocus={setFocus} onBlur={setBlur} />
            </div>
            <div>
              <label className="block text-micro font-700 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                Fuel Level (%) <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input type="number" min="0" max="100" value={fuelLevel}
                onChange={e => setFuelLevel(e.target.value)} style={inputCls}
                placeholder="100" onFocus={setFocus} onBlur={setBlur} />
            </div>
            <div>
              <label className="block text-micro font-700 uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Current Location
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {cities.map(city => (
                  <button key={city} type="button" onClick={() => setLocationName(city)}
                    className="py-2 px-2 rounded-xl text-xs font-600 border text-center transition-all"
                    style={{
                      background: locationName === city ? 'rgba(249,115,22,0.1)' : 'var(--surface-2)',
                      border: locationName === city ? '1px solid rgba(249,115,22,0.35)' : '1px solid var(--border-1)',
                      color: locationName === city ? '#F97316' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}>
                    {city}
                  </button>
                ))}
              </div>
              <input type="text" required value={locationName}
                onChange={e => setLocationName(e.target.value)} style={inputCls}
                placeholder="Or enter specific town (e.g. Naivasha, Voi)"
                onFocus={setFocus} onBlur={setBlur} />
            </div>
            {telemetryError && (
              <div className="rounded-xl p-3 flex items-center gap-2 text-xs font-600"
                style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
                <Warning size={14} weight="duotone" style={{ flexShrink: 0 }} />
                {telemetryError}
              </div>
            )}
            <button type="submit" disabled={isSubmitting}
              className="w-full rounded-xl font-700 text-base flex items-center justify-center gap-2"
              style={{ background: '#F97316', color: '#04060F', padding: '14px 0', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1, fontFamily: 'Space Grotesk' }}>
              {isSubmitting ? <><Spinner size={18} /> Reporting...</> : 'Send Telemetry Update'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Report Issue Modal ───────────────────────────────────────────────────────

interface ReportIssueModalProps {
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
}

const issueTypes = [
  'Engine Warning Light', 'Tire Issue / Flat', 'Brake Problem', 'Fuel Leak',
  'A/C Failure', 'Electrical Issue', 'Accident / Collision', 'Other',
];

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ onClose, vehicleId, vehicleName }) => {
  const [selectedIssue, setSelectedIssue] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setError('');
    setIsSubmitting(true);
    try {
      await apiClient.post(`/vehicles/${vehicleId}/service-logs`, {
        serviceType: 'other',
        description: `Vehicle Issue: ${selectedIssue}${description ? ` — ${description}` : ''}`,
        odometerAtService: 0, cost: 0, performedBy: 'Driver Report',
        serviceDate: new Date().toISOString(),
      });
      setSubmitted(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error('Failed to report vehicle issue:', err);
      setError('Failed to submit issue report. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <Warning size={15} weight="duotone" style={{ color: '#F87171' }} />
            </div>
            <span className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
              Report Issue: {vehicleName}
            </span>
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
          <div className="p-8 text-center">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <CheckCircle size={24} weight="duotone" style={{ color: '#34D399' }} />
            </div>
            <p className="font-700 mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Issue Reported!</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Logged for {vehicleName}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="rounded-xl p-3 text-xs font-600"
                style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
                {error}
              </div>
            )}
            <div>
              <label className="block text-micro font-700 uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Issue Type</label>
              <div className="grid grid-cols-2 gap-2">
                {issueTypes.map(issue => (
                  <button key={issue} type="button" onClick={() => setSelectedIssue(issue)}
                    className="py-3 px-3 rounded-xl text-xs font-600 border text-left transition-all"
                    style={{
                      background: selectedIssue === issue ? 'rgba(248,113,113,0.1)' : 'var(--surface-2)',
                      border: selectedIssue === issue ? '1px solid rgba(248,113,113,0.35)' : '1px solid var(--border-1)',
                      color: selectedIssue === issue ? '#F87171' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}>
                    {issue}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-micro font-700 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Description (optional)</label>
              <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                style={{ width: '100%', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border-1)', color: 'var(--text-primary)', padding: '12px 16px', fontSize: 13, fontFamily: 'DM Sans', outline: 'none', resize: 'none' }}
                placeholder="Describe the issue..."
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-1)')} />
            </div>
            <button type="submit" disabled={isSubmitting || !selectedIssue}
              className="w-full rounded-xl font-700 text-base flex items-center justify-center gap-2"
              style={{ background: '#F87171', color: '#fff', padding: '14px 0', border: 'none', cursor: (isSubmitting || !selectedIssue) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || !selectedIssue) ? 0.5 : 1, fontFamily: 'Space Grotesk' }}>
              {isSubmitting ? <><Spinner size={18} /> Reporting...</> : 'Report Issue to Dispatch'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Main Driver Portal ────────────────────────────────────────────────────────

// ─── Change Password Modal ────────────────────────────────────────────────────

interface ChangePasswordModalProps {
  onClose: () => void;
  forced: boolean; // true = can't dismiss, driver must set a new password
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, forced }) => {
  const { clearPasswordChangeFlag } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', borderRadius: 12, background: 'var(--surface-2)',
    border: '1px solid var(--border-1)', color: 'var(--text-primary)',
    padding: '11px 14px', fontSize: 14, fontFamily: 'DM Sans',
    outline: 'none', transition: 'border-color 0.15s',
  };
  const focus = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)');
  const blur = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = 'var(--border-1)');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      setSuccess(true);
      clearPasswordChangeFlag();
      setTimeout(onClose, 1800);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,6,15,0.75)', backdropFilter: 'blur(4px)' }}>
      <div
        onClick={forced ? undefined : onClose}
        className="absolute inset-0"
      />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <Lock size={18} weight="duotone" style={{ color: '#F97316' }} />
            </div>
            <div>
              <h3 className="font-700 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                {forced ? 'Set Your Password' : 'Change Password'}
              </h3>
              {forced && (
                <p className="text-[10px] mt-0.5" style={{ color: '#FBBF24' }}>
                  You must set a new password before continuing.
                </p>
              )}
            </div>
          </div>
          {!forced && (
            <button onClick={onClose}
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--surface-2)', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
              <X size={14} weight="bold" />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {success ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <CheckCircle size={40} weight="duotone" style={{ color: '#34D399' }} />
              <p className="font-700 text-sm" style={{ color: 'var(--text-primary)' }}>Password updated successfully!</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-[11px] font-700 uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}>Current Password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password" required
                  style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-700 uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}>New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters" required
                  style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-700 uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password" required
                  style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>

              {error && (
                <p className="text-xs rounded-lg px-3 py-2"
                  style={{ color: '#F87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={isSubmitting}
                className="w-full h-11 rounded-xl font-700 text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: isSubmitting ? 'var(--surface-2)' : '#F97316',
                  color: isSubmitting ? 'var(--text-tertiary)' : '#04060F',
                  border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'Space Grotesk',
                }}
                onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)'; }}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                {isSubmitting ? <><Spinner size={16} /> Updating...</> : 'Update Password'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

// ─── Main Portal ──────────────────────────────────────────────────────────────

export const DriverPortalPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(
    user?.mustChangePassword === true
  );
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: dispatches, isLoading } = useDispatches();
  const startTrip = useStartTrip();
  const endTrip = useEndTrip();

  const handleLogout = () => { logout(); navigate('/login'); };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const myDispatch = dispatches?.find(d =>
    (d.status === 'In Progress' || d.status === 'Assigned') &&
    d.driverName?.toLowerCase() === user?.name?.toLowerCase()
  );
  const isOnTrip = myDispatch?.status === 'In Progress';

  const handleStartTrip = async () => {
    if (!myDispatch) return;
    try {
      await startTrip.mutateAsync(myDispatch.id);
      showFeedback('success', 'Trip started! Safe travels.');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to start trip. Please retry.');
    }
  };

  const handleEndTripConfirm = async (endingOdometer: number, fuelUsed: number) => {
    if (!myDispatch) return;
    await endTrip.mutateAsync({ dispatchId: myDispatch.id, endingOdometer, fuelUsed });
    showFeedback('success', 'Trip completed! Great work.');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto" style={{ background: 'var(--surface-0)', color: 'var(--text-primary)', fontFamily: 'DM Sans' }}>

      {/* Header */}
      <header className="sticky top-0 z-40 px-5 py-4" style={{ background: 'var(--surface-0)', borderBottom: '1px solid var(--border-0)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <Pulse size={18} weight="duotone" style={{ color: '#F97316' }} />
            </div>
            <div>
              <p className="font-600 text-sm leading-none" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>FleetOS</p>
              <p className="text-micro uppercase tracking-widest mt-0.5" style={{ color: '#F97316' }}>Driver Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-600 truncate max-w-[100px]" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Driver'}</p>
              <p className="text-micro" style={{ color: 'var(--text-tertiary)' }}>Operator</p>
            </div>
            <button onClick={() => setShowChangePasswordModal(true)}
              className="p-2.5 rounded-xl transition-colors"
              style={{ color: 'var(--text-tertiary)', border: '1px solid var(--border-0)', background: 'transparent', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#F97316'; e.currentTarget.style.background = 'rgba(249,115,22,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
              title="Change Password">
              <Lock size={16} weight="bold" />
            </button>
            <button onClick={handleLogout}
              className="p-2.5 rounded-xl transition-colors"
              style={{ color: 'var(--text-tertiary)', border: '1px solid var(--border-0)', background: 'transparent', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
              title="Sign Out">
              <SignOut size={16} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      {/* Feedback Banner */}
      {actionFeedback && (
        <div className="mx-5 mt-4 rounded-xl p-4 flex items-center gap-3 border text-sm font-600"
          style={{
            background: actionFeedback.type === 'success' ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${actionFeedback.type === 'success' ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
            color: actionFeedback.type === 'success' ? '#34D399' : '#F87171',
          }}>
          {actionFeedback.type === 'success'
            ? <CheckCircle size={18} weight="duotone" style={{ flexShrink: 0 }} />
            : <Warning size={18} weight="duotone" style={{ flexShrink: 0 }} />}
          {actionFeedback.message}
        </div>
      )}

      {/* Main */}
      <main className="flex-1 px-5 py-6 space-y-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Spinner size={40} />
            <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Loading dispatch...</p>
          </div>
        ) : myDispatch ? (
          <>
            {/* Status Banner */}
            <div className="rounded-2xl border p-4 flex items-center gap-3"
              style={{
                background: isOnTrip ? 'rgba(249,115,22,0.06)' : 'rgba(167,139,250,0.06)',
                border: `1px solid ${isOnTrip ? 'rgba(249,115,22,0.25)' : 'rgba(167,139,250,0.25)'}`,
              }}>
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: isOnTrip ? '#F97316' : '#A78BFA' }} />
                <span className="relative inline-flex rounded-full h-3 w-3"
                  style={{ background: isOnTrip ? '#F97316' : '#A78BFA' }} />
              </div>
              <div>
                <p className="text-xs font-700 uppercase tracking-widest"
                  style={{ color: isOnTrip ? '#F97316' : '#A78BFA' }}>
                  {isOnTrip ? '● TRIP IN PROGRESS' : '○ READY TO DEPART'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  Dispatch #{myDispatch.referenceNumber}
                </p>
              </div>
            </div>

            {/* Route Card */}
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
              <div className="text-micro font-700 uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                Active Dispatch
              </div>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <div className="h-3 w-3 rounded-full ring-4" style={{ background: '#34D399', boxShadow: '0 0 0 4px rgba(52,211,153,0.15)' }} />
                  <div className="h-12 w-px" style={{ background: 'linear-gradient(to bottom, rgba(52,211,153,0.5), rgba(249,115,22,0.5))' }} />
                  <div className="h-3 w-3 rounded-full" style={{ background: '#F97316', boxShadow: '0 0 0 4px rgba(249,115,22,0.15)' }} />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-micro font-700 uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Origin</p>
                    <p className="font-600 text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>{myDispatch.origin}</p>
                  </div>
                  <div>
                    <p className="text-micro font-700 uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Destination</p>
                    <p className="font-600 text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>{myDispatch.destination}</p>
                  </div>
                </div>
                <NavigationArrow size={18} weight="duotone" style={{ color: '#F97316', marginTop: 4, flexShrink: 0 }} />
              </div>

              {myDispatch.vehicleName && (
                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-0)' }}>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                      <Truck size={16} weight="duotone" style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <div>
                      <p className="text-micro font-700 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Vehicle</p>
                      <p className="text-xs font-600" style={{ color: 'var(--text-primary)' }}>{myDispatch.vehicleName}</p>
                    </div>
                  </div>
                  {myDispatch.plateNumber && (
                    <span className="px-2 py-1 rounded text-[10px] font-700 tracking-wider"
                      style={{ background: 'var(--surface-0)', border: '1px solid var(--border-1)', color: '#F97316', fontFamily: 'IBM Plex Mono' }}>
                      {myDispatch.plateNumber}
                    </span>
                  )}
                </div>
              )}

              {myDispatch.notes && (
                <div className="rounded-xl px-4 py-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                  <p className="text-micro font-700 uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Dispatch Notes</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{myDispatch.notes}</p>
                </div>
              )}
            </div>

            {/* Primary CTA */}
            {!isOnTrip ? (
              <button id="driver-start-trip" onClick={handleStartTrip} disabled={startTrip.isPending}
                className="w-full rounded-2xl font-700 text-xl flex items-center justify-center gap-3 active:scale-95 transition-all duration-200"
                style={{
                  background: '#F97316', color: '#04060F', padding: '22px 0', border: 'none',
                  cursor: startTrip.isPending ? 'not-allowed' : 'pointer', opacity: startTrip.isPending ? 0.7 : 1,
                  boxShadow: '0 8px 32px rgba(249,115,22,0.35)', fontFamily: 'Space Grotesk',
                }}>
                {startTrip.isPending
                  ? <><Spinner size={26} /> STARTING...</>
                  : <><Play size={26} weight="fill" /> START TRIP</>}
              </button>
            ) : (
              <button id="driver-end-trip" onClick={() => setShowEndTripModal(true)} disabled={endTrip.isPending}
                className="w-full rounded-2xl font-700 text-xl flex items-center justify-center gap-3 active:scale-95 transition-all duration-200"
                style={{
                  background: '#F87171', color: '#fff', padding: '22px 0', border: 'none',
                  cursor: endTrip.isPending ? 'not-allowed' : 'pointer', opacity: endTrip.isPending ? 0.7 : 1,
                  boxShadow: '0 8px 32px rgba(248,113,113,0.3)', fontFamily: 'Space Grotesk',
                }}>
                {endTrip.isPending
                  ? <><Spinner size={26} /> ENDING...</>
                  : <><Square size={26} weight="fill" /> END TRIP</>}
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center mb-2"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
              <MapPin size={36} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <h2 className="text-xl font-700" style={{ fontFamily: 'Space Grotesk' }}>No Active Dispatch</h2>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              You don't have an active dispatch. Contact your dispatcher for assignment.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <p className="text-micro font-700 uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Quick Actions
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'driver-log-fuel', label: 'Log Fuel', sub: 'Litres', Icon: GasPump, color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', hoverBorder: 'rgba(251,191,36,0.4)', fn: () => setShowFuelModal(true) },
              { id: 'driver-report-status', label: 'Report Status', sub: 'Location', Icon: MapPin, color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)', hoverBorder: 'rgba(249,115,22,0.4)', fn: () => setShowTelemetryModal(true) },
              { id: 'driver-report-issue', label: 'Report Issue', sub: 'Breakdown', Icon: Warning, color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', hoverBorder: 'rgba(248,113,113,0.4)', fn: () => setShowIssueModal(true) },
            ].map(action => (
              <button key={action.id} id={action.id} onClick={action.fn}
                disabled={!myDispatch?.vehicleId}
                className="flex flex-col items-center justify-center rounded-2xl p-4 text-center active:scale-95 transition-all group"
                style={{
                  background: 'var(--surface-1)', border: '1px solid var(--border-1)',
                  opacity: !myDispatch?.vehicleId ? 0.4 : 1,
                  cursor: !myDispatch?.vehicleId ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (myDispatch?.vehicleId) { e.currentTarget.style.borderColor = action.hoverBorder; e.currentTarget.style.background = action.bg; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-1)'; e.currentTarget.style.background = 'var(--surface-1)'; }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
                  style={{ background: action.bg, border: `1px solid ${action.border}` }}>
                  <action.Icon size={18} weight="duotone" style={{ color: action.color }} />
                </div>
                <p className="font-700 text-xs leading-tight" style={{ color: 'var(--text-primary)' }}>{action.label}</p>
                <p className="text-[9px] mt-1 uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{action.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Trips */}
        {dispatches && dispatches.filter(d => d.status === 'Completed' && d.driverName?.toLowerCase() === user?.name?.toLowerCase()).length > 0 && (
          <div>
            <p className="text-micro font-700 uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
              Recent Completed Trips
            </p>
            <div className="space-y-2">
              {dispatches.filter(d => d.status === 'Completed' && d.driverName?.toLowerCase() === user?.name?.toLowerCase()).slice(0, 3).map(d => (
                <div key={d.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
                  <CheckCircle size={16} weight="duotone" style={{ color: '#34D399', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-600 truncate" style={{ color: 'var(--text-primary)' }}>
                      {d.origin} → {d.destination}
                    </p>
                    <p className="text-micro mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {d.referenceNumber} · Delivered
                    </p>
                  </div>
                  <CaretRight size={14} weight="bold" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showFuelModal && myDispatch?.vehicleId && (
        <FuelLogModal vehicleId={myDispatch.vehicleId} vehicleName={myDispatch.vehicleName || 'Vehicle'}
          onClose={() => setShowFuelModal(false)} />
      )}
      {showTelemetryModal && myDispatch?.vehicleId && (
        <TelemetryUpdateModal vehicleId={myDispatch.vehicleId} onClose={() => setShowTelemetryModal(false)} />
      )}
      {showIssueModal && myDispatch?.vehicleId && (
        <ReportIssueModal vehicleId={myDispatch.vehicleId} vehicleName={myDispatch.vehicleName || 'Vehicle'}
          onClose={() => setShowIssueModal(false)} />
      )}
      {showEndTripModal && myDispatch && (
        <EndTripModal dispatchId={myDispatch.id} dispatchRef={myDispatch.referenceNumber || 'N/A'}
          onClose={() => setShowEndTripModal(false)} onConfirm={handleEndTripConfirm} />
      )}

      {showChangePasswordModal && (
        <ChangePasswordModal
          forced={user?.mustChangePassword === true}
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}
    </div>
  );
};

export default DriverPortalPage;
