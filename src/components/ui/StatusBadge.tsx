import React from 'react';
import { StatusDomain, getStatusEntry } from '../../config/statusRegistry';

interface StatusBadgeProps {
  domain: StatusDomain;
  status: string;
  /** Override the registry's default pulse behavior for this instance */
  pulse?: boolean;
  /** Optional label override — defaults to the raw status string */
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ domain, status, pulse, label }) => {
  const entry = getStatusEntry(domain, status);
  const shouldPulse = pulse ?? entry.pulse ?? false;
  const color = `var(${entry.color})`;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-700 uppercase tracking-wider"
      style={{
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
        color,
      }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${shouldPulse ? 'animate-pulse' : ''}`}
        style={{ background: color }}
      />
      {label ?? status}
    </span>
  );
};
