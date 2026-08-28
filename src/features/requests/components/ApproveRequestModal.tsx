import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Truck, User, FileText, CheckCircle, Warning } from '@phosphor-icons/react';
import { TransportRequest } from '../types';
import { useAssetAvailability } from '../../trips/hooks/useAssetAvailability';
import { useApproveTransportRequest } from '../hooks/useTransportRequests';

const approveSchema = z.object({
  driverId: z.string().min(1, 'Select a driver'),
  vehicleId: z.string().min(1, 'Select a vehicle'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof approveSchema>;

interface ApproveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: TransportRequest | null;
}

const baseInputStyles: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface-2)',
  border: '1px solid var(--border-0)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  fontFamily: 'DM Sans',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const labelCls: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '4px',
};

export const ApproveRequestModal: React.FC<ApproveRequestModalProps> = ({ isOpen, onClose, request }) => {
  const { availableDrivers, unavailableDrivers, availableVehicles, unavailableVehicles, isLoadingDrivers, isLoadingVehicles } =
    useAssetAvailability();
  const approveRequest = useApproveTransportRequest();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(approveSchema),
    defaultValues: { driverId: '', vehicleId: '', notes: '' },
  });

  const selectedDriverId = watch('driverId');
  const selectedVehicleId = watch('vehicleId');

  if (!isOpen || !request) return null;

  const setFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)');
  const setBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = 'var(--border-0)');

  const handleFormSubmit = async (data: FormData) => {
    try {
      await approveRequest.mutateAsync({
        id: request.id,
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        notes: data.notes || undefined,
      });
      reset();
      onClose();
    } catch (err) {
      console.error('Failed to approve transport request:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', boxShadow: '0 25px 80px rgba(0,0,0,0.7)' }}>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div>
            <h3 className="font-display font-600 text-base" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
              Approve Transport Request
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {request.referenceNumber} · {request.requesterName} · {request.origin} → {request.destination}
            </p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Driver */}
            <div className="space-y-1.5">
              <label style={labelCls}><User size={13} style={{ color: '#F97316' }} /> Allocate Driver</label>
              <select style={{ ...baseInputStyles, appearance: 'none' } as React.CSSProperties}
                {...register('driverId')} onFocus={setFocus} onBlur={setBlur}>
                <option value="">-- Select Operator --</option>
                {availableDrivers.length > 0 && (
                  <optgroup label={`✅ Available (${availableDrivers.length})`}>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.status}) — ★{d.rating}</option>
                    ))}
                  </optgroup>
                )}
                {unavailableDrivers.length > 0 && (
                  <optgroup label={`⛔ Unavailable (${unavailableDrivers.length})`}>
                    {unavailableDrivers.map((d) => (
                      <option key={d.id} value={d.id} disabled>{d.name} — {d.unavailableReason}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              {selectedDriverId && (
                <div className="flex items-center gap-1.5 text-[10px] font-700 uppercase tracking-wider" style={{ color: '#34D399' }}>
                  <CheckCircle size={11} weight="bold" /> Selected
                </div>
              )}
              {errors.driverId && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.driverId.message}</p>}
              {isLoadingDrivers && <p className="text-[10px] animate-pulse font-600" style={{ color: 'var(--text-tertiary)' }}>Loading operators...</p>}
            </div>

            {/* Vehicle */}
            <div className="space-y-1.5">
              <label style={labelCls}><Truck size={13} style={{ color: '#F97316' }} /> Allocate Vehicle</label>
              <select style={{ ...baseInputStyles, appearance: 'none' } as React.CSSProperties}
                {...register('vehicleId')} onFocus={setFocus} onBlur={setBlur}>
                <option value="">-- Select Fleet Asset --</option>
                {availableVehicles.length > 0 && (
                  <optgroup label={`✅ Available (${availableVehicles.length})`}>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} — {v.plateNumber}</option>
                    ))}
                  </optgroup>
                )}
                {unavailableVehicles.length > 0 && (
                  <optgroup label={`⛔ Unavailable (${unavailableVehicles.length})`}>
                    {unavailableVehicles.map((v) => (
                      <option key={v.id} value={v.id} disabled>{v.name} — {v.unavailableReason}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              {selectedVehicleId && (
                <div className="flex items-center gap-1.5 text-[10px] font-700 uppercase tracking-wider" style={{ color: '#34D399' }}>
                  <CheckCircle size={11} weight="bold" /> Selected
                </div>
              )}
              {errors.vehicleId && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.vehicleId.message}</p>}
              {isLoadingVehicles && <p className="text-[10px] animate-pulse font-600" style={{ color: 'var(--text-tertiary)' }}>Loading fleet vehicles...</p>}
            </div>
          </div>

          {availableDrivers.length === 0 || availableVehicles.length === 0 ? (
            <div className="text-xs rounded-xl p-3 flex items-center gap-2"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#FBBF24' }}>
              <Warning size={15} weight="duotone" />
              {availableDrivers.length === 0 ? 'No drivers currently available.' : 'No vehicles currently available.'}
            </div>
          ) : null}

          <div>
            <label style={labelCls}><FileText size={13} style={{ color: '#F97316' }} /> Notes (optional)</label>
            <textarea placeholder="Any additional instructions for this trip..."
              rows={2}
              style={{ ...baseInputStyles, resize: 'none' } as React.CSSProperties}
              {...register('notes')}
              onFocus={setFocus} onBlur={setBlur} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border-0)' }}>
            <button type="button" onClick={onClose} disabled={approveRequest.isPending}
              className="px-4 py-2 rounded-lg text-[12px] font-600 transition-all"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              Cancel
            </button>
            <button type="submit" disabled={approveRequest.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-700 transition-all"
              style={{
                background: approveRequest.isPending ? 'rgba(52,211,153,0.5)' : '#34D399',
                color: '#04060F', fontFamily: 'Space Grotesk',
              }}
              onMouseEnter={e => !approveRequest.isPending && (e.currentTarget.style.boxShadow = '0 0 20px rgba(52,211,153,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              {approveRequest.isPending
                ? <><div className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" /> Approving...</>
                : <><CheckCircle size={13} weight="bold" /> Approve & Assign</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
