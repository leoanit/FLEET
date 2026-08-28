import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  NavigationArrow, Truck, Users, ShieldWarning, CheckCircle,
  Warning, ArrowRight, Wrench, TrendUp, TrendDown,
  ArrowSquareOut, Gauge, Lightning, CaretRight, Minus,
} from '@phosphor-icons/react';
import { useAnalyticsSummary } from '../../hooks/useAnalytics';
import { useVehicleActions } from '../../features/vehicles/hooks/useVehicles';
import { useComplianceAlerts, formatDaysLabel } from '../../hooks/useComplianceAlerts';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
// ─── SVG Fleet Health Gauge ───────────────────────────────────────────────────
const HealthGauge: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 44, cx = 56, cy = 56;
  const circ = Math.PI * r;
  const dash  = (pct / 100) * circ;
  const color = pct >= 80 ? '#34D399' : pct >= 60 ? '#FBBF24' : '#F87171';
  return (
    <svg width={112} height={68} viewBox="0 0 112 68">
      {/* Track */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="var(--border-1)" strokeWidth={7} strokeLinecap="round" />
      {/* Fill */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} className="anim-arc"
        style={{ filter: `drop-shadow(0 0 6px ${color}60)` }} />
      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight="700" fontSize="18" fill="white">{pct}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontFamily="DM Sans" fontWeight="500" fontSize="9" fill="var(--text-secondary)" letterSpacing="0.08em">HEALTH %</text>
    </svg>
  );
};

// ─── Mini spark bars ──────────────────────────────────────────────────────────
const SparkBars: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#F97316' }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-[18px]">
      {data.map((v, i) => (
        <div key={i} className="w-[4px] rounded-[2px]" style={{
          height: `${Math.max(10, Math.round((v / max) * 100))}%`,
          background: i === data.length - 1 ? color : `${color}55`,
          animation: `bar-grow 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms both`,
          transformOrigin: 'bottom',
        }} />
      ))}
    </div>
  );
};

// ─── Live clock ───────────────────────────────────────────────────────────────
const LiveClock: React.FC = () => {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <div className="hidden lg:flex flex-col items-end gap-0.5">
      <span className="font-mono text-xl font-600 tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {t.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className="text-micro" style={{ color: 'var(--text-secondary)' }}>
        {t.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const S = ({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) => (
  <div className={`skel ${w} ${h}`} />
);

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-[11px]" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', fontFamily: 'DM Sans' }}>
      <p className="font-600 mb-2" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="h-1 w-3 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span className="font-mono font-600" style={{ color: 'var(--text-primary)' }}>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const FALLBACK = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(n => ({ name: n, tripCount: 0, totalDistance: 0 }));

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KPIProps {
  label: string;
  value: string | number;
  sub: string;
  Icon: React.ElementType;
  spark?: number[];
  accent?: string;         // hex
  trend?: 'up' | 'down' | 'flat';
  trendText?: string;
  pulse?: boolean;
  delay?: string;
}

const KPICard: React.FC<KPIProps> = ({ label, value, sub, Icon, spark, accent = '#F97316', trend, trendText, pulse, delay = '' }) => (
  <div className={`surface-card card-lift anim-in ${delay} relative overflow-hidden`} style={{ padding: '20px' }}>
    {/* Subtle top accent line */}
    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }} />

    <div className="flex items-start justify-between mb-4">
      {/* Icon */}
      <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}>
        {pulse ? (
          <div className="relative flex items-center justify-center">
            <span className="absolute h-full w-full rounded-full animate-ping" style={{ background: `${accent}30` }} />
            <Icon size={17} weight="bold" style={{ color: accent, position: 'relative' }} />
          </div>
        ) : (
          <Icon size={17} weight="duotone" style={{ color: accent }} />
        )}
      </div>

      {/* Trend pill */}
      {trend && trendText && (
        <div className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{
          background: trend === 'up' ? 'rgba(52,211,153,0.1)' : trend === 'down' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${trend === 'up' ? 'rgba(52,211,153,0.25)' : trend === 'down' ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.08)'}`,
        }}>
          {trend === 'up' ? <TrendUp size={10} weight="bold" style={{ color: '#34D399' }} />
            : trend === 'down' ? <TrendDown size={10} weight="bold" style={{ color: '#F87171' }} />
            : <Minus size={10} weight="bold" style={{ color: 'var(--text-secondary)' }} />}
          <span className="text-[10px] font-600" style={{ color: trend === 'up' ? '#34D399' : trend === 'down' ? '#F87171' : 'var(--text-secondary)' }}>
            {trendText}
          </span>
        </div>
      )}
    </div>

    {/* Number */}
    <p className="font-mono text-[2.2rem] font-700 leading-none tabular-nums anim-number" style={{ color: 'var(--text-primary)' }}>{value}</p>
    <p className="text-micro mt-2 mb-3" style={{ color: 'var(--text-secondary)' }}>{label}</p>

    <div className="flex items-end justify-between pt-3" style={{ borderTop: '1px solid var(--border-0)' }}>
      <p className="text-[11px]" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans', maxWidth: '70%' }}>{sub}</p>
      {spark && <SparkBars data={spark} color={accent} />}
    </div>
  </div>
);

// ─── Main page ─────────────────────────────────────────────────────────────────
export const DashboardOverviewPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: analytics, isLoading, isError } = useAnalyticsSummary();
  const { updateVehicle, isUpdating } = useVehicleActions();
  const compliance = useComplianceAlerts();
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; onConfirm: () => void; isDangerous?: boolean } | null>(null);

  const handleMaintenance = (vehicleId: string, vehicleName: string) => {
    setConfirmState({
      title: 'Schedule Maintenance',
      message: `Schedule ${vehicleName} for maintenance?`,
      isDangerous: false,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await updateVehicle({ id: vehicleId, status: 'maintenance' });
          queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] });
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        } catch { /* ignore */ }
      },
    });
  };

  const chartData = analytics?.weeklyTrips?.length ? analytics.weeklyTrips : FALLBACK;
  const maintenanceAlerts = analytics?.maintenanceAlerts?.filter(a => a.status !== 'maintenance') ?? [];

  const sparkWeek = chartData.map(d => d.tripCount);

  const kpis: KPIProps[] | null = analytics ? [
    {
      label: 'Active Missions',
      value: analytics.activeTripCount,
      sub: `${analytics.vehicles.total - analytics.activeTripCount} vehicles available`,
      Icon: NavigationArrow,
      accent: '#F97316',
      spark: sparkWeek,
      trend: 'flat',
      trendText: `${analytics.vehicles.total} total`,
      delay: 'd-100',
    },
    {
      label: 'Fleet Health',
      value: `${analytics.vehicles.healthScore}%`,
      sub: `${analytics.vehicles.maintenance} in service · ${analytics.vehicles.offline} offline`,
      Icon: Gauge,
      accent: analytics.vehicles.healthScore >= 80 ? '#34D399' : '#FBBF24',
      spark: [analytics.vehicles.healthScore - 10, analytics.vehicles.healthScore - 5, analytics.vehicles.healthScore],
      trend: analytics.vehicles.healthScore >= 80 ? 'up' : 'down',
      trendText: analytics.vehicles.healthScore >= 80 ? 'Optimal' : 'Degraded',
      delay: 'd-200',
    },
    {
      label: 'Compliance Alerts',
      value: analytics.complianceAlerts > 0 ? analytics.complianceAlerts : '—',
      sub: analytics.complianceAlerts > 0 ? 'Credentials expiring or expired' : 'All credentials current',
      Icon: analytics.complianceAlerts > 0 ? ShieldWarning : CheckCircle,
      accent: analytics.complianceAlerts > 0 ? '#F87171' : '#34D399',
      pulse: analytics.complianceAlerts > 0,
      trend: analytics.complianceAlerts > 0 ? 'down' : 'up',
      trendText: analytics.complianceAlerts > 0 ? 'Action needed' : 'All clear',
      delay: 'd-300',
    },
    {
      label: 'Drivers On Trip',
      value: `${analytics.drivers.onTrip} / ${analytics.drivers.total}`,
      sub: `${analytics.drivers.idle} idle · ${analytics.drivers.active} assigned`,
      Icon: Users,
      accent: '#60A5FA',
      spark: [analytics.drivers.idle, analytics.drivers.active, analytics.drivers.onTrip],
      trend: 'flat',
      trendText: `${analytics.drivers.total} enrolled`,
      delay: 'd-400',
    },
  ] : null;

  return (
    <div style={{ color: 'var(--text-primary)', fontFamily: 'DM Sans' }}>

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6 anim-in">
        <div>
          <div className="badge-live mb-3">System Nominal · Live</div>
          <h1 className="font-display font-700 text-[1.75rem] leading-tight mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk', letterSpacing: '-0.03em' }}>
            Fleet Operations
          </h1>
          <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
            Real-time telemetry · Fleet health · Compliance · Dispatch
          </p>
        </div>
        <LiveClock />
      </div>

      {/* ── Maintenance alerts ── */}
      {maintenanceAlerts.length > 0 && (
        <div className="space-y-2 mb-5">
          {maintenanceAlerts.map(alert => (
            <div key={alert.vehicleId} className="relative rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 anim-in"
              style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ background: 'linear-gradient(to bottom, #FBBF24, #F97316)' }} />
              <div className="flex items-start gap-3 pl-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
                  <Warning size={15} weight="bold" style={{ color: '#FBBF24' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-display font-600 text-sm" style={{ color: '#FDE68A' }}>Maintenance Due</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'var(--surface-0)', border: '1px solid var(--border-1)', color: 'var(--apex-orange)' }}>{alert.plateNumber}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{alert.vehicleName}</span> — odometer{' '}
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{alert.currentOdometer.toLocaleString()} km</span>
                    {' '}(due at {alert.nextServiceMileage.toLocaleString()} km) ·{' '}
                    <span style={{ color: '#FBBF24', textTransform: 'capitalize' }}>{alert.serviceType.replace('-', ' ')}</span>
                  </p>
                  <p className="text-micro mt-1.5" style={{ color: '#FBBF24' }}>
                    {alert.remainingKm === 0 ? 'Overdue — schedule immediately' : `${alert.remainingKm.toLocaleString()} km remaining`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleMaintenance(alert.vehicleId, alert.vehicleName)}
                disabled={isUpdating}
                className="shrink-0 rounded-lg font-600 text-xs flex items-center gap-1.5"
                style={{ background: '#FBBF24', color: '#0A0D18', padding: '6px 12px', border: 'none', cursor: isUpdating ? 'not-allowed' : 'pointer', opacity: isUpdating ? 0.6 : 1 }}>
                <Wrench size={13} /> Schedule Service
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── KPI Cards ── */}
      {isError ? (
        <div className="rounded-xl p-5 mb-5 text-sm text-center" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
          Cannot load analytics — is the backend running on port 5001?
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-5">
          {isLoading || !kpis
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="surface-card p-5 space-y-4">
                  <div className="flex justify-between"><S w="w-9" h="h-9" /><S w="w-20" h="h-5" /></div>
                  <S w="w-28" h="h-9" /><S w="w-20" h="h-3" />
                  <div className="pt-3" style={{ borderTop: '1px solid var(--border-0)' }}><S w="w-36" h="h-3" /></div>
                </div>
              ))
            : kpis.map(k => <KPICard key={k.label} {...k} />)
          }
        </div>
      )}

      {/* ── Chart + Fleet breakdown ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-4">

        {/* Weekly chart (2/3) */}
        <div className="lg:col-span-2 surface-card overflow-hidden anim-in d-200">
          {/* Card header */}
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-0)' }}>
            <div>
              <p className="font-display font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Weekly Performance</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Distance (km) and trip volume — last 7 days</p>
            </div>
            <div className="hidden sm:flex items-center gap-5">
              <div className="text-right">
                <p className="font-mono font-700 text-lg" style={{ color: 'var(--text-primary)' }}>
                  {chartData.reduce((s, d) => s + d.totalDistance, 0).toLocaleString()}
                </p>
                <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>km logged</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-700 text-lg" style={{ color: 'var(--apex-orange)' }}>
                  {chartData.reduce((s, d) => s + d.tripCount, 0)}
                </p>
                <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>trips</p>
              </div>
            </div>
          </div>

          {/* Chart body */}
          <div className="h-56 px-1 pt-4 pb-2">
            {isLoading ? (
              <div className="h-full mx-4 rounded-lg skel flex items-center justify-center">
                <span className="text-micro" style={{ color: 'var(--text-tertiary)' }}>Loading data...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F97316" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border-0)" strokeDasharray="4 4" opacity={0.6} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" name="Distance (km)" dataKey="totalDistance" stroke="#F97316" strokeWidth={1.5}
                    fill="url(#g1)" dot={false} activeDot={{ r: 4, fill: '#F97316', strokeWidth: 0 }} />
                  <Area type="monotone" name="Trip Count" dataKey="tripCount" stroke="#60A5FA" strokeWidth={1.5}
                    fill="url(#g2)" dot={false} activeDot={{ r: 4, fill: '#60A5FA', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="px-5 pb-4 flex items-center gap-5">
            {[['#F97316','Distance km'], ['#60A5FA','Trip count']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <span className="h-1.5 w-4 rounded-full" style={{ background: c }} />
                <span className="text-micro" style={{ color: 'var(--text-secondary)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet health gauge + status (1/3) */}
        <div className="surface-card p-5 flex flex-col anim-in d-300">
          <p className="font-display font-600 text-sm mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Fleet Health</p>

          {isLoading ? (
            <div className="flex flex-col items-center gap-4 flex-1">
              <S w="w-28" h="h-16" /><S w="w-full" h="h-4" /><S w="w-full" h="h-4" /><S w="w-full" h="h-4" />
            </div>
          ) : analytics ? (
            <>
              {/* SVG Gauge */}
              <div className="flex justify-center mb-4">
                <HealthGauge pct={analytics.vehicles.healthScore} />
              </div>

              {/* Status rows */}
              <div className="space-y-2.5 flex-1">
                {[
                  { label: 'Active',      val: analytics.vehicles.active,       color: '#34D399' },
                  { label: 'Idle',        val: analytics.vehicles.idle,         color: '#60A5FA' },
                  { label: 'Maintenance', val: analytics.vehicles.maintenance,  color: '#FBBF24' },
                  { label: 'Offline',     val: analytics.vehicles.offline,      color: '#4E5A7A' },
                ].map(item => {
                  const pct = analytics.vehicles.total > 0 ? Math.round((item.val / analytics.vehicles.total) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="h-[5px] w-[5px] rounded-full" style={{ background: item.color }} />
                          <span className="text-[11px] font-500" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-600" style={{ color: 'var(--text-primary)' }}>{item.val}</span>
                          <span className="text-micro" style={{ color: 'var(--text-tertiary)' }}>{pct}%</span>
                        </div>
                      </div>
                      <div className="h-[3px] w-full rounded-full overflow-hidden" style={{ background: 'var(--border-0)' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-0)' }}>
                <Link to="/vehicles" className="flex items-center justify-between text-[11px] font-500 transition-colors group" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--apex-orange)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                  <span>Open Fleet Registry</span>
                  <ArrowRight size={13} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* ── Incidents + Compliance ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Incident log (2/3) */}
        <div className="lg:col-span-2 surface-card overflow-hidden anim-in d-300">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-0)' }}>
            <div>
              <p className="font-display font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Incident Log</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Live events from on-board sensors and dispatch</p>
            </div>
            <div className="badge-live">Live</div>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border-0)' }}>
            {[
              { Icon: Lightning, accent: '#F87171', ring: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', title: 'Engine Coolant Over-temperature', meta: 'Cascadia CAS-03 · WA-739-FX', badge: 'Critical', badgeColor: '#F87171', time: '11:14', ping: true },
              { Icon: Truck,     accent: '#FBBF24', ring: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)',  title: 'Low Fuel Warning — below 10%',   meta: 'Peterbilt Flatbed · OR-882-PL', badge: 'Refuel',   badgeColor: '#FBBF24', time: '10:52', ping: false },
              { Icon: Wrench,    accent: '#60A5FA', ring: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)',  title: 'Scheduled Maintenance Logged',  meta: 'Chevrolet Express · OR-110-SV', badge: 'Scheduled', badgeColor: '#60A5FA', time: '09:30', ping: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 group cursor-pointer transition-colors"
                style={{ borderBottom: i < 2 ? '1px solid var(--border-0)' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <div className="flex items-center gap-3.5">
                  <div className="relative h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.ring, border: `1px solid ${item.border}` }}>
                    {item.ping && <span className="absolute inset-0 rounded-xl animate-ping" style={{ background: item.ring }} />}
                    <item.Icon size={16} weight="bold" style={{ color: item.accent, position: 'relative' }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-500" style={{ color: 'var(--text-primary)', fontFamily: 'DM Sans' }}>{item.title}</p>
                    <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.meta}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-[10px] font-600 px-2 py-0.5 rounded-full" style={{ background: `${item.badgeColor}15`, color: item.badgeColor, border: `1px solid ${item.badgeColor}30` }}>
                    {item.badge}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance panel (1/3) */}
        <div className="surface-card overflow-hidden anim-in d-400">
          <div className="px-5 py-4 flex items-start justify-between" style={{ borderBottom: '1px solid var(--border-0)' }}>
            <div>
              <p className="font-display font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Driver Compliance</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>CDL · DOT Physical · Drug Test</p>
            </div>
            {compliance.alerts.length > 0 && (
              <span className="font-mono text-[10px] font-700 px-2 py-0.5 rounded-full" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                {compliance.alerts.length}
              </span>
            )}
          </div>

          <div className="p-4">
            {compliance.isLoading ? (
              <div className="space-y-2 py-4">
                {[...Array(3)].map((_, i) => <S key={i} h="h-10" />)}
              </div>
            ) : compliance.alerts.length === 0 ? (
              <div className="py-8 text-center">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <CheckCircle size={26} weight="duotone" style={{ color: '#34D399' }} />
                </div>
                <p className="font-display font-600 text-sm mb-1" style={{ color: '#34D399', fontFamily: 'Space Grotesk' }}>All Clear</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}>All driver credentials are valid and current.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                {compliance.alerts.slice(0, 8).map(alert => {
                  const exp = alert.severity === 'expired';
                  return (
                    <Link key={`${alert.driverId}-${alert.type}`} to={`/drivers/${alert.driverId}`}
                      className="group flex items-center gap-3 p-2.5 rounded-lg transition-all"
                      style={{ background: exp ? 'rgba(248,113,113,0.05)' : 'rgba(251,191,36,0.05)', border: `1px solid ${exp ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)'}` }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = exp ? 'rgba(248,113,113,0.35)' : 'rgba(251,191,36,0.35)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = exp ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)')}>
                      <ShieldWarning size={14} weight="bold" style={{ color: exp ? '#F87171' : '#FBBF24', flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-600 truncate" style={{ color: 'var(--text-primary)', fontFamily: 'DM Sans' }}>{alert.driverName}</p>
                        <p className="text-micro" style={{ color: exp ? '#F87171' : '#FBBF24' }}>{alert.label} · {formatDaysLabel(alert.daysRemaining)}</p>
                      </div>
                      <CaretRight size={11} weight="bold" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  );
                })}
                {compliance.alerts.length > 8 && (
                  <Link to="/drivers" className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-500 transition-colors"
                    style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--apex-orange)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                    +{compliance.alerts.length - 8} more <ArrowSquareOut size={11} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          isDangerous={confirmState.isDangerous}
          onConfirm={confirmState.onConfirm}
          onClose={() => setConfirmState(null)}
        />
      )}
    </div>
  );
};

export default DashboardOverviewPage;
