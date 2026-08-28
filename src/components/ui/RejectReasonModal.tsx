import React, { useEffect, useState } from 'react';
import { Warning } from '@phosphor-icons/react';

interface RejectReasonModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const Spinner: React.FC = () => (
  <span
    className="rounded-full border-2 animate-spin inline-block"
    style={{ width: 14, height: 14, borderColor: 'rgba(248,113,113,0.3)', borderTopColor: '#F87171' }}
  />
);

const MIN_LENGTH = 5;
const MAX_LENGTH = 500;

// Shared "reject with a required reason" modal — used for both employee
// account requests and transport requests, mirroring ConfirmModal's tokens
// but with a textarea slot ConfirmModal doesn't have.
export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  title,
  message,
  confirmLabel = 'Reject',
  onConfirm,
  onClose,
  isLoading,
}) => {
  const [reason, setReason] = useState('');
  const trimmedLength = reason.trim().length;
  const isValid = trimmedLength >= MIN_LENGTH && trimmedLength <= MAX_LENGTH;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(reason.trim());
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(4,6,15,0.7)', backdropFilter: 'blur(4px)' }}
      />
      <div
        style={{
          position: 'relative',
          background: 'var(--surface-1)',
          border: '1px solid var(--border-1)',
          borderRadius: 16,
          padding: 28,
          maxWidth: 420,
          width: '90%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Warning size={22} weight="duotone" color="#F87171" style={{ flexShrink: 0 }} />
          <h3 style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)', fontSize: 17, fontWeight: 700, margin: 0 }}>
            {title}
          </h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginTop: 8, marginBottom: 0, fontFamily: 'DM Sans' }}>
          {message}
        </p>

        <div style={{ marginTop: 16 }}>
          <label
            style={{
              display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'DM Sans',
            }}
          >
            Reason for rejection
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Explain why this is being rejected..."
            style={{
              width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-0)',
              borderRadius: 10, padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)',
              fontFamily: 'DM Sans', outline: 'none', resize: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(248,113,113,0.5)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-0)')}
          />
          {reason.length > 0 && !isValid && (
            <p style={{ color: '#F87171', fontSize: 11, marginTop: 4, fontFamily: 'DM Sans' }}>
              Reason must be between {MIN_LENGTH} and {MAX_LENGTH} characters
            </p>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 20 }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: 'transparent', border: '1px solid var(--border-1)',
              borderRadius: 10, padding: '9px 16px',
              color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
              fontFamily: 'Space Grotesk', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--surface-2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !isValid}
            style={{
              background: (isLoading || !isValid) ? 'rgba(248,113,113,0.5)' : '#F87171',
              color: '#fff',
              border: 'none', borderRadius: 10, padding: '9px 18px',
              fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk',
              cursor: (isLoading || !isValid) ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => { if (!isLoading && isValid) e.currentTarget.style.boxShadow = '0 0 20px rgba(248,113,113,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {isLoading && <Spinner />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
