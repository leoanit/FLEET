import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  /** stacked = label above input (narrow modals); inline = label-left/input-right (dense admin forms) */
  layout?: 'stacked' | 'inline';
  htmlFor?: string;
  children: React.ReactNode;
}

// Wraps a react-hook-form-registered input with a label + error message.
// The input itself is untouched — pass it as `children` with className="field-input"
// (see .field-input in index.css) and its existing register(...) call stays as-is.
export const FormField: React.FC<FormFieldProps> = ({ label, error, layout = 'stacked', htmlFor, children }) => {
  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-secondary)',
  };

  if (layout === 'inline') {
    return (
      <div className="flex items-start gap-4 py-2" style={{ borderBottom: '1px solid var(--border-0)' }}>
        <label htmlFor={htmlFor} style={{ ...labelStyle, width: '160px', flexShrink: 0, paddingTop: '8px' }}>
          {label}
        </label>
        <div className="flex-1 min-w-0">
          {children}
          {error && <p className="text-xs font-600 mt-1" style={{ color: 'var(--apex-red)' }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={htmlFor} style={{ ...labelStyle, display: 'block', marginBottom: '4px' }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs font-600 mt-1" style={{ color: 'var(--apex-red)' }}>{error}</p>}
    </div>
  );
};
