import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAnalyticsSummary } from '../../hooks/useAnalytics';
import { useVehiclesList, useVehicleActions } from '../../features/vehicles/hooks/useVehicles';
import { useAllServiceLogs, useCreateServiceLog, useDeleteServiceLog } from '../../hooks/useServiceLogs';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import {
  Wrench, Warning, CheckCircle, Plus, Trash, CurrencyDollar,
  CircleNotch, X, FileText, MagnifyingGlass, Check,
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

// ─── KPI card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string; value: string | number; desc: string;
  Icon: React.ElementType; color: string;
}> = ({ label, value, desc, Icon, color }) => (
  <div className="surface-card p-5 flex items-center justify-between">
    <div>
      <p className="text-micro mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="font-700 text-2xl" style={{ fontFamily: 'IBM Plex Mono', color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
    </div>
    <div className="h-11 w-11 rounded-xl flex items-center justify-center"
      style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
      <Icon size={20} weight="duotone" style={{ color }} />
    </div>
  </div>
);

// ─── Shared input style helper ────────────────────────────────────────────────
const inputCls = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-0)',
  color: 'var(--text-primary)',
  fontFamily: 'DM Sans',
  outline: 'none',
  transition: 'border-color 0.15s',
} as React.CSSProperties;

// ─── Log Service Modal ────────────────────────────────────────────────────────
interface LogServiceModalProps { initialVehicleId?: string; onClose: () => void; }

const LogServiceModal: React.FC<LogServiceModalProps> = ({ initialVehicleId, onClose }) => {
  const queryClient = useQueryClient();
  const { data: allVehicles } = useVehiclesList();

  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId || '');
  const activeVehicle = allVehicles?.find(v => v.id === selectedVehicleId);
  const currentOdometer = activeVehicle?.telemetry.odometer || 0;

  const createLog = useCreateServiceLog(selectedVehicleId);
  const { updateVehicle } = useVehicleActions();

  const [form, setForm] = useState({
    serviceType: 'oil-change',
    description: '',
    odometerAtService: currentOdometer || '',
    cost: '',
    performedBy: '',
    serviceDate: new Date().toISOString().split('T')[0],
    nextServiceMileage: '',
    releaseVehicle: activeVehicle?.status === 'maintenance',
  });
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (activeVehicle) {
      setForm(f => ({
        ...f,
        odometerAtService: activeVehicle.telemetry.odometer,
        releaseVehicle: activeVehicle.status === 'maintenance',
      }));
    }
  }, [selectedVehicleId, activeVehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) return;
    try {
      await createLog.mutateAsync({
        serviceType: form.serviceType,
        description: form.description,
        odometerAtService: typeof form.odometerAtService === 'string' ? parseFloat(form.odometerAtService) : form.odometerAtService,
        cost: form.cost ? parseFloat(form.cost) : 0,
        performedBy: form.performedBy,
        serviceDate: form.serviceDate,
        nextServiceMileage: form.nextServiceMileage ? parseFloat(form.nextServiceMileage) : undefined,
      });
      if (form.releaseVehicle && activeVehicle?.status === 'maintenance') {
        await updateVehicle({ id: selectedVehicleId, status: 'idle' });
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] });
      }
      setSubmitted(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      console.error(err);
    }
  };

  const setFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)');
  const setBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = 'var(--border-0)');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', boxShadow: '0 25px 80px rgba(0,0,0,0.7)' }}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <Wrench size={16} weight="duotone" style={{ color: '#F97316' }} />
            </div>
            <div>
              <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                Log Fleet Service Event
              </span>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Record a maintenance or servicing entry</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}>
              <CheckCircle size={32} weight="duotone" style={{ color: '#34D399' }} />
            </div>
            <p className="font-display font-600 text-base mb-1" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
              Service Event Recorded
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Fleet service history database has been updated.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">

              <div className="col-span-2">
                <label className="text-label block mb-1.5">Target Vehicle</label>
                <select required value={selectedVehicleId}
                  onChange={e => setSelectedVehicleId(e.target.value)}
                  disabled={!!initialVehicleId}
                  className="w-full rounded-lg py-2.5 px-3.5 text-sm disabled:opacity-60"
                  style={inputCls} onFocus={setFocus} onBlur={setBlur}>
                  <option value="" disabled>Select a vehicle...</option>
                  {allVehicles?.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.plateNumber}) — {v.status}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-label block mb-1.5">Service Type</label>
                <select value={form.serviceType}
                  onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}
                  className="w-full rounded-lg py-2.5 px-3.5 text-sm"
                  style={inputCls} onFocus={setFocus} onBlur={setBlur}>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-label block mb-1.5">Odometer (km)</label>
                <input type="number" required min="0" value={form.odometerAtService}
                  onChange={e => setForm(f => ({ ...f, odometerAtService: e.target.value }))}
                  className="w-full rounded-lg py-2.5 px-3.5 text-sm"
                  style={inputCls} onFocus={setFocus} onBlur={setBlur} />
              </div>

              <div>
                <label className="text-label block mb-1.5">Service Cost (KSh)</label>
                <input type="number" step="0.01" min="0" value={form.cost}
                  onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                  placeholder="0.00"
                  className="w-full rounded-lg py-2.5 px-3.5 text-sm"
                  style={inputCls} onFocus={setFocus} onBlur={setBlur} />
              </div>

              <div>
                <label className="text-label block mb-1.5">Service Date</label>
                <input type="date" value={form.serviceDate}
                  onChange={e => setForm(f => ({ ...f, serviceDate: e.target.value }))}
                  className="w-full rounded-lg py-2.5 px-3.5 text-sm"
                  style={inputCls} onFocus={setFocus} onBlur={setBlur} />
              </div>

              <div>
                <label className="text-label block mb-1.5">Next Service Mileage</label>
                <input type="number" min="0" value={form.nextServiceMileage}
                  onChange={e => setForm(f => ({ ...f, nextServiceMileage: e.target.value }))}
                  placeholder="Optional"
                  className="w-full rounded-lg py-2.5 px-3.5 text-sm"
                  style={inputCls} onFocus={setFocus} onBlur={setBlur} />
              </div>

              <div className="col-span-2">
                <label className="text-label block mb-1.5">Service Provider / Operator</label>
                <input type="text" value={form.performedBy}
                  onChange={e => setForm(f => ({ ...f, performedBy: e.target.value }))}
                  placeholder="Service center name"
                  className="w-full rounded-lg py-2.5 px-3.5 text-sm"
                  style={inputCls} onFocus={setFocus} onBlur={setBlur} />
              </div>

              <div className="col-span-2">
                <label className="text-label block mb-1.5">Description / Notes</label>
                <textarea rows={3} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Detail items serviced or replaced..."
                  className="w-full rounded-lg py-2.5 px-3.5 text-sm resize-none"
                  style={inputCls}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-0)')} />
              </div>

              {activeVehicle?.status === 'maintenance' && (
                <div className="col-span-2 flex items-center gap-2.5 py-2.5 px-3.5 rounded-xl"
                  style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)' }}>
                  <input type="checkbox" id="releaseVehicle"
                    checked={form.releaseVehicle}
                    onChange={e => setForm(f => ({ ...f, releaseVehicle: e.target.checked }))}
                    className="h-4 w-4 rounded" />
                  <label htmlFor="releaseVehicle" className="text-xs font-500 cursor-pointer select-none"
                    style={{ color: 'var(--text-primary)' }}>
                    Release vehicle back to active service fleet (set status to Idle)
                  </label>
                </div>
              )}
            </div>

            {createLog.isError && (
              <div className="rounded-lg p-3 text-xs"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
                {(createLog.error as any)?.message || 'Failed to record service event. Please check inputs.'}
              </div>
            )}

            <button type="submit" disabled={createLog.isPending}
              className="w-full py-3 rounded-xl font-display font-600 text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: '#F97316', color: '#04060F', fontFamily: 'Space Grotesk' }}
              onMouseEnter={e => { if (!createLog.isPending) e.currentTarget.style.boxShadow = '0 0 24px rgba(249,115,22,0.35)'; }}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              {createLog.isPending
                ? <><CircleNotch size={16} weight="bold" className="animate-spin" /> Saving...</>
                : 'Record Service Event'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Main Maintenance Page ───────────────────────────────────────────────────
export const MaintenancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [logModalConfig, setLogModalConfig] = useState<{ isOpen: boolean; vehicleId?: string }>({ isOpen: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const { data: analytics, isLoading: isAnalyticsLoading } = useAnalyticsSummary();
  const { data: vehicles, isLoading: isVehiclesLoading } = useVehiclesList();
  const { data: serviceLogs, isLoading: isLogsLoading } = useAllServiceLogs();

  const { updateVehicle, isUpdating: isUpdatingVehicle } = useVehicleActions();
  const globalDeleteLog = useDeleteServiceLog('all_logs');
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; onConfirm: () => void; isDangerous?: boolean } | null>(null);

  const handleCheckIntoMaintenance = (vehicleId: string, vehicleName: string) => {
    setConfirmState({
      title: 'Confirm Maintenance',
      message: `Transition ${vehicleName} to maintenance status?`,
      isDangerous: false,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await updateVehicle({ id: vehicleId, status: 'maintenance' });
          queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] });
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        } catch (err) { console.error('Failed to transition vehicle:', err); }
      },
    });
  };

  const handleReleaseFromMaintenance = (vehicleId: string, vehicleName: string) => {
    setConfirmState({
      title: 'Release Vehicle',
      message: `Release ${vehicleName} back to active fleet?`,
      isDangerous: false,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await updateVehicle({ id: vehicleId, status: 'idle' });
          queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] });
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        } catch (err) { console.error('Failed to release vehicle:', err); }
      },
    });
  };

  const handleDeleteLog = (logId: string, vehicleId: string) => {
    setConfirmState({
      title: 'Delete Service Log',
      message: 'Permanently delete this service log?',
      isDangerous: true,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await globalDeleteLog.mutateAsync(logId);
          queryClient.invalidateQueries({ queryKey: ['serviceLogs', vehicleId] });
          queryClient.invalidateQueries({ queryKey: ['serviceLogs', 'all'] });
          queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] });
        } catch (err) { console.error('Failed to delete service log:', err); }
      },
    });
  };

  const underMaintenanceVehicles = vehicles?.filter(v => v.status === 'maintenance') || [];
  const activeWarnings = analytics?.maintenanceAlerts?.filter(a => a.status !== 'maintenance') || [];
  const totalCost = serviceLogs?.reduce((acc, log) => acc + (log.cost || 0), 0) || 0;

  const filteredLogs = serviceLogs?.filter(log => {
    const matchesSearch =
      log.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = serviceFilter ? log.serviceType === serviceFilter : true;
    return matchesSearch && matchesType;
  }) || [];

  const isLoading = isAnalyticsLoading || isVehiclesLoading || isLogsLoading;

  const kpis = [
    { label: 'Active Servicing Bay',    value: underMaintenanceVehicles.length, desc: 'Vehicles in service',             Icon: Wrench,        color: '#F87171' },
    { label: 'Preventative Warnings',   value: activeWarnings.length,           desc: 'Approaching service km limit',    Icon: Warning,       color: '#FBBF24' },
    { label: 'Total Service Cost',      value: `KSh ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, desc: 'Aggregated expenditures', Icon: CurrencyDollar, color: '#34D399' },
    { label: 'Fleet Health Index',      value: `${analytics?.vehicles.healthScore ?? 100}%`, desc: 'Available vs servicing ratio', Icon: CheckCircle,   color: '#60A5FA' },
  ];

  return (
    <>
      <div style={{ fontFamily: 'DM Sans', color: 'var(--text-primary)' }}>

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 anim-in">
          <div>
            <div className="badge-live mb-3">Fleet Service Hub · Active</div>
            <h1 className="font-display font-700 text-[1.75rem] leading-tight mb-1"
              style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              Maintenance &amp; Servicing
            </h1>
            <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
              Servicing bays · preventative warnings · unified service archives
            </p>
          </div>
          <button
            onClick={() => setLogModalConfig({ isOpen: true })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-700 transition-all w-fit"
            style={{ background: '#F97316', color: '#04060F', fontFamily: 'Space Grotesk' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 24px rgba(249,115,22,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
            <Plus size={15} weight="bold" /> Record Service Log
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: 'var(--surface-2)' }} />
              ))
            : kpis.map((kpi, i) => (
                <div key={kpi.label} className={`anim-in d-${Math.min((i + 1) * 100, 500)}`}>
                  <StatCard {...kpi} />
                </div>
              ))}
        </div>

        {/* ── Main 3-col layout ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">

          {/* LEFT 2/3 — Servicing bay + Warnings */}
          <div className="lg:col-span-2 space-y-6">

            {/* Active Servicing Bay */}
            <div className="surface-card overflow-hidden anim-in d-200">
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Wrench size={15} weight="duotone" style={{ color: '#F87171' }} />
                    <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                      Active Servicing Bay
                    </span>
                  </div>
                  <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
                    Vehicles checked out of operations
                  </p>
                </div>
              </div>
              <div>
                {underMaintenanceVehicles.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle size={36} weight="duotone" className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-sm font-600" style={{ color: 'var(--text-secondary)' }}>Bay is Empty</p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>All vehicles are active or standby.</p>
                  </div>
                ) : (
                  <div>
                    {underMaintenanceVehicles.map((v, i) => (
                      <div key={v.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 transition-colors"
                        style={{ borderTop: i > 0 ? '1px solid var(--border-0)' : undefined }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
                            <Wrench size={16} weight="duotone" style={{ color: '#F87171' }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-600 text-sm" style={{ color: 'var(--text-primary)' }}>{v.name}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                                style={{ background: 'var(--surface-3)', border: '1px solid var(--border-1)', color: '#F97316', fontFamily: 'IBM Plex Mono' }}>
                                {v.plateNumber}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }}>
                              Odometer: {v.telemetry.odometer.toLocaleString()} km · <span className="capitalize">{v.type}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:self-center">
                          <button
                            onClick={() => setLogModalConfig({ isOpen: true, vehicleId: v.id })}
                            className="px-3.5 py-2 rounded-lg text-[11px] font-700 transition-all"
                            style={{ background: '#F97316', color: '#04060F' }}
                            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 16px rgba(249,115,22,0.35)')}
                            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                            Log &amp; Release
                          </button>
                          <button
                            onClick={() => handleReleaseFromMaintenance(v.id, v.name)}
                            disabled={isUpdatingVehicle}
                            className="px-3.5 py-2 rounded-lg text-[11px] font-600 transition-all disabled:opacity-50"
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', color: 'var(--text-secondary)' }}
                            onMouseEnter={e => { if (!isUpdatingVehicle) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-1)'; } }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                            Quick Release
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Preventative Warnings */}
            <div className="surface-card overflow-hidden anim-in d-300">
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <Warning size={15} weight="duotone" style={{ color: '#FBBF24' }} />
                  <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                    Preventative Maintenance Alerts
                  </span>
                </div>
                <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
                  Vehicles within 800 km of service limit thresholds
                </p>
              </div>
              <div>
                {activeWarnings.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle size={36} weight="duotone" className="mx-auto mb-3" style={{ color: 'rgba(52,211,153,0.4)' }} />
                    <p className="text-sm font-600" style={{ color: 'var(--text-secondary)' }}>All Schedules Compliant</p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>No vehicles approaching service limits.</p>
                  </div>
                ) : (
                  <div>
                    {activeWarnings.map((alert, i) => (
                      <div key={alert.vehicleId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 transition-colors"
                        style={{ borderTop: i > 0 ? '1px solid var(--border-0)' : undefined }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                            <Warning size={16} weight="duotone" style={{ color: '#FBBF24' }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-600 text-sm" style={{ color: 'var(--text-primary)' }}>{alert.vehicleName}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                                style={{ background: 'var(--surface-3)', border: '1px solid var(--border-1)', color: '#F97316', fontFamily: 'IBM Plex Mono' }}>
                                {alert.plateNumber}
                              </span>
                            </div>
                            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                              Odometer: <strong style={{ color: 'var(--text-primary)' }}>{alert.currentOdometer.toLocaleString()} km</strong>
                              {' '}(Due: {alert.nextServiceMileage.toLocaleString()} km) · Required:{' '}
                              <span className="font-600 capitalize" style={{ color: '#FBBF24' }}>{alert.serviceType.replace('-', ' ')}</span>
                            </p>
                            <p className="text-[10px] font-700 uppercase tracking-wider mt-0.5" style={{ color: '#FBBF24' }}>
                              {alert.remainingKm === 0 ? '⚠ Service Overdue!' : `⏳ Due in ${alert.remainingKm.toLocaleString()} km`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:self-center">
                          <button
                            onClick={() => handleCheckIntoMaintenance(alert.vehicleId, alert.vehicleName)}
                            disabled={isUpdatingVehicle}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-700 transition-all disabled:opacity-50"
                            style={{ background: '#FBBF24', color: '#04060F' }}
                            onMouseEnter={e => { if (!isUpdatingVehicle) e.currentTarget.style.boxShadow = '0 0 16px rgba(251,191,36,0.4)'; }}
                            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                            <Wrench size={13} weight="bold" /> Checkout
                          </button>
                          <button
                            onClick={() => setLogModalConfig({ isOpen: true, vehicleId: alert.vehicleId })}
                            className="px-3.5 py-2 rounded-lg text-[11px] font-600 transition-all"
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', color: 'var(--text-secondary)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                            Log Service
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT 1/3 — Service Guide */}
          <div className="space-y-6">
            <div className="surface-card overflow-hidden anim-in d-400">
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
                <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                  Maintenance Operations Guide
                </span>
                <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Standard mileage limit guidelines</p>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { type: 'Oil Change',        limit: '8,000 km',  desc: 'Synthetic lube & filter replacements' },
                  { type: 'Tire Rotation',     limit: '12,000 km', desc: 'Cross-rotation & pressure testing' },
                  { type: 'Brake Inspection',  limit: '20,000 km', desc: 'Pads & rotor wear checks' },
                  { type: 'General Inspection',limit: '15,000 km', desc: 'Full mechanical & diagnostic sweep' },
                ].map(item => (
                  <div key={item.type} className="flex items-start gap-3 p-3 rounded-xl transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-0)')}>
                    <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                      <Check size={11} weight="bold" style={{ color: '#F97316' }} />
                    </div>
                    <div>
                      <span className="text-[12px] font-600 block" style={{ color: 'var(--text-primary)' }}>{item.type}</span>
                      <span className="text-[10px] block" style={{ color: 'var(--text-secondary)' }}>Interval: {item.limit}</span>
                      <span className="text-[10px] block mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Unified Service Logs ── */}
        <div className="surface-card overflow-hidden anim-in d-400">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border-0)' }}>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <FileText size={15} weight="duotone" style={{ color: '#F97316' }} />
                <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                  Unified Service Registry
                </span>
              </div>
              <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
                Archived history logs, costs, and service centers for the entire fleet
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <MagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
                <input type="text" placeholder="Search history..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="rounded-lg py-1.5 pl-8 pr-3 text-[12px] outline-none transition-all w-full sm:w-52"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)', color: 'var(--text-primary)', fontFamily: 'DM Sans' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-0)')} />
              </div>
              <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
                className="rounded-lg py-1.5 px-3 text-[12px] outline-none transition-all"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)', color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-0)')}>
                <option value="">All Services</option>
                {Object.entries(SERVICE_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {isLogsLoading ? (
            <div className="py-12 text-center">
              <div className="h-7 w-7 rounded-full border-2 animate-spin mx-auto mb-3"
                style={{ borderColor: 'rgba(249,115,22,0.3)', borderTopColor: '#F97316' }} />
              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Querying service ledger...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center">
              <FileText size={36} weight="duotone" className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm font-600" style={{ color: 'var(--text-secondary)' }}>No Service Logs Found</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Modify filters or record a new service event.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-0)', background: 'var(--surface-2)' }}>
                    {['Vehicle', 'Service Type', 'Odometer', 'Performed By', 'Date', 'Cost', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-micro font-600" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, i) => (
                    <tr key={log.id} className="group transition-colors"
                      style={{ borderTop: i > 0 ? '1px solid var(--border-0)' : undefined }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <td className="px-4 py-3">
                        <span className="font-600 text-[12px] block" style={{ color: 'var(--text-primary)' }}>{log.vehicleName}</span>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)', fontFamily: 'IBM Plex Mono' }}>
                          ID: {log.vehicleId.slice(-6)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-500 text-[12px] block" style={{ color: 'var(--text-primary)' }}>
                          {SERVICE_TYPE_LABELS[log.serviceType] || log.serviceType}
                        </span>
                        {log.description && (
                          <span className="text-[10px] block truncate max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                            {log.description}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
                        {log.odometerAtService.toLocaleString()} km
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        {log.performedBy || <span className="italic" style={{ color: 'var(--text-tertiary)' }}>—</span>}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(log.serviceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-mono font-700 text-[12px]" style={{ color: '#34D399', fontFamily: 'IBM Plex Mono' }}>
                        KSh {log.cost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteLog(log.id, log.vehicleId)}
                          disabled={globalDeleteLog.isPending}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                          style={{ color: 'var(--text-tertiary)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = ''; }}>
                          <Trash size={14} weight="bold" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {logModalConfig.isOpen && (
        <LogServiceModal
          initialVehicleId={logModalConfig.vehicleId}
          onClose={() => setLogModalConfig({ isOpen: false })}
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

export default MaintenancePage;
