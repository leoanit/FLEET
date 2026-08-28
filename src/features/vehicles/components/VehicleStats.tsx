import React from 'react';
import { Vehicle } from '../types';
import { Truck, Pulse, ShieldWarning, WifiX, ArrowsClockwise } from '@phosphor-icons/react';

interface VehicleStatsProps {
  vehicles: Vehicle[];
}

export const VehicleStats: React.FC<VehicleStatsProps> = ({ vehicles }) => {
  const stats = React.useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter((v) => v.status === 'active').length;
    const idle = vehicles.filter((v) => v.status === 'idle').length;
    const maintenance = vehicles.filter((v) => v.status === 'maintenance').length;
    const offline = vehicles.filter((v) => v.status === 'offline').length;
    return { total, active, idle, maintenance, offline };
  }, [vehicles]);

  const cards = [
    { label: 'Total Fleet Size',   value: stats.total,       Icon: Truck,           color: '#60A5FA' },
    { label: 'Active & En Route',  value: stats.active,      Icon: Pulse,           color: '#34D399' },
    { label: 'Idle / Standing By', value: stats.idle,        Icon: ArrowsClockwise, color: '#FBBF24' },
    { label: 'In Service Bay',     value: stats.maintenance, Icon: ShieldWarning,   color: '#F87171' },
    { label: 'Offline Signal',     value: stats.offline,     Icon: WifiX,           color: '#94A3B8' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
      {cards.map(({ label, value, Icon, color }, i) => (
        <div key={label} className={`surface-card p-5 flex items-center justify-between anim-in d-${Math.min((i + 1) * 100, 500)}`}>
          <div>
            <p className="text-micro mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
            <p className="font-700 text-2xl" style={{ fontFamily: 'IBM Plex Mono', color: 'var(--text-primary)' }}>
              {value}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
            <Icon size={20} weight="duotone" style={{ color }} />
          </div>
        </div>
      ))}
    </div>
  );
};
