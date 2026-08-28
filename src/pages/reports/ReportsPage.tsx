import React, { useState, useMemo } from 'react';
import { useTripsHistory } from '../../features/trips/hooks/useTrips';
import { useAllServiceLogs } from '../../hooks/useServiceLogs';
import { useVehiclesList } from '../../features/vehicles/hooks/useVehicles';
import { downloadCSV, downloadPDF } from '../../utils/exportUtils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar, Cell, LineChart, Line,
} from 'recharts';
import {
  FileText, DownloadSimple, TrendUp, GasPump, Wrench, Truck,
  MagnifyingGlass, CurrencyDollar, Pulse, WarningCircle, ChartBar,
} from '@phosphor-icons/react';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  'oil-change': 'Oil Change', 'tire-rotation': 'Tire Rotation',
  'brake-inspection': 'Brake Inspection', 'transmission-service': 'Transmission Service',
  'engine-tune-up': 'Engine Tune-Up', 'electrical-diagnostic': 'Electrical Diagnostic',
  'coolant-flush': 'Coolant Flush', 'air-filter-replacement': 'Air Filter Replacement',
  'battery-replacement': 'Battery Replacement', 'general-inspection': 'General Inspection',
  'other': 'Other',
};

const CHART_COLORS = ['#F97316', '#60A5FA', '#34D399', '#A78BFA', '#FBBF24', '#F87171', '#FB923C'];

const isFuelRefill = (description: string): boolean =>
  description?.toLowerCase().includes('fuel refill') ||
  description?.toLowerCase().includes('pumped') ||
  description?.toLowerCase().includes('refill');

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string; value: string | number; desc: string;
  Icon: React.ElementType; color: string;
}> = ({ label, value, desc, Icon, color }) => (
  <div className="surface-card p-5 flex items-center justify-between">
    <div>
      <p className="text-micro mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="font-700 text-xl" style={{ fontFamily: 'IBM Plex Mono', color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
    </div>
    <div className="h-11 w-11 rounded-xl flex items-center justify-center"
      style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
      <Icon size={20} weight="duotone" style={{ color }} />
    </div>
  </div>
);

// ─── Chart tooltip ────────────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--surface-2, #0F1625)',
    borderColor: 'var(--border-1, #1e293b)',
    borderRadius: '12px',
    fontSize: '11px',
    color: 'var(--text-primary)',
    fontFamily: 'DM Sans',
  },
  labelStyle: { color: 'var(--text-primary)', fontWeight: '600' },
};

// ─── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonCards = ({ count = 4 }: { count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: 'var(--surface-2)' }} />
    ))}
  </>
);

// ─── Spinner ─────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="h-7 w-7 rounded-full border-2 animate-spin"
      style={{ borderColor: 'rgba(249,115,22,0.3)', borderTopColor: '#F97316' }} />
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trips' | 'expenses' | 'vehicles'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [exportMessage, setExportMessage] = useState('');

  const { data: trips,       isLoading: isTripsLoading    } = useTripsHistory();
  const { data: serviceLogs, isLoading: isLogsLoading     } = useAllServiceLogs();
  const { data: vehicles,    isLoading: isVehiclesLoading  } = useVehiclesList();

  const isLoading = isTripsLoading || isLogsLoading || isVehiclesLoading;

  // ── Aggregates ───────────────────────────────────────────────────────────────
  const completedTrips = useMemo(() => (trips || []).filter(t => t.status === 'Completed'), [trips]);
  const maintenanceLogs = useMemo(() => (serviceLogs || []).filter(l => !isFuelRefill(l.description || '')), [serviceLogs]);
  const fuelRefillLogs  = useMemo(() => (serviceLogs || []).filter(l =>  isFuelRefill(l.description || '')), [serviceLogs]);

  const totalTrips       = completedTrips.length;
  const totalDistanceKm  = completedTrips.reduce((s, t) => s + (t.distance  || 0), 0);
  const totalFuelLiters  = completedTrips.reduce((s, t) => s + (t.fuelUsed  || 0), 0);
  const avgKmPerLiter    = totalFuelLiters > 0 ? totalDistanceKm / totalFuelLiters : 0;

  const totalMaintenanceCost = maintenanceLogs.reduce((s, l) => s + (l.cost || 0), 0);
  const totalFuelRefillCost  = fuelRefillLogs.reduce((s, l)  => s + (l.cost || 0), 0);
  const totalFleetCost       = totalMaintenanceCost + totalFuelRefillCost;
  const costPerKm            = totalDistanceKm > 0 ? totalFleetCost / totalDistanceKm : 0;

  // ── Chart data ───────────────────────────────────────────────────────────────
  const efficiencyChartData = completedTrips.slice(-10).map(t => ({
    ref:      `#${t.dispatch?.referenceNumber || 'N/A'}`,
    'km/L':   t.fuelUsed > 0 ? Number((t.distance / t.fuelUsed).toFixed(1)) : 0,
    distance: Math.round(t.distance || 0),
    fuel:     Math.round(t.fuelUsed || 0),
  }));

  const costByTypeData = useMemo(() => {
    const byType: Record<string, number> = {};
    maintenanceLogs.forEach(l => {
      const label = SERVICE_TYPE_LABELS[l.serviceType] || l.serviceType;
      byType[label] = (byType[label] || 0) + (l.cost || 0);
    });
    return Object.entries(byType).map(([name, cost]) => ({ name, cost: Math.round(cost) })).sort((a, b) => b.cost - a.cost);
  }, [maintenanceLogs]);

  const monthlyTrendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      const yr = d.getFullYear(); const mo = d.getMonth();
      const label = d.toLocaleDateString('en-KE', { month: 'short', year: '2-digit' });
      const inMonth = (dateStr: string) => { const x = new Date(dateStr); return x.getFullYear() === yr && x.getMonth() === mo; };
      const maint = maintenanceLogs.filter(l => inMonth(l.serviceDate)).reduce((s, l) => s + (l.cost || 0), 0);
      const fuel  = fuelRefillLogs.filter(l => inMonth(l.serviceDate)).reduce((s, l) => s + (l.cost || 0), 0);
      return { month: label, Maintenance: Math.round(maint), Fuel: Math.round(fuel) };
    });
  }, [maintenanceLogs, fuelRefillLogs]);

  const vehicleSummaries = useMemo(() => {
    const names = new Set([
      ...completedTrips.map(t => t.dispatch?.vehicleName).filter(Boolean) as string[],
      ...(serviceLogs || []).map(l => l.vehicleName).filter(Boolean),
    ]);
    return Array.from(names).map(vehicleName => {
      const vTrips = completedTrips.filter(t => t.dispatch?.vehicleName === vehicleName);
      const vLogs  = (serviceLogs || []).filter(l => l.vehicleName === vehicleName);
      const totalKm    = vTrips.reduce((s, t) => s + (t.distance || 0), 0);
      const totalFuelL = vTrips.reduce((s, t) => s + (t.fuelUsed  || 0), 0);
      const maintCost  = vLogs.filter(l => !isFuelRefill(l.description || '')).reduce((s, l) => s + (l.cost || 0), 0);
      const fuelCost   = vLogs.filter(l =>  isFuelRefill(l.description || '')).reduce((s, l) => s + (l.cost || 0), 0);
      const totalCost  = maintCost + fuelCost;
      const vehicleRecord = (vehicles || []).find(v => v.name === vehicleName);
      return {
        vehicleName, plateNumber: vehicleRecord?.plateNumber || '—',
        totalTrips: vTrips.length, totalKm: Math.round(totalKm),
        totalFuelL: Math.round(totalFuelL * 10) / 10,
        maintCostKsh: Math.round(maintCost), fuelCostKsh: Math.round(fuelCost),
        totalCostKsh: Math.round(totalCost),
        costPerKm: totalKm > 0 ? Math.round((totalCost / totalKm) * 10) / 10 : 0,
        effKmL: totalFuelL > 0 ? Math.round((totalKm / totalFuelL) * 10) / 10 : 0,
      };
    }).sort((a, b) => b.totalCostKsh - a.totalCostKsh);
  }, [completedTrips, serviceLogs, vehicles]);

  // ── Filter views ─────────────────────────────────────────────────────────────
  const filteredTrips = completedTrips.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || t.dispatch?.referenceNumber?.toLowerCase().includes(q) ||
      t.dispatch?.vehicleName?.toLowerCase().includes(q) || t.dispatch?.driverName?.toLowerCase().includes(q) ||
      t.dispatch?.destination?.toLowerCase().includes(q);
    const matchDate = !dateFilter || t.endTime?.startsWith(dateFilter);
    return matchSearch && matchDate;
  });

  const filteredExpenses = (serviceLogs || []).filter(log => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || log.vehicleName.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q) || log.description.toLowerCase().includes(q);
    const matchDate = !dateFilter || log.serviceDate.startsWith(dateFilter);
    return matchSearch && matchDate;
  });

  // ── Export functions (unchanged logic) ──────────────────────────────────────
  const exportTripsCSV = () => {
    if (!completedTrips.length) return;
    downloadCSV('FleetOS_Trip_Report',
      ['Dispatch Ref', 'Vehicle', 'Driver', 'Origin', 'Destination', 'Distance (km)', 'Fuel Used (L)', 'Efficiency (km/L)', 'Duration (min)', 'Date Completed'],
      completedTrips.map(t => [
        t.dispatch?.referenceNumber || '', t.dispatch?.vehicleName || '', t.dispatch?.driverName || '',
        t.dispatch?.origin || '', t.dispatch?.destination || '', t.distance, t.fuelUsed,
        t.fuelUsed > 0 ? Number((t.distance / t.fuelUsed).toFixed(1)) : 0, t.duration,
        t.endTime ? new Date(t.endTime).toLocaleDateString('en-KE') : '',
      ]));
  };

  const exportTripsPDF = () => {
    if (!completedTrips.length) return;
    downloadPDF('Fleet Trip & Fuel Report', 'Completed dispatch trips with fuel consumption and efficiency metrics.',
      ['Ref', 'Vehicle', 'Driver', 'Route', 'Distance', 'Fuel Used', 'km/L', 'Date'],
      completedTrips.map(t => [
        `#${t.dispatch?.referenceNumber || 'N/A'}`, t.dispatch?.vehicleName || '—', t.dispatch?.driverName || '—',
        `${t.dispatch?.origin || ''} → ${t.dispatch?.destination || ''}`, `${t.distance} km`, `${t.fuelUsed} L`,
        t.fuelUsed > 0 ? `${(t.distance / t.fuelUsed).toFixed(1)} km/L` : '—',
        t.endTime ? new Date(t.endTime).toLocaleDateString('en-KE') : '—',
      ]),
      [
        { label: 'Total Trips',    value: totalTrips },
        { label: 'Total Distance', value: `${Math.round(totalDistanceKm).toLocaleString()} km` },
        { label: 'Total Fuel',     value: `${Math.round(totalFuelLiters).toLocaleString()} L` },
        { label: 'Avg Efficiency', value: `${avgKmPerLiter.toFixed(1)} km/L` },
      ]);
  };

  const exportMaintenanceCSV = () => {
    if (!maintenanceLogs.length) return;
    downloadCSV('FleetOS_Maintenance_Expenses',
      ['Vehicle', 'Service Type', 'Description', 'Odometer (km)', 'Performed By', 'Date', 'Cost (KSh)'],
      maintenanceLogs.map(l => [
        l.vehicleName, SERVICE_TYPE_LABELS[l.serviceType] || l.serviceType, l.description || '',
        l.odometerAtService, l.performedBy || '', new Date(l.serviceDate).toLocaleDateString('en-KE'), l.cost,
      ]));
  };

  const exportMaintenancePDF = () => {
    if (!maintenanceLogs.length) return;
    downloadPDF('Maintenance Expenditure Ledger', 'Fleet vehicle service and repair cost records.',
      ['Vehicle', 'Service Type', 'Odometer (km)', 'Cost (KSh)', 'Performed By', 'Date'],
      maintenanceLogs.map(l => [
        l.vehicleName, SERVICE_TYPE_LABELS[l.serviceType] || l.serviceType,
        `${l.odometerAtService.toLocaleString()} km`, `KSh ${l.cost.toLocaleString()}`,
        l.performedBy || '—', new Date(l.serviceDate).toLocaleDateString('en-KE'),
      ]),
      [{ label: 'Total Records', value: maintenanceLogs.length }, { label: 'Total Maint. Cost', value: `KSh ${Math.round(totalMaintenanceCost).toLocaleString()}` }]);
  };

  const exportFuelCSV = () => {
    if (!fuelRefillLogs.length) {
      setExportMessage('No fuel refill logs found. Drivers log fuel from the Driver Portal.');
      setTimeout(() => setExportMessage(''), 4000);
      return;
    }
    downloadCSV('FleetOS_Fuel_Refills',
      ['Vehicle', 'Odometer (km)', 'Description', 'Cost (KSh)', 'Date'],
      fuelRefillLogs.map(l => [l.vehicleName, l.odometerAtService, l.description || '', l.cost, new Date(l.serviceDate).toLocaleDateString('en-KE')]));
  };

  const exportVehicleSummaryCSV = () => {
    if (!vehicleSummaries.length) return;
    downloadCSV('FleetOS_Vehicle_Cost_Summary',
      ['Vehicle', 'Plate', 'Trips', 'Total km', 'Fuel (L)', 'Efficiency (km/L)', 'Maint. Cost (KSh)', 'Fuel Cost (KSh)', 'Total Cost (KSh)', 'Cost per km (KSh)'],
      vehicleSummaries.map(v => [v.vehicleName, v.plateNumber, v.totalTrips, v.totalKm, v.totalFuelL, v.effKmL, v.maintCostKsh, v.fuelCostKsh, v.totalCostKsh, v.costPerKm]));
  };

  const exportVehicleSummaryPDF = () => {
    if (!vehicleSummaries.length) return;
    downloadPDF('Per-Vehicle Cost Analysis', 'Operational and financial breakdown by fleet vehicle, sorted by total expenditure.',
      ['Vehicle', 'Plate', 'Trips', 'km', 'Fuel L', 'km/L', 'Maint (KSh)', 'Fuel (KSh)', 'Total (KSh)', 'KSh/km'],
      vehicleSummaries.map(v => [
        v.vehicleName, v.plateNumber, v.totalTrips, `${v.totalKm.toLocaleString()} km`, `${v.totalFuelL} L`,
        `${v.effKmL} km/L`, `KSh ${v.maintCostKsh.toLocaleString()}`, `KSh ${v.fuelCostKsh.toLocaleString()}`,
        `KSh ${v.totalCostKsh.toLocaleString()}`, `KSh ${v.costPerKm}`,
      ]),
      [
        { label: 'Total Fleet Cost', value: `KSh ${Math.round(totalFleetCost).toLocaleString()}` },
        { label: 'Avg Cost per km',  value: `KSh ${costPerKm.toFixed(1)}` },
        { label: 'Vehicles Tracked', value: vehicleSummaries.length },
      ]);
  };

  // ── Filter bar (shared) ───────────────────────────────────────────────────────
  const FilterBar = () => (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative">
        <MagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
        <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="rounded-lg py-1.5 pl-8 pr-3 text-[12px] outline-none transition-all w-full sm:w-48"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)', color: 'var(--text-primary)', fontFamily: 'DM Sans' }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-0)')} />
      </div>
      <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
        className="rounded-lg py-1.5 px-3 text-[12px] outline-none transition-all"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)', color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-0)')} />
    </div>
  );

  // ── Table head row reusable ───────────────────────────────────────────────────
  const THead = ({ cols }: { cols: string[] }) => (
    <thead>
      <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-0)' }}>
        {cols.map(c => (
          <th key={c} className="px-4 py-3 text-left text-micro font-600" style={{ color: 'var(--text-secondary)' }}>{c}</th>
        ))}
      </tr>
    </thead>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'DM Sans', color: 'var(--text-primary)' }}>

      {/* ── Header ── */}
      <div className="mb-6 anim-in">
        <div className="badge-live mb-3"><TrendUp size={9} weight="bold" /> Reporting Command Center</div>
        <h1 className="font-display font-700 text-[1.75rem] leading-tight mb-1"
          style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
          Cost &amp; Fuel Reports
        </h1>
        <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
          Fleet-wide mileage · fuel efficiency · maintenance expenditures in KSh
        </p>
      </div>

      {/* ── Operational KPIs ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-4">
        {isLoading ? <SkeletonCards /> : (
          <>
            <StatCard label="Completed Trips"  value={totalTrips}                                          desc="Dispatches closed"      Icon={Truck}   color="#F97316" />
            <StatCard label="Total Distance"   value={`${Math.round(totalDistanceKm).toLocaleString()} km`} desc="Across all routes"      Icon={Pulse}   color="#60A5FA" />
            <StatCard label="Fuel Consumed"    value={`${Math.round(totalFuelLiters).toLocaleString()} L`}  desc="Trip consumption"       Icon={GasPump} color="#FBBF24" />
            <StatCard label="Avg Efficiency"   value={`${avgKmPerLiter.toFixed(1)} km/L`}                  desc="Fleet-wide average"     Icon={TrendUp} color="#34D399" />
          </>
        )}
      </div>

      {/* ── Financial KPIs ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
        {isLoading ? <SkeletonCards /> : (
          <>
            <StatCard label="Maintenance Cost"  value={`KSh ${Math.round(totalMaintenanceCost).toLocaleString()}`}  desc="Service & repairs"      Icon={Wrench}         color="#F87171" />
            <StatCard label="Fuel Refill Cost"  value={`KSh ${Math.round(totalFuelRefillCost).toLocaleString()}`}   desc="Logged driver refuels"  Icon={GasPump}        color="#FBBF24" />
            <StatCard label="Total Fleet Cost"  value={`KSh ${Math.round(totalFleetCost).toLocaleString()}`}        desc="Maintenance + fuel"     Icon={CurrencyDollar} color="#A78BFA" />
            <StatCard label="Cost per km"       value={`KSh ${costPerKm.toFixed(1)}`}                              desc={totalDistanceKm > 0 ? `Over ${Math.round(totalDistanceKm).toLocaleString()} km` : 'No trips yet'} Icon={ChartBar} color="#60A5FA" />
          </>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-6 overflow-x-auto mb-6" style={{ borderBottom: '1px solid var(--border-0)' }}>
        {[
          { id: 'overview',  label: 'Performance Summary' },
          { id: 'trips',     label: 'Dispatches Ledger'   },
          { id: 'expenses',  label: 'Service Expenses'    },
          { id: 'vehicles',  label: 'Per Vehicle'         },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className="pb-3 text-[12px] font-600 uppercase tracking-wider transition-all relative whitespace-nowrap flex-shrink-0"
            style={{ color: activeTab === tab.id ? '#F97316' : 'var(--text-secondary)' }}
            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#F97316' }} />
            )}
          </button>
        ))}
      </div>

      {/* ══ TAB: OVERVIEW ══════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Chart 1: Fuel efficiency */}
            <div className="surface-card overflow-hidden">
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <GasPump size={14} weight="duotone" style={{ color: '#FBBF24' }} />
                  <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                    Fuel Efficiency per Trip (km/L)
                  </span>
                </div>
                <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>Higher is better — km driven per liter consumed</p>
              </div>
              <div className="p-4">
                {isLoading ? <Spinner /> : efficiencyChartData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-2">
                    <WarningCircle size={32} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>No completed trips yet.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={efficiencyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradKmL" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#F97316" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-0)" opacity={0.6} />
                      <XAxis dataKey="ref"  stroke="var(--text-tertiary)" fontSize={9}  tickLine={false} />
                      <YAxis             stroke="var(--text-tertiary)" fontSize={10} tickLine={false} unit=" km/L" />
                      <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v} km/L`, 'Efficiency']} />
                      <Area type="monotone" dataKey="km/L" stroke="#F97316" strokeWidth={2}
                        fillOpacity={1} fill="url(#gradKmL)" dot={{ fill: '#F97316', r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Monthly cost trend */}
            <div className="surface-card overflow-hidden">
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <CurrencyDollar size={14} weight="duotone" style={{ color: '#A78BFA' }} />
                  <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                    Monthly Cost Trend (KSh)
                  </span>
                </div>
                <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>Maintenance vs fuel refill costs — past 6 months</p>
              </div>
              <div className="p-4">
                {isLoading ? <Spinner /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-0)" opacity={0.6} />
                      <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--text-tertiary)" fontSize={9} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip {...tooltipStyle} formatter={(v: any) => [`KSh ${Number(v).toLocaleString()}`, '']} />
                      <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
                      <Line type="monotone" dataKey="Maintenance" stroke="#F97316" strokeWidth={2} dot={{ r: 3, fill: '#F97316' }} />
                      <Line type="monotone" dataKey="Fuel"        stroke="#60A5FA" strokeWidth={2} dot={{ r: 3, fill: '#60A5FA' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 3: Cost by service type — full width */}
            <div className="surface-card overflow-hidden lg:col-span-2">
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <Wrench size={14} weight="duotone" style={{ color: '#F87171' }} />
                  <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                    Maintenance Cost by Service Type (KSh)
                  </span>
                </div>
                <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>Where maintenance budget is being spent</p>
              </div>
              <div className="p-4">
                {isLoading ? <Spinner /> : costByTypeData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-2">
                    <WarningCircle size={32} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>No maintenance expenses recorded yet.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={costByTypeData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-0)" opacity={0.6} />
                      <XAxis dataKey="name"  stroke="var(--text-tertiary)" fontSize={9}  tickLine={false} />
                      <YAxis             stroke="var(--text-tertiary)" fontSize={10} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip {...tooltipStyle} formatter={(v: any) => [`KSh ${Number(v).toLocaleString()}`, 'Cost']} />
                      <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                        {costByTypeData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Export cards */}
          <div className="surface-card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <div className="flex items-center gap-2 mb-0.5">
                <DownloadSimple size={14} weight="duotone" style={{ color: '#F97316' }} />
                <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                  Export Reports
                </span>
              </div>
              <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>Download fleet data as CSV or formatted PDF</p>
            </div>
            {exportMessage && (
              <div className="mx-5 mt-4 rounded-lg px-3.5 py-2.5 flex items-center gap-2 text-[11px] font-600"
                style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.25)', color: '#F97316' }}>
                <WarningCircle size={14} weight="duotone" style={{ flexShrink: 0 }} />
                {exportMessage}
              </div>
            )}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  title: 'Trip & Fuel Report', color: '#F97316',
                  desc: 'Distance, fuel consumption, km/L efficiency, and driver details per completed trip.',
                  onCSV: exportTripsCSV, onPDF: exportTripsPDF,
                },
                {
                  title: 'Maintenance Expenses', color: '#A78BFA',
                  desc: 'Service logs, repair costs in KSh, odometer readings, and service provider details.',
                  onCSV: exportMaintenanceCSV, onPDF: exportMaintenancePDF,
                },
                {
                  title: 'Fuel Refill Ledger', color: '#FBBF24',
                  desc: 'Driver-logged fuel refills with litres, KSh cost, and odometer at refuel.',
                  onCSV: exportFuelCSV, onPDF: null,
                },
              ].map(card => (
                <div key={card.title} className="p-4 rounded-xl flex flex-col justify-between gap-3 transition-all"
                  style={{ background: 'var(--surface-2)', border: `1px solid ${card.color}15` }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = `${card.color}30`)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = `${card.color}15`)}>
                  <div>
                    <span className="font-display font-600 text-[12px] uppercase tracking-wider block" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                      {card.title}
                    </span>
                    <span className="text-[10px] block mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{card.desc}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={card.onCSV}
                      className="flex-1 py-2 rounded-lg text-[11px] font-600 flex items-center justify-center gap-1.5 transition-all"
                      style={{ background: `${card.color}10`, border: `1px solid ${card.color}25`, color: card.color }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${card.color}18`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${card.color}10`; }}>
                      <DownloadSimple size={12} weight="bold" /> CSV
                    </button>
                    {card.onPDF && (
                      <button onClick={card.onPDF}
                        className="flex-1 py-2 rounded-lg text-[11px] font-600 flex items-center justify-center gap-1.5 transition-all"
                        style={{ background: `${card.color}06`, border: `1px solid ${card.color}15`, color: card.color }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${card.color}12`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${card.color}06`; }}>
                        <FileText size={12} weight="bold" /> PDF
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: DISPATCHES LEDGER ════════════════════════════════════════════ */}
      {activeTab === 'trips' && (
        <div className="surface-card overflow-hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border-0)' }}>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <FileText size={14} weight="duotone" style={{ color: '#F97316' }} />
                <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                  Completed Dispatches Log
                </span>
              </div>
              <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
                {filteredTrips.length} of {completedTrips.length} trips
              </p>
            </div>
            <div className="flex items-center gap-2">
              <FilterBar />
              <button onClick={exportTripsCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-600 transition-all whitespace-nowrap"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#F97316' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.14)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.08)')}>
                <DownloadSimple size={13} weight="bold" /> Export
              </button>
            </div>
          </div>
          {isTripsLoading ? <Spinner /> : filteredTrips.length === 0 ? (
            <div className="py-12 text-center">
              <FileText size={32} weight="duotone" className="mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm font-600" style={{ color: 'var(--text-secondary)' }}>No dispatches found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <THead cols={['Ref', 'Vehicle', 'Driver', 'Route', 'Distance', 'Fuel Used', 'Efficiency']} />
                <tbody>
                  {filteredTrips.map((t, i) => {
                    const kmL = t.fuelUsed > 0 ? (t.distance / t.fuelUsed).toFixed(1) : '—';
                    return (
                      <tr key={t.id} className="transition-colors"
                        style={{ borderTop: i > 0 ? '1px solid var(--border-0)' : undefined }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td className="px-4 py-3 font-700" style={{ color: '#F97316', fontFamily: 'IBM Plex Mono' }}>
                          #{t.dispatch?.referenceNumber || 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-600" style={{ color: 'var(--text-primary)' }}>{t.dispatch?.vehicleName || '—'}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{t.dispatch?.driverName || '—'}</td>
                        <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                          {t.dispatch?.origin} → {t.dispatch?.destination}
                        </td>
                        <td className="px-4 py-3 font-mono font-500" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
                          {t.distance?.toLocaleString()} km
                        </td>
                        <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }}>
                          {t.fuelUsed} L
                        </td>
                        <td className="px-4 py-3 font-mono font-700" style={{ color: '#34D399', fontFamily: 'IBM Plex Mono' }}>
                          {kmL} km/L
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: SERVICE EXPENSES ═════════════════════════════════════════════ */}
      {activeTab === 'expenses' && (
        <div className="surface-card overflow-hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border-0)' }}>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <CurrencyDollar size={14} weight="duotone" style={{ color: '#A78BFA' }} />
                <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                  Service Expenditure Ledger
                </span>
              </div>
              <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
                {filteredExpenses.length} records · Total: KSh {Math.round(totalMaintenanceCost + totalFuelRefillCost).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <FilterBar />
              <button onClick={exportMaintenanceCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-600 transition-all whitespace-nowrap"
                style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#A78BFA' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.14)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.08)')}>
                <DownloadSimple size={13} weight="bold" /> Export
              </button>
            </div>
          </div>
          {isLogsLoading ? <Spinner /> : filteredExpenses.length === 0 ? (
            <div className="py-12 text-center">
              <CurrencyDollar size={32} weight="duotone" className="mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm font-600" style={{ color: 'var(--text-secondary)' }}>No expenses found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <THead cols={['Vehicle', 'Type', 'Description', 'Odometer', 'Performed By', 'Date', 'Cost (KSh)']} />
                <tbody>
                  {filteredExpenses.map((log, i) => (
                    <tr key={log.id} className="transition-colors"
                      style={{ borderTop: i > 0 ? '1px solid var(--border-0)' : undefined }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <td className="px-4 py-3 font-600" style={{ color: 'var(--text-primary)' }}>{log.vehicleName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-600 uppercase tracking-wide"
                          style={{
                            background: isFuelRefill(log.description || '') ? 'rgba(251,191,36,0.1)' : 'var(--surface-3)',
                            color: isFuelRefill(log.description || '') ? '#FBBF24' : 'var(--text-secondary)',
                            border: `1px solid ${isFuelRefill(log.description || '') ? 'rgba(251,191,36,0.2)' : 'var(--border-1)'}`,
                          }}>
                          {isFuelRefill(log.description || '') ? 'Fuel Refill' : (SERVICE_TYPE_LABELS[log.serviceType] || log.serviceType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>{log.description || '—'}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }}>
                        {log.odometerAtService.toLocaleString()} km
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                        {log.performedBy || <span className="italic" style={{ color: 'var(--text-tertiary)' }}>—</span>}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(log.serviceDate).toLocaleDateString('en-KE')}
                      </td>
                      <td className="px-4 py-3 font-mono font-700" style={{ color: '#34D399', fontFamily: 'IBM Plex Mono' }}>
                        {log.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: PER VEHICLE ══════════════════════════════════════════════════ */}
      {activeTab === 'vehicles' && (
        <div className="surface-card overflow-hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border-0)' }}>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Truck size={14} weight="duotone" style={{ color: '#F97316' }} />
                <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                  Per-Vehicle Cost Analysis
                </span>
              </div>
              <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
                Sorted by total expenditure — identifies most expensive vehicles to operate
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportVehicleSummaryCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-600 transition-all"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#F97316' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.14)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.08)')}>
                <DownloadSimple size={13} weight="bold" /> CSV
              </button>
              <button onClick={exportVehicleSummaryPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-600 transition-all"
                style={{ background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.12)', color: '#F97316' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.10)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.04)')}>
                <FileText size={13} weight="bold" /> PDF
              </button>
            </div>
          </div>
          {isLoading ? <Spinner /> : vehicleSummaries.length === 0 ? (
            <div className="py-12 text-center">
              <Truck size={32} weight="duotone" className="mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm font-600" style={{ color: 'var(--text-secondary)' }}>No vehicle data yet</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Complete some trips or log maintenance to see per-vehicle costs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <THead cols={['Vehicle', 'Trips', 'Distance', 'Fuel Used', 'Efficiency', 'Maint. (KSh)', 'Fuel (KSh)', 'Total (KSh)', 'KSh/km']} />
                <tbody>
                  {vehicleSummaries.map((v, i) => {
                    const isHighCost = i === 0 && vehicleSummaries.length > 1;
                    return (
                      <tr key={v.vehicleName} className="transition-colors"
                        style={{ borderTop: i > 0 ? '1px solid var(--border-0)' : undefined }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td className="px-4 py-3">
                          <div className="font-600 text-[12px]" style={{ color: 'var(--text-primary)' }}>{v.vehicleName}</div>
                          <div className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)', fontFamily: 'IBM Plex Mono' }}>{v.plateNumber}</div>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{v.totalTrips}</td>
                        <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
                          {v.totalKm.toLocaleString()} km
                        </td>
                        <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }}>{v.totalFuelL} L</td>
                        <td className="px-4 py-3 font-mono font-700" style={{ color: '#34D399', fontFamily: 'IBM Plex Mono' }}>
                          {v.effKmL > 0 ? `${v.effKmL} km/L` : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }}>
                          {v.maintCostKsh.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }}>
                          {v.fuelCostKsh.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono font-700" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
                          {v.totalCostKsh.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-700" style={{ color: isHighCost ? '#F87171' : 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }}>
                            {v.costPerKm > 0 ? v.costPerKm : '—'}
                          </span>
                          {isHighCost && (
                            <div className="text-[9px] font-700 uppercase tracking-wide mt-0.5" style={{ color: '#F87171' }}>Highest</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {vehicleSummaries.length > 1 && (
                  <tfoot>
                    <tr className="font-700" style={{ borderTop: '2px solid var(--border-1)', background: 'var(--surface-2)' }}>
                      <td className="px-4 py-3 text-micro uppercase tracking-wider font-600" style={{ color: 'var(--text-secondary)' }}>Fleet Total</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{totalTrips}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>{Math.round(totalDistanceKm).toLocaleString()} km</td>
                      <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }}>{Math.round(totalFuelLiters)} L</td>
                      <td className="px-4 py-3 font-mono" style={{ color: '#34D399', fontFamily: 'IBM Plex Mono' }}>{avgKmPerLiter.toFixed(1)} km/L</td>
                      <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }}>{Math.round(totalMaintenanceCost).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }}>{Math.round(totalFuelRefillCost).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: '#F97316', fontFamily: 'IBM Plex Mono' }}>{Math.round(totalFleetCost).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: '#F97316', fontFamily: 'IBM Plex Mono' }}>{costPerKm.toFixed(1)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
