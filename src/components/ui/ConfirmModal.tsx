import React, { useEffect } from 'react';
import { Warning, CheckCircle } from '@phosphor-icons/react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  isDangerous?: boolean;
  isLoading?: boolean;
}

const Spinner: React.FC = () => (
  <span
    className="rounded-full border-2 animate-spin inline-block"
    style={{ width: 14, height: 14, borderColor: 'rgba(249,115,22,0.3)', borderTopColor: '#F97316' }}
  />
);

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
  isDangerous,
  isLoading,
}) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(4,6,15,0.7)', backdropFilter: 'blur(4px)',
        }}
      />
      <div
        style={{
          position: 'relative',
          background: 'var(--surface-1)',
          border: '1px solid var(--border-1)',
          borderRadius: 16,
          padding: 28,
          maxWidth: 400,
          width: '90%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isDangerous ? (
            <Warning size={22} weight="duotone" color="#F87171" style={{ flexShrink: 0 }} />
          ) : (
            <CheckCircle size={22} weight="duotone" color="#F97316" style={{ flexShrink: 0 }} />
          )}
          <h3
            style={{
              fontFamily: 'Space Grotesk', color: 'var(--text-primary)',
              fontSize: 17, fontWeight: 700, margin: 0,
            }}
          >
            {title}
          </h3>
        </div>

        <p
          style={{
            color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6,
            marginTop: 8, marginBottom: 0, fontFamily: 'DM Sans',
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
            gap: 10, marginTop: 24,
          }}
        >
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
              e.currentTarget.style.boxShadow = '0 0 14px rgba(255,255,255,0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              background: isDangerous ? '#F87171' : '#F97316',
              color: isDangerous ? '#fff' : '#04060F',
              border: 'none', borderRadius: 10, padding: '9px 18px',
              fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk',
              cursor: isLoading ? 'wait' : 'pointer', transition: 'all 0.15s',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = isDangerous
                ? '0 0 20px rgba(248,113,113,0.4)'
                : '0 0 20px rgba(249,115,22,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isLoading && <Spinner />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
