import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriversList, useDriverActions } from '../../features/drivers/hooks/useDrivers';
import { DriverStats } from '../../features/drivers/components/DriverStats';
import { DriverListTable } from '../../features/drivers/components/DriverListTable';
import { DriverForm } from '../../features/drivers/components/DriverForm';
import { Driver, CreateDriverInput, DriverCredentials } from '../../features/drivers/types';
import { exportDriversCSV, exportDriversPDF } from '../../utils/exportUtils';
import { useAuthStore } from '../../store/useAuthStore';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import {
  Plus, X, DownloadSimple, Users, FileText, Table, Warning,
  Copy, CheckCircle, Eye, EyeSlash,
} from '@phosphor-icons/react';

// ─── Shared spinner ───────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="h-7 w-7 rounded-full border-2 border-t-transparent animate-spin"
      style={{ borderColor: 'rgba(249,115,22,0.3)', borderTopColor: '#F97316' }} />
    <p className="text-micro" style={{ color: 'var(--text-tertiary)' }}>Loading operator registry...</p>
  </div>
);

export const DriversListPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [newCredentials, setNewCredentials] = useState<DriverCredentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; onConfirm: () => void; isDangerous?: boolean } | null>(null);

  const { data: drivers = [], isLoading, isError } = useDriversList();
  const { createDriver, updateDriver, deleteDriver, resetPassword } = useDriverActions();
  const [resettingDriverId, setResettingDriverId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const copyToClipboard = (text: string, field: 'email' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateOrUpdate = async (input: CreateDriverInput) => {
    try {
      if (editingDriver) {
        await updateDriver({ id: editingDriver.id, ...input });
        setIsFormOpen(false);
        setEditingDriver(null);
      } else {
        const result = await createDriver(input);
        setIsFormOpen(false);
        setEditingDriver(null);
        if (result._credentials) {
          setNewCredentials(result._credentials);
          setShowPassword(false);
        }
      }
    } catch (err) {
      console.error('Failed to submit driver action:', err);
    }
  };

  const handleEditInitiate = (driver: Driver) => { setEditingDriver(driver); setIsFormOpen(true); };

  const handleResetPassword = (driverId: string) => {
    setConfirmState({
      title: 'Reset Password',
      message: "Reset this operator's login password? A new temporary password will be generated.",
      isDangerous: false,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          setResettingDriverId(driverId);
          const credentials = await resetPassword(driverId);
          setNewCredentials(credentials);
          setShowPassword(false);
        } catch (err) {
          console.error('Failed to reset driver password:', err);
        } finally {
          setResettingDriverId(null);
        }
      },
    });
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      title: 'Decommission Driver',
      message: 'Decommission this operator from the active roster?',
      isDangerous: true,
      onConfirm: async () => {
        setConfirmState(null);
        try { await deleteDriver(id); }
        catch (err) { console.error('Failed to decommission driver:', err); }
      },
    });
  };

  const csvRows = drivers.map(d => ({
    name: d.name, email: d.email, phone: d.phone, status: d.status,
    assignedVehicleName: d.assignedVehicleName, tripsCompleted: d.tripsCompleted,
    rating: d.rating, licenseClass: d.compliance?.licenseClass,
    licenseNumber: d.compliance?.licenseNumber, licenseExpiry: d.compliance?.licenseExpiry,
    licenseStatus: d.compliance?.licenseStatus, createdAt: d.createdAt,
  }));

  return (
    <div style={{ fontFamily: 'DM Sans', color: 'var(--text-primary)' }}>

      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 anim-in">
        <div>
          <div className="badge-live mb-3">Dispatch Registry · Active</div>
          <h1 className="font-display font-700 text-[1.75rem] leading-tight mb-1"
            style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Driver Roster
          </h1>
          <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
            Certified operators · licensing compliance · safety records
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
                  <button onClick={() => { exportDriversCSV(csvRows); setShowExportMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] font-500 transition-colors text-left"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    <Table size={13} style={{ color: '#34D399' }} /> Export CSV
                  </button>
                  <button onClick={() => { exportDriversPDF(csvRows); setShowExportMenu(false); }}
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
              onClick={() => { setEditingDriver(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-700 transition-all"
              style={{ background: '#F97316', color: '#04060F', fontFamily: 'Space Grotesk' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              <Plus size={14} weight="bold" /> Enroll Operator
            </button>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      {drivers.length > 0 && <DriverStats drivers={drivers} />}

      {/* ── Roster table ── */}
      <div className="surface-card overflow-hidden anim-in d-200">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Users size={15} weight="duotone" style={{ color: '#F97316' }} />
              <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                Operator Roster
              </span>
            </div>
            <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
              Comprehensive ledger of certified logistics personnel
            </p>
          </div>
          <span className="font-mono text-[11px] font-600 px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(249,115,22,0.08)', color: '#F97316', border: '1px solid rgba(249,115,22,0.2)' }}>
            {drivers.length} operators
          </span>
        </div>

        <div className="p-5">
          {isLoading ? <Spinner /> : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Warning size={28} weight="duotone" style={{ color: '#F87171' }} />
              <p className="text-sm font-600" style={{ color: '#F87171' }}>Failed to load operator registry</p>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Verify backend service on port 5001</p>
            </div>
          ) : (
            <DriverListTable
              drivers={drivers}
              onEdit={handleEditInitiate}
              onDelete={handleDelete}
              onSelect={(id) => navigate(`/drivers/${id}`)}
              isAdmin={isAdmin}
              onResetPassword={isAdmin ? handleResetPassword : undefined}
              resettingId={resettingDriverId}
            />
          )}
        </div>
      </div>

      {/* ── Credentials modal (shown once after new driver creation) ── */}
      {newCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface-1)', border: '1px solid rgba(249,115,22,0.3)', boxShadow: '0 25px 80px rgba(0,0,0,0.7)' }}>

            {/* Header */}
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-0)', background: 'rgba(249,115,22,0.06)' }}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="h-2 w-2 rounded-full bg-[#F97316] animate-pulse" />
                <h3 className="font-700 text-sm" style={{ fontFamily: 'Space Grotesk', color: '#F97316' }}>
                  Operator Credentials Generated
                </h3>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                Share these login details with the driver. <strong style={{ color: '#F87171' }}>This password is shown only once.</strong>
              </p>
            </div>

            {/* Credentials */}
            <div className="px-6 py-5 space-y-3">
              {/* Email row */}
              <div>
                <span className="text-[10px] font-700 uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  Email Address
                </span>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                  <span className="flex-1 text-sm font-600" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
                    {newCredentials.email}
                  </span>
                  <button onClick={() => copyToClipboard(newCredentials.email, 'email')}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-700 uppercase tracking-wide transition-all flex-shrink-0"
                    style={{ background: copiedField === 'email' ? 'rgba(52,211,153,0.15)' : 'var(--surface-3)', color: copiedField === 'email' ? '#34D399' : 'var(--text-secondary)', border: `1px solid ${copiedField === 'email' ? 'rgba(52,211,153,0.3)' : 'var(--border-1)'}` }}>
                    {copiedField === 'email' ? <><CheckCircle size={11} weight="bold" /> Copied</> : <><Copy size={11} /> Copy</>}
                  </button>
                </div>
              </div>

              {/* Password row */}
              <div>
                <span className="text-[10px] font-700 uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  Temporary Password
                </span>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{ background: 'var(--surface-2)', border: '1px solid rgba(249,115,22,0.2)' }}>
                  <span className="flex-1 text-sm font-700 tracking-widest" style={{ color: '#F97316', fontFamily: 'IBM Plex Mono' }}>
                    {showPassword ? newCredentials.temporaryPassword : '••••••••'}
                  </span>
                  <button onClick={() => setShowPassword(v => !v)}
                    className="p-1.5 rounded transition-colors flex-shrink-0"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}>
                    {showPassword ? <EyeSlash size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => copyToClipboard(newCredentials.temporaryPassword, 'password')}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-700 uppercase tracking-wide transition-all flex-shrink-0"
                    style={{ background: copiedField === 'password' ? 'rgba(52,211,153,0.15)' : 'var(--surface-3)', color: copiedField === 'password' ? '#34D399' : 'var(--text-secondary)', border: `1px solid ${copiedField === 'password' ? 'rgba(52,211,153,0.3)' : 'var(--border-1)'}` }}>
                    {copiedField === 'password' ? <><CheckCircle size={11} weight="bold" /> Copied</> : <><Copy size={11} /> Copy</>}
                  </button>
                </div>
              </div>

              {/* Warning note */}
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg mt-1"
                style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <Warning size={14} weight="duotone" style={{ color: '#F87171', flexShrink: 0, marginTop: 1 }} />
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  This password will not be shown again. The driver should change it after first login.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4" style={{ borderTop: '1px solid var(--border-0)' }}>
              <button onClick={() => { setNewCredentials(null); setShowPassword(false); setCopiedField(null); }}
                className="w-full py-2.5 rounded-lg text-xs font-700 transition-all"
                style={{ background: '#F97316', color: '#04060F', fontFamily: 'Space Grotesk' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                I've saved the credentials — Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Enroll / Edit modal ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', boxShadow: '0 25px 80px rgba(0,0,0,0.7)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <div>
                <h3 className="font-display font-600 text-base" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                  {editingDriver ? 'Edit Operator Enrollment' : 'Enroll Certified Operator'}
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>Provide verified DOT licensing data</p>
              </div>
              <button onClick={() => { setIsFormOpen(false); setEditingDriver(null); }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              <DriverForm
                driver={editingDriver}
                onSubmit={handleCreateOrUpdate}
                onCancel={() => { setIsFormOpen(false); setEditingDriver(null); }}
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
