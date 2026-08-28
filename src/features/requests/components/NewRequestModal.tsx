import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, MapPin, Calendar, FileText } from '@phosphor-icons/react';
import { useCreateTransportRequest } from '../hooks/useTransportRequests';

const requestSchema = z.object({
  origin: z.string().min(2, 'Origin location must contain at least 2 characters'),
  destination: z.string().min(2, 'Destination location must contain at least 2 characters'),
  purpose: z.string().min(5, 'Please describe the purpose of this trip'),
  travelDateTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Provide a valid travel date and time'),
});

type FormData = z.infer<typeof requestSchema>;

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const baseInputStyles: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface-2)',
  border: '1px solid var(--border-0)',
  borderRadius: '8px',
  padding: '10px 12px',
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

export const NewRequestModal: React.FC<NewRequestModalProps> = ({ isOpen, onClose }) => {
  const createRequest = useCreateTransportRequest();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: { origin: '', destination: '', purpose: '', travelDateTime: '' },
  });

  if (!isOpen) return null;

  const setFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)');
  const setBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = 'var(--border-0)');

  const handleFormSubmit = async (data: FormData) => {
    try {
      await createRequest.mutateAsync({
        origin: data.origin,
        destination: data.destination,
        purpose: data.purpose,
        travelDateTime: new Date(data.travelDateTime).toISOString(),
      });
      reset();
      onClose();
    } catch (err) {
      console.error('Failed to submit transport request:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', boxShadow: '0 25px 80px rgba(0,0,0,0.7)' }}>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div>
            <h3 className="font-display font-600 text-base" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
              New Transport Request
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Submit a request for a vehicle and driver
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
          <div>
            <label style={labelCls}><MapPin size={13} style={{ color: '#F97316' }} /> Origin</label>
            <input type="text" placeholder="e.g. CRA Head Office, Nairobi"
              style={baseInputStyles} {...register('origin')}
              onFocus={setFocus} onBlur={setBlur} />
            {errors.origin && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.origin.message}</p>}
          </div>

          <div>
            <label style={labelCls}><MapPin size={13} style={{ color: '#F87171' }} /> Destination</label>
            <input type="text" placeholder="e.g. KRA Times Tower"
              style={baseInputStyles} {...register('destination')}
              onFocus={setFocus} onBlur={setBlur} />
            {errors.destination && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.destination.message}</p>}
          </div>

          <div>
            <label style={labelCls}><Calendar size={13} style={{ color: '#F97316' }} /> Travel Date & Time</label>
            <input type="datetime-local" style={baseInputStyles} {...register('travelDateTime')}
              onFocus={setFocus} onBlur={setBlur} />
            {errors.travelDateTime && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.travelDateTime.message}</p>}
          </div>

          <div>
            <label style={labelCls}><FileText size={13} style={{ color: '#F97316' }} /> Purpose of Trip</label>
            <textarea placeholder="Briefly describe the errand or meeting..."
              rows={3}
              style={{ ...baseInputStyles, resize: 'none' } as React.CSSProperties}
              {...register('purpose')}
              onFocus={setFocus} onBlur={setBlur} />
            {errors.purpose && <p className="text-xs font-600 mt-1" style={{ color: '#F87171' }}>{errors.purpose.message}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border-0)' }}>
            <button type="button" onClick={onClose} disabled={createRequest.isPending}
              className="px-4 py-2 rounded-lg text-[12px] font-600 transition-all"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              Cancel
            </button>
            <button type="submit" disabled={createRequest.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-700 transition-all"
              style={{
                background: createRequest.isPending ? 'rgba(249,115,22,0.5)' : '#F97316',
                color: '#04060F', fontFamily: 'Space Grotesk',
              }}
              onMouseEnter={e => !createRequest.isPending && (e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              {createRequest.isPending
                ? <><div className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" /> Submitting...</>
                : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
