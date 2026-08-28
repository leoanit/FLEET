import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Calendar, Truck, User, MapPin, FileText, Warning, CheckCircle, XCircle } from '@phosphor-icons/react';
import { Dispatch } from '../types';
import { useAssetAvailability } from '../hooks/useAssetAvailability';

const dispatchSchema = z.object({
  origin: z.string().min(2, 'Origin location must contain at least 2 characters'),
  destination: z.string().min(2, 'Destination location must contain at least 2 characters'),
  scheduledDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Provide a valid scheduling date'),
  driverId: z.string().optional(),
  vehicleId: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof dispatchSchema>;

interface DispatchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    origin: string;
    destination: string;
    scheduledDate: string;
    notes?: string;
    driverId?: string;
    vehicleId?: string;
  }) => void;
  dispatch?: Dispatch | null;
  isLoading?: boolean;
}


export const DispatchFormModal: React.FC<DispatchFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  dispatch = null,
  isLoading = false,
}) => {
  // Fetch active drivers/vehicles, classified by availability against existing dispatches
  const {
    drivers, vehicles,
    availableDrivers, unavailableDrivers,
    availableVehicles, unavailableVehicles,
    isLoadingDrivers, isLoadingVehicles,
  } = useAssetAvailability({
    excludeDispatchId: dispatch?.id,
    currentDriverId: dispatch?.driverId,
    currentVehicleId: dispatch?.vehicleId,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(dispatchSchema),
    defaultValues: {
      origin: '',
      destination: '',
      scheduledDate: '',
      driverId: '',
      vehicleId: '',
      notes: '',
    },
  });

  // Watch selected values for conflict detection
  const selectedDriverId = watch('driverId');
  const selectedVehicleId = watch('vehicleId');

  // Load dispatch values if editing
  useEffect(() => {
    if (dispatch) {
      reset({
        origin: dispatch.origin || '',
        destination: dispatch.destination || '',
        scheduledDate: dispatch.scheduledDate
          ? new Date(dispatch.scheduledDate).toISOString().split('T')[0]
          : '',
        driverId: dispatch.driverId || '',
        vehicleId: dispatch.vehicleId || '',
        notes: dispatch.notes || '',
      });
    } else {
      reset({
        origin: '',
        destination: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        driverId: '',
        vehicleId: '',
        notes: '',
      });
    }
  }, [dispatch, reset, isOpen]);

  // Clear errors dynamically when selections change
  useEffect(() => {
    if (selectedDriverId) clearErrors('driverId');
  }, [selectedDriverId, clearErrors]);

  useEffect(() => {
    if (selectedVehicleId) clearErrors('vehicleId');
  }, [selectedVehicleId, clearErrors]);

  if (!isOpen) return null;

  // Resolve selected items for conflict alerts
  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const isDriverOccupied = selectedDriver && !selectedDriver.isAvailable && !selectedDriver.isCurrentlyAssigned;
  const isVehicleOccupied = selectedVehicle && !selectedVehicle.isAvailable && !selectedVehicle.isCurrentlyAssigned;

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

  const setFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)');
  const setBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = 'var(--border-0)');

  const handleFormSubmit = (data: FormData) => {
    // 1. Prevent submission of occupied driver
    if (isDriverOccupied && selectedDriver) {
      setError('driverId', {
        type: 'manual',
        message: `${selectedDriver.name} is already occupied on another route.`,
      });
      return;
    }

    // 2. Prevent submission of occupied vehicle
    if (isVehicleOccupied && selectedVehicle) {
      setError('vehicleId', {
        type: 'manual',
        message: `${selectedVehicle.name} is currently occupied or unavailable.`,
      });
      return;
    }

    // Standardize empty strings to undefined to match API expectations
    const formattedData = {
      origin: data.origin,
      destination: data.destination,
      scheduledDate: new Date(data.scheduledDate).toISOString(),
      notes: data.notes || undefined,
      driverId: data.driverId || undefined,
      vehicleId: data.vehicleId || undefined,
    };
    onSubmit(formattedData);
  };

  const labelCls: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '4px',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', boxShadow: '0 25px 80px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div>
            <h3 className="font-display font-600 text-base" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
              {dispatch ? 'Modify Dispatch Parameters' : 'Create Logistics Dispatch'}
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Plan transit routes and allocate operational assets
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 overflow-y-auto flex-1 p-6">
          {/* ROUTE */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label style={labelCls}><MapPin size={13} style={{ color: '#F97316' }} /> Origin Location</label>
              <input type="text" placeholder="e.g. Mombasa Port Terminal"
                style={baseInputStyles} {...register('origin')}
                onFocus={setFocus} onBlur={setBlur} />
              {errors.origin && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.origin.message}</p>}
            </div>
            <div>
              <label style={labelCls}><MapPin size={13} style={{ color: '#F87171' }} /> Destination</label>
              <input type="text" placeholder="e.g. Nairobi ICD"
                style={baseInputStyles} {...register('destination')}
                onFocus={setFocus} onBlur={setBlur} />
              {errors.destination && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.destination.message}</p>}
            </div>
          </div>

          {/* DATE */}
          <div>
            <label style={labelCls}><Calendar size={13} style={{ color: '#F97316' }} /> Dispatch Schedule Date</label>
            <input type="date" style={baseInputStyles} {...register('scheduledDate')}
              onFocus={setFocus} onBlur={setBlur} />
            {errors.scheduledDate && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.scheduledDate.message}</p>}
          </div>

          {/* ASSETS */}
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
              {selectedDriverId && selectedDriver && (
                <div className="flex items-center gap-1.5 text-[10px] font-700 uppercase tracking-wider"
                  style={{ color: selectedDriver.isAvailable || selectedDriver.isCurrentlyAssigned ? '#34D399' : '#F87171' }}>
                  {selectedDriver.isAvailable || selectedDriver.isCurrentlyAssigned
                    ? <><CheckCircle size={11} weight="bold" /> Available — {selectedDriver.status}</>
                    : <><XCircle size={11} weight="bold" /> {selectedDriver.unavailableReason}</>}
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
              {selectedVehicleId && selectedVehicle && (
                <div className="flex items-center gap-1.5 text-[10px] font-700 uppercase tracking-wider"
                  style={{ color: selectedVehicle.isAvailable || selectedVehicle.isCurrentlyAssigned ? '#34D399' : '#F87171' }}>
                  {selectedVehicle.isAvailable || selectedVehicle.isCurrentlyAssigned
                    ? <><CheckCircle size={11} weight="bold" /> Available — {selectedVehicle.plateNumber}</>
                    : <><XCircle size={11} weight="bold" /> {selectedVehicle.unavailableReason}</>}
                </div>
              )}
              {errors.vehicleId && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.vehicleId.message}</p>}
              {isLoadingVehicles && <p className="text-[10px] animate-pulse font-600" style={{ color: 'var(--text-tertiary)' }}>Loading fleet vehicles...</p>}
            </div>
          </div>

          {/* AVAILABILITY SUMMARY */}
          <div className="rounded-xl p-3 grid grid-cols-2 gap-3"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                <User size={13} style={{ color: '#34D399' }} />
              </div>
              <div>
                <p className="text-[9px] font-700 uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Drivers</p>
                <p className="text-xs font-700" style={{ color: 'var(--text-primary)' }}>
                  <span style={{ color: '#34D399' }}>{availableDrivers.length}</span>
                  <span style={{ color: 'var(--text-tertiary)' }}> / {drivers.length}</span>
                  <span className="text-[9px] ml-1" style={{ color: 'var(--text-tertiary)' }}>available</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                <Truck size={13} style={{ color: '#34D399' }} />
              </div>
              <div>
                <p className="text-[9px] font-700 uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Vehicles</p>
                <p className="text-xs font-700" style={{ color: 'var(--text-primary)' }}>
                  <span style={{ color: '#34D399' }}>{availableVehicles.length}</span>
                  <span style={{ color: 'var(--text-tertiary)' }}> / {vehicles.length}</span>
                  <span className="text-[9px] ml-1" style={{ color: 'var(--text-tertiary)' }}>available</span>
                </p>
              </div>
            </div>
          </div>

          {/* CONFLICT ALERT */}
          {(isDriverOccupied || isVehicleOccupied) && (
            <div className="text-xs rounded-xl p-3 space-y-1.5"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <span className="font-700 flex items-center gap-1.5" style={{ color: '#FBBF24' }}>
                <Warning size={15} weight="duotone" /> Operational Asset Conflict
              </span>
              {isDriverOccupied && selectedDriver && (
                <p className="font-500 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedDriver.name}</strong> is busy/on-trip and cannot be double-booked.
                </p>
              )}
              {isVehicleOccupied && selectedVehicle && (
                <p className="font-500 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedVehicle.name}</strong> is {selectedVehicle.status} and unavailable.
                </p>
              )}
            </div>
          )}

          {/* NOTES */}
          <div>
            <label style={labelCls}><FileText size={13} style={{ color: '#F97316' }} /> Logistics Notes / Instructions</label>
            <textarea placeholder="Provide transit routing details, cargo manifests, customer contact info..."
              rows={3}
              style={{ ...baseInputStyles, resize: 'none' } as React.CSSProperties}
              {...register('notes')}
              onFocus={setFocus} onBlur={setBlur} />
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border-0)' }}>
            <button type="button" onClick={onClose} disabled={isLoading}
              className="px-4 py-2 rounded-lg text-[12px] font-600 transition-all"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading || !!isDriverOccupied || !!isVehicleOccupied}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-700 transition-all"
              style={{
                background: (isLoading || isDriverOccupied || isVehicleOccupied) ? 'rgba(249,115,22,0.5)' : '#F97316',
                color: '#04060F', fontFamily: 'Space Grotesk',
              }}
              onMouseEnter={e => !isLoading && !isDriverOccupied && !isVehicleOccupied && (e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              {isLoading
                ? <><div className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" /> Saving...</>
                : dispatch ? 'Update Dispatch' : 'Assign Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
