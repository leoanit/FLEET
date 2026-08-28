import React from 'react';
import { Driver } from '../types';
import { Users, UserCheck, Compass, CalendarCheck } from '@phosphor-icons/react';

interface DriverStatsProps {
  drivers: Driver[];
}

export const DriverStats: React.FC<DriverStatsProps> = ({ drivers }) => {
  const stats = React.useMemo(() => {
    const total = drivers.length;
    const active = drivers.filter((d) => d.status === 'active').length;
    const onTrip = drivers.filter((d) => d.status === 'on-trip').length;
    const expiring = drivers.filter((d) => d.compliance.licenseStatus !== 'compliant').length;
    return { total, active, onTrip, expiring };
  }, [drivers]);

  const kpis = [
    { label: 'Enrolled Fleet Drivers', value: stats.total,    Icon: Users,         color: '#60A5FA' },
    { label: 'On-Duty Operators',       value: stats.active,   Icon: UserCheck,     color: '#34D399' },
    { label: 'Active Missions / Trips', value: stats.onTrip,   Icon: Compass,       color: '#A78BFA' },
    { label: 'Compliance Alerts',       value: stats.expiring, Icon: CalendarCheck, color: '#F87171' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {kpis.map(({ label, value, Icon, color }, i) => (
        <div key={label} className={`surface-card p-5 flex items-center justify-between anim-in d-${(i + 1) * 100}`}>
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
