import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Vehicle, CreateVehicleInput } from '../types';

const vehicleSchema = z.object({
  name: z.string().min(3, 'Vehicle nickname must contain at least 3 characters'),
  plateNumber: z.string().regex(/^[A-Z0-9- ]+$/i, 'Plate number must be alphanumeric (hyphens allowed)'),
  make: z.string().min(2, 'Make must contain at least 2 characters'),
  model: z.string().min(2, 'Model must contain at least 2 characters'),
  year: z.coerce.number().min(1980, 'Year must be at or after 1980').max(new Date().getFullYear() + 1, 'Year cannot exceed future bounds'),
  type: z.enum(['truck', 'van', 'car']),
  status: z.enum(['active', 'idle', 'maintenance', 'offline']),
});

type FormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  onSubmit: (data: CreateVehicleInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const inputCls: React.CSSProperties = {
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
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-secondary)',
  marginBottom: '4px',
};

export const VehicleForm: React.FC<VehicleFormProps> = ({ vehicle, onSubmit, onCancel, isLoading = false }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: vehicle?.name || '',
      plateNumber: vehicle?.plateNumber || '',
      make: vehicle?.make || '',
      model: vehicle?.model || '',
      year: vehicle?.year || new Date().getFullYear(),
      type: vehicle?.type || 'truck',
      status: vehicle?.status || 'idle',
    },
  });

  const setFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)');
  const setBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = 'var(--border-0)');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label style={labelCls}>Vehicle Nickname</label>
        <input type="text" placeholder="e.g. Nairobi Flatbed 03" style={inputCls}
          {...register('name')} onFocus={setFocus} onBlur={setBlur} />
        {errors.name && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label style={labelCls}>License Plate</label>
          <input type="text" placeholder="e.g. KCA 739 FX" style={inputCls}
            {...register('plateNumber')} onFocus={setFocus} onBlur={setBlur} />
          {errors.plateNumber && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.plateNumber.message}</p>}
        </div>
        <div>
          <label style={labelCls}>Manufacturer / Make</label>
          <input type="text" placeholder="e.g. Isuzu" style={inputCls}
            {...register('make')} onFocus={setFocus} onBlur={setBlur} />
          {errors.make && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.make.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label style={labelCls}>Model</label>
          <input type="text" placeholder="e.g. FVZ" style={inputCls}
            {...register('model')} onFocus={setFocus} onBlur={setBlur} />
          {errors.model && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.model.message}</p>}
        </div>
        <div>
          <label style={labelCls}>Year</label>
          <input type="number" placeholder="e.g. 2022" style={inputCls}
            {...register('year')} onFocus={setFocus} onBlur={setBlur} />
          {errors.year && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.year.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label style={labelCls}>Classification</label>
          <select style={{ ...inputCls, appearance: 'none' } as React.CSSProperties}
            {...register('type')} onFocus={setFocus} onBlur={setBlur}>
            <option value="truck">Truck (Heavy Rig)</option>
            <option value="van">Van (Light Delivery)</option>
            <option value="car">Car (Support Vehicle)</option>
          </select>
          {errors.type && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.type.message}</p>}
        </div>
        <div>
          <label style={labelCls}>Initial Status</label>
          <select style={{ ...inputCls, appearance: 'none' } as React.CSSProperties}
            {...register('status')} onFocus={setFocus} onBlur={setBlur}>
            <option value="active">Active</option>
            <option value="idle">Idle / Available</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
          {errors.status && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.status.message}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--border-0)' }}>
        <button type="button" onClick={onCancel} disabled={isLoading}
          className="px-4 py-2 rounded-lg text-[12px] font-600 transition-all"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
          Cancel
        </button>
        <button type="submit" disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-700 transition-all"
          style={{ background: isLoading ? 'rgba(249,115,22,0.5)' : '#F97316', color: '#04060F', fontFamily: 'Space Grotesk' }}
          onMouseEnter={e => !isLoading && (e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
          {isLoading
            ? <><div className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" /> Saving...</>
            : vehicle ? 'Update Vehicle' : 'Enroll Vehicle'}
        </button>
      </div>
    </form>
  );
};
