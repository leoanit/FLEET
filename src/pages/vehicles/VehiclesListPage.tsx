import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehiclesList, useVehicleActions } from '../../features/vehicles/hooks/useVehicles';
import { VehicleStats } from '../../features/vehicles/components/VehicleStats';
import { VehicleList } from '../../features/vehicles/components/VehicleList';
import { VehicleForm } from '../../features/vehicles/components/VehicleForm';
import { Vehicle, CreateVehicleInput } from '../../features/vehicles/types';
import { exportVehiclesCSV, exportVehiclesPDF } from '../../utils/exportUtils';
import { useAuthStore } from '../../store/useAuthStore';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import {
  Plus, X, DownloadSimple, MagnifyingGlass, FileText, Table, Warning, Pulse,
} from '@phosphor-icons/react';

const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="h-7 w-7 rounded-full border-2 animate-spin"
      style={{ borderColor: 'rgba(249,115,22,0.3)', borderTopColor: '#F97316' }} />
    <p className="text-micro" style={{ color: 'var(--text-tertiary)' }}>Retrieving fleet registry...</p>
  </div>
);

export const VehiclesListPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; onConfirm: () => void; isDangerous?: boolean } | null>(null);

  const { data: vehicles = [], isLoading, isError } = useVehiclesList();
  const { createVehicle, updateVehicle, deleteVehicle } = useVehicleActions();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const handleCreateOrUpdate = async (input: CreateVehicleInput) => {
    try {
      if (editingVehicle) {
        await updateVehicle({ id: editingVehicle.id, ...input });
      } else {
        await createVehicle(input);
      }
      setIsFormOpen(false);
      setEditingVehicle(null);
    } catch (err) {
      console.error('Failed to submit vehicle action:', err);
    }
  };

  const handleEditInitiate = (vehicle: Vehicle) => { setEditingVehicle(vehicle); setIsFormOpen(true); };

  const handleDelete = (id: string) => {
    setConfirmState({
      title: 'Decommission Vehicle',
      message: 'Decommission this vehicle from active fleet duty?',
      isDangerous: true,
      onConfirm: async () => {
        setConfirmState(null);
        try { await deleteVehicle(id); }
        catch (err) { console.error('Failed to purge vehicle:', err); }
      },
    });
  };

  const filteredVehicles = vehicles.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.make.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const csvRows = vehicles.map(v => ({
    name: v.name, plateNumber: v.plateNumber, make: v.make, model: v.model,
    year: v.year, type: v.type, status: v.status,
    assignedDriverName: (v as any).assignedDriverName,
    odometer: v.telemetry?.odometer, fuelLevel: v.telemetry?.fuelLevel,
    locationName: v.telemetry?.locationName, createdAt: v.createdAt,
  }));

  return (
    <div style={{ fontFamily: 'DM Sans', color: 'var(--text-primary)' }}>

      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 anim-in">
        <div>
          <div className="badge-live mb-3">Fleet Registry · Live</div>
          <h1 className="font-display font-700 text-[1.75rem] leading-tight mb-1"
            style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Fleet Manifest
          </h1>
          <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
            Registration records · telemetry overlays · vehicle classifications
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Export */}
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
                  <button onClick={() => { exportVehiclesCSV(csvRows); setShowExportMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] font-500 transition-colors text-left"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    <Table size={13} style={{ color: '#34D399' }} /> Export CSV
                  </button>
                  <button onClick={() => { exportVehiclesPDF(csvRows); setShowExportMenu(false); }}
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

          {isAdmin && (
            <button
              onClick={() => { setEditingVehicle(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-700 transition-all"
              style={{ background: '#F97316', color: '#04060F', fontFamily: 'Space Grotesk' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              <Plus size={14} weight="bold" /> Enroll Vehicle
            </button>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      {vehicles.length > 0 && <VehicleStats vehicles={vehicles} />}

      {/* ── Fleet table ── */}
      <div className="surface-card overflow-hidden anim-in d-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Pulse size={15} weight="duotone" style={{ color: '#F97316' }} />
              <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                Fleet Manifest
              </span>
            </div>
            <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
              Comprehensive lookup of active mechanical units
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-56">
            <MagnifyingGlass size={14} weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Make, model, plate..."
              className="w-full rounded-lg py-1.5 pl-8 pr-3 text-[12px] outline-none transition-all"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-0)',
                color: 'var(--text-primary)',
                fontFamily: 'DM Sans',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-0)')}
            />
          </div>
        </div>

        <div className="p-5">
          {isLoading ? <Spinner /> : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Warning size={28} weight="duotone" style={{ color: '#F87171' }} />
              <p className="text-sm font-600" style={{ color: '#F87171' }}>Failed to load fleet registry</p>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Verify backend service on port 5001</p>
            </div>
          ) : (
            <VehicleList
              vehicles={filteredVehicles}
              onEdit={handleEditInitiate}
              onDelete={handleDelete}
              onSelect={(id) => navigate(`/vehicles/${id}`)}
            />
          )}
        </div>
      </div>

      {/* ── Enroll / Edit modal ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', boxShadow: '0 25px 80px rgba(0,0,0,0.7)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <div>
                <h3 className="font-display font-600 text-base" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                  {editingVehicle ? 'Edit Vehicle Record' : 'Enroll New Asset'}
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>Provide registration data to modify parameters</p>
              </div>
              <button onClick={() => { setIsFormOpen(false); setEditingVehicle(null); }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              <VehicleForm
                vehicle={editingVehicle}
                onSubmit={handleCreateOrUpdate}
                onCancel={() => { setIsFormOpen(false); setEditingVehicle(null); }}
              />
            </div>
          </div>
        </div>
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
    </div>
  );
};
