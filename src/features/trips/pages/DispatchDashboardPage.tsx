import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, ArrowsClockwise, DownloadSimple, Clipboard, ShieldCheck, Pulse,
  WarningCircle, FileText, Table, Warning, Lightning,
} from '@phosphor-icons/react';
import { exportDispatchesCSV, exportDispatchesPDF } from '../../../utils/exportUtils';
import { DispatchTable } from '../components/DispatchTable';
import { DispatchFormModal } from '../components/DispatchFormModal';
import { useDispatches, useCreateDispatch, useUpdateDispatch, useDeleteDispatch, useStartTrip } from '../hooks/useTrips';
import { Dispatch } from '../types';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';

const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="h-7 w-7 rounded-full border-2 animate-spin"
      style={{ borderColor: 'rgba(249,115,22,0.3)', borderTopColor: '#F97316' }} />
    <p className="text-micro" style={{ color: 'var(--text-tertiary)' }}>Querying dispatch systems...</p>
  </div>
);

export const DispatchDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDispatch, setEditingDispatch] = useState<Dispatch | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; onConfirm: () => void; isDangerous?: boolean } | null>(null);

  const { data: dispatches = [], isLoading, isError, refetch } = useDispatches();
  const createDispatchMutation = useCreateDispatch();
  const updateDispatchMutation = useUpdateDispatch();
  const deleteDispatchMutation = useDeleteDispatch();
  const startTripMutation = useStartTrip();

  const handleCreateOrUpdate = async (input: {
    origin: string; destination: string; scheduledDate: string;
    notes?: string; driverId?: string; vehicleId?: string;
  }) => {
    try {
      if (editingDispatch) {
        await updateDispatchMutation.mutateAsync({ id: editingDispatch.id, data: input });
      } else {
        await createDispatchMutation.mutateAsync(input);
      }
      setIsFormOpen(false);
      setEditingDispatch(null);
    } catch (err) {
      console.error('Failed to submit dispatch parameters:', err);
    }
  };

  const handleEditInitiate = (dispatch: Dispatch) => { setEditingDispatch(dispatch); setIsFormOpen(true); };

  const handleDelete = (id: string) => {
    setConfirmState({
      title: 'Delete Dispatch',
      message: 'Cancel and delete this dispatch order?',
      isDangerous: true,
      onConfirm: async () => {
        setConfirmState(null);
        try { await deleteDispatchMutation.mutateAsync(id); }
        catch (err) { console.error('Failed to delete dispatch:', err); }
      },
    });
  };

  const handleStartTrip = async (id: string) => {
    try {
      await startTripMutation.mutateAsync(id);
      navigate('/trips/active');
    } catch (err) {
      console.error('Failed to initiate trip departure:', err);
    }
  };

  const totalCount    = dispatches.length;
  const pendingCount  = dispatches.filter(d => d.status === 'Pending').length;
  const assignedCount = dispatches.filter(d => d.status === 'Assigned').length;
  const activeCount   = dispatches.filter(d => d.status === 'In Progress').length;

  const isMutationLoading =
    createDispatchMutation.isPending || updateDispatchMutation.isPending ||
    deleteDispatchMutation.isPending || startTripMutation.isPending;

  const kpis = [
    { label: 'Total Dispatches', value: totalCount,    Icon: Clipboard,     color: '#F97316' },
    { label: 'Pending Assets',   value: pendingCount,  Icon: WarningCircle, color: '#FBBF24' },
    { label: 'Assigned / Ready', value: assignedCount, Icon: ShieldCheck,   color: '#60A5FA' },
    { label: 'Active Transit',   value: activeCount,   Icon: Pulse,         color: '#34D399' },
  ];

  return (
    <div style={{ fontFamily: 'DM Sans', color: 'var(--text-primary)' }}>

      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 anim-in">
        <div>
          <div className="badge-live mb-3">
            <Lightning size={9} weight="fill" /> Dispatch Matrix · Active
          </div>
          <h1 className="font-display font-700 text-[1.75rem] leading-tight mb-1"
            style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Logistics Dispatch Center
          </h1>
          <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
            Route planning · operator assignments · fleet assets · live departures
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => refetch()}
            className="flex items-center justify-center h-9 w-9 rounded-lg transition-all"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <ArrowsClockwise size={15} weight="bold" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(v => !v)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12px] font-600 transition-all"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              <DownloadSimple size={14} weight="bold" /> Export
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-1.5 z-20 w-44 rounded-xl overflow-hidden"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
                  <button onClick={() => { exportDispatchesCSV(dispatches); setShowExportMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] font-500 transition-colors text-left"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    <Table size={13} style={{ color: '#34D399' }} /> Export CSV
                  </button>
                  <button onClick={() => { exportDispatchesPDF(dispatches); setShowExportMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] font-500 transition-colors text-left"
                    style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-0)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    <FileText size={13} style={{ color: '#F87171' }} /> Export PDF
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => { setEditingDispatch(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-700 transition-all"
            style={{ background: '#F97316', color: '#04060F', fontFamily: 'Space Grotesk' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
            <Plus size={14} weight="bold" /> Add Dispatch Route
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
        {kpis.map(({ label, value, Icon, color }, i) => (
          <div key={label} className={`surface-card p-5 flex items-center justify-between anim-in d-${Math.min((i + 1) * 100, 500)}`}>
            <div>
              <p className="text-micro mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              <p className="font-700 text-2xl" style={{ fontFamily: 'IBM Plex Mono', color: i === 0 ? 'var(--text-primary)' : color }}>
                {value}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
              <Icon size={20} weight="duotone" style={{ color }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Dispatch table card ── */}
      <div className="surface-card overflow-hidden anim-in d-300">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Pulse size={15} weight="duotone" style={{ color: '#F97316' }} />
              <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                Dispatch Registry
              </span>
            </div>
            <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
              Logistics order backlog · route assignments · departure controls
            </p>
          </div>
          <span className="font-mono text-[11px] font-600 px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(249,115,22,0.08)', color: '#F97316', border: '1px solid rgba(249,115,22,0.2)', fontFamily: 'IBM Plex Mono' }}>
            {dispatches.length} orders
          </span>
        </div>

        <div className="p-5">
          {isLoading ? <Spinner /> : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Warning size={28} weight="duotone" style={{ color: '#F87171' }} />
              <p className="text-sm font-600" style={{ color: '#F87171' }}>Failed to connect to dispatch database</p>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Verify backend service availability</p>
            </div>
          ) : (
            <DispatchTable
              dispatches={dispatches}
              onEdit={handleEditInitiate}
              onDelete={handleDelete}
              onStartTrip={handleStartTrip}
              onSelect={(id) => navigate(`/trips/${id}`)}
            />
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      <DispatchFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingDispatch(null); }}
        onSubmit={handleCreateOrUpdate}
        dispatch={editingDispatch}
        isLoading={isMutationLoading}
      />

      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          isDangerous={confirmState.isDangerous}
          onConfirm={confirmState.onConfirm}
          onClose={() => setConfirmState(null)}
        />
      )}
    </div>
  );
};
