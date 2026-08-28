import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Driver, CreateDriverInput } from '../types';

const driverSchema = z.object({
  name: z.string().min(3, 'Driver name must contain at least 3 characters'),
  email: z.string().email('Please provide a valid operational email address'),
  phone: z.string().min(10, 'Provide a valid phone number (at least 10 digits)'),
  status: z.enum(['active', 'idle', 'on-trip', 'offline']),
  licenseClass: z.string().min(2, 'License classification category required'),
  licenseNumber: z.string().min(5, 'License ID required'),
  licenseExpiry: z.string().refine((val) => !isNaN(Date.parse(val)), 'Provide a valid expiry date coordinate'),
  assignedVehicleId: z.string().optional(),
});

type FormData = z.infer<typeof driverSchema>;

interface DriverFormProps {
  driver?: Driver | null;
  onSubmit: (data: CreateDriverInput) => void;
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

export const DriverForm: React.FC<DriverFormProps> = ({ driver, onSubmit, onCancel, isLoading = false }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: driver?.name || '',
      email: driver?.email || '',
      phone: driver?.phone || '',
      status: driver?.status || 'idle',
      licenseClass: driver?.compliance.licenseClass || 'Class A CDL',
      licenseNumber: driver?.compliance.licenseNumber || '',
      licenseExpiry: driver?.compliance.licenseExpiry ? new Date(driver.compliance.licenseExpiry).toISOString().split('T')[0] : '',
      assignedVehicleId: driver?.assignedVehicleId || '',
    },
  });

  const setFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)');
  const setBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = 'var(--border-0)');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label style={labelCls}>Driver Full Name</label>
        <input type="text" placeholder="e.g. John Kamau" style={inputCls}
          {...register('name')} onFocus={setFocus} onBlur={setBlur} />
        {errors.name && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label style={labelCls}>Email Address</label>
          <input type="email" placeholder="john.kamau@fleetos.ke" style={inputCls}
            {...register('email')} onFocus={setFocus} onBlur={setBlur} />
          {errors.email && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.email.message}</p>}
        </div>
        <div>
          <label style={labelCls}>Contact Number</label>
          <input type="text" placeholder="+254 7XX XXX XXX" style={inputCls}
            {...register('phone')} onFocus={setFocus} onBlur={setBlur} />
          {errors.phone && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.phone.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label style={labelCls}>CDL Certification Class</label>
          <select style={{ ...inputCls, appearance: 'none' } as React.CSSProperties}
            {...register('licenseClass')} onFocus={setFocus} onBlur={setBlur}>
            <option value="Class A CDL">Class A CDL (Heavy Rig)</option>
            <option value="Class B CDL">Class B CDL (Light Rig/Bus)</option>
            <option value="Standard Class C">Standard Class C (Delivery Support)</option>
          </select>
          {errors.licenseClass && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.licenseClass.message}</p>}
        </div>
        <div>
          <label style={labelCls}>License ID / Number</label>
          <input type="text" placeholder="e.g. KE-DL-9002-XX" style={inputCls}
            {...register('licenseNumber')} onFocus={setFocus} onBlur={setBlur} />
          {errors.licenseNumber && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.licenseNumber.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label style={labelCls}>License Expiration Date</label>
          <input type="date" style={inputCls}
            {...register('licenseExpiry')} onFocus={setFocus} onBlur={setBlur} />
          {errors.licenseExpiry && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.licenseExpiry.message}</p>}
        </div>
        <div>
          <label style={labelCls}>Initial Operator Status</label>
          <select style={{ ...inputCls, appearance: 'none' } as React.CSSProperties}
            {...register('status')} onFocus={setFocus} onBlur={setBlur}>
            <option value="active">Active On-Duty</option>
            <option value="idle">Idle Available</option>
            <option value="on-trip">On Active Trip</option>
            <option value="offline">Offline Off-Duty</option>
          </select>
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
            : driver ? 'Update Registry' : 'Enroll Operator'}
        </button>
      </div>
    </form>
  );
};
