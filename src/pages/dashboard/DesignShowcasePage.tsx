import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass, Truck, Users, Pulse, Trophy, Lightning,
  Moon, Sun, ArrowRight, TrendUp, GasPump, ShieldCheck,
  Star, StackSimple,
} from '@phosphor-icons/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useThemeStore } from '../../store/useThemeStore';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { statusRegistry, StatusDomain } from '../../config/statusRegistry';

export const DesignShowcasePage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const [radarSweep, setRadarSweep] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'vehicles' | 'analytics' | 'drivers'>('dashboard');

  useEffect(() => {
    const id = setInterval(() => setRadarSweep(p => !p), 4000);
    return () => clearInterval(id);
  }, []);

  const sampleAnalytics = [
    { name: '00:00', fuel: 92, speed: 62, cost: 120 },
    { name: '04:00', fuel: 94, speed: 58, cost: 110 },
    { name: '08:00', fuel: 88, speed: 70, cost: 195 },
    { name: '12:00', fuel: 91, speed: 65, cost: 240 },
    { name: '16:00', fuel: 89, speed: 67, cost: 210 },
    { name: '20:00', fuel: 95, speed: 60, cost: 130 },
  ];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', Icon: Pulse },
    { id: 'map', label: 'Live Map', Icon: Compass },
    { id: 'vehicles', label: 'Fleet Assets', Icon: Truck },
    { id: 'analytics', label: 'Analytics', Icon: TrendUp },
    { id: 'drivers', label: 'Operators', Icon: Users },
  ] as const;

  const sidebarItems = [
    { name: 'Core Cockpit', Icon: Pulse, tab: 'dashboard' },
    { name: 'Realtime Radar', Icon: Compass, tab: 'map' },
    { name: 'Fleet Vehicles', Icon: Truck, tab: 'vehicles' },
    { name: 'Analytics Hub', Icon: TrendUp, tab: 'analytics' },
    { name: 'Operators', Icon: Users, tab: 'drivers' },
  ] as const;

  return (
    <div style={{ color: 'var(--text-primary)', fontFamily: 'DM Sans' }}>

      {/* Floating controls */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-full px-4 py-2 shadow-2xl"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', backdropFilter: 'blur(12px)' }}>
        <span className="text-micro font-700 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          Interface:
        </span>
        <button onClick={toggleTheme}
          className="p-2 rounded-full transition-colors"
          style={{ background: 'var(--surface-1)', color: 'var(--accent-text)', border: 'none', cursor: 'pointer' }}
          title="Toggle Dark/Light">
          {isDark ? <Moon size={16} weight="duotone" /> : <Sun size={16} weight="duotone" />}
        </button>
        <div style={{ width: 1, height: 16, background: 'var(--border-1)' }} />
        <button onClick={() => navigate('/dashboard')}
          className="h-7 px-3 rounded-full flex items-center gap-1 text-[10px] font-700 uppercase transition-colors"
          style={{ background: '#F97316', color: '#04060F', border: 'none', cursor: 'pointer' }}>
          Enter App <ArrowRight size={11} weight="bold" />
        </button>
      </div>

      {/* Hero */}
      <header className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-700 uppercase tracking-widest mb-6"
          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#F97316' }}>
          <Lightning size={13} weight="fill" /> Advanced Fleet Intelligence 2026–2027
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-700 tracking-tight leading-tight max-w-5xl mx-auto mb-6"
          style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
          Autonomous Logistics &<br />
          <span style={{ color: '#F97316' }}>Telemetry Orchestration</span>
        </h1>

        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-400"
          style={{ color: 'var(--text-secondary)' }}>
          High-performance analytics, real-time asset tracking, and responsive dispatch management.
          Built for modern fleet coordinators across East Africa.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button onClick={() => navigate('/dashboard')}
            className="h-11 px-6 rounded-xl font-700 flex items-center gap-2 transition-all"
            style={{ background: '#F97316', color: '#04060F', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(249,115,22,0.3)', fontFamily: 'Space Grotesk' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 32px rgba(249,115,22,0.45)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(249,115,22,0.3)')}>
            Launch Fleet Cockpit
          </button>
          <a href="#simulator"
            className="h-11 px-6 inline-flex items-center gap-2 rounded-xl font-700 transition-colors"
            style={{ border: '1px solid var(--border-1)', color: 'var(--text-secondary)', textDecoration: 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            Explore Design System
          </a>
        </div>
      </header>

      {/* Simulator */}
      <section id="simulator" className="relative max-w-7xl mx-auto px-6 pb-32">
        <div className="mb-8">
          <h2 className="text-2xl font-700 tracking-tight mb-1" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
            System Interface Simulator
          </h2>
          <p className="text-micro font-700 uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
            Click the tabs to explore live design frames
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 pb-3 mb-6" style={{ borderBottom: '1px solid var(--border-0)' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-700 uppercase tracking-wider rounded-lg border transition-all"
              style={{
                background: activeTab === tab.id ? 'rgba(249,115,22,0.1)' : 'transparent',
                border: activeTab === tab.id ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent',
                color: activeTab === tab.id ? '#F97316' : 'var(--text-tertiary)',
                cursor: 'pointer',
              }}>
              <tab.Icon size={14} weight={activeTab === tab.id ? 'duotone' : 'regular'} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Simulator Frame */}
        <div className="surface-card min-h-[500px] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Mock Sidebar */}
            <div className="lg:col-span-1 hidden lg:block pr-4" style={{ borderRight: '1px solid var(--border-0)' }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="h-7 w-7 rounded flex items-center justify-center"
                  style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}>
                  <Pulse size={14} weight="duotone" style={{ color: '#F97316' }} />
                </div>
                <span className="font-700 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>FleetOS</span>
              </div>
              <div className="space-y-1">
                {sidebarItems.map(item => (
                  <div key={item.name}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-600 rounded-lg transition-colors cursor-pointer"
                    style={{
                      background: activeTab === item.tab ? 'rgba(249,115,22,0.08)' : 'transparent',
                      border: activeTab === item.tab ? '1px solid rgba(249,115,22,0.15)' : '1px solid transparent',
                      color: activeTab === item.tab ? '#F97316' : 'var(--text-tertiary)',
                    }}
                    onClick={() => setActiveTab(item.tab as any)}>
                    <item.Icon size={15} weight={activeTab === item.tab ? 'duotone' : 'regular'} />
                    {item.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-4 space-y-5">

              {/* Tab 1: Dashboard */}
              {activeTab === 'dashboard' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-700 text-lg" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                      System Performance Console
                    </h3>
                    <p className="text-micro font-700 uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      Real-time status and core metrics
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Active Missions', value: '18 / 25', desc: 'Vehicles dispatched', Icon: Compass, accent: '#F97316' },
                      { label: 'Fuel Efficiency', value: '94.2%', desc: 'Optimal rating', Icon: GasPump, accent: '#34D399' },
                      { label: 'Critical Alerts', value: '2 Urgent', desc: 'Needs attention', Icon: ShieldCheck, accent: '#F87171' },
                    ].map(stat => (
                      <div key={stat.label} className="p-4 rounded-xl flex items-center justify-between"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                        <div>
                          <span className="text-micro font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</span>
                          <span className="text-xl font-700 mt-1 block" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>{stat.value}</span>
                          <span className="text-[9px] block mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{stat.desc}</span>
                        </div>
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center"
                          style={{ background: `${stat.accent}12`, border: `1px solid ${stat.accent}25` }}>
                          <stat.Icon size={17} weight="duotone" style={{ color: stat.accent }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Incident stream */}
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-0)' }}>
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-0)' }}>
                        <p className="text-micro font-700 uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                          Live Incident Stream
                        </p>
                      </div>
                      <div>
                        <div className="p-3 flex items-center justify-between" style={{ background: 'rgba(248,113,113,0.04)', borderBottom: '1px solid var(--border-0)' }}>
                          <div className="flex items-center gap-2.5">
                            <span className="h-2 w-2 rounded-full animate-ping" style={{ background: '#F87171' }} />
                            <div>
                              <span className="text-xs font-600 block" style={{ color: 'var(--text-primary)' }}>Engine Coolant Over-temp</span>
                              <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Cascadia CAS-03 · KBY-739-F</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-700 px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)' }}>
                            CRITICAL
                          </span>
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: '#FBBF24' }} />
                            <div>
                              <span className="text-xs font-600 block" style={{ color: 'var(--text-primary)' }}>Low Fuel Warning (&lt;10%)</span>
                              <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Delivery Volvo VOL-12</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-700 px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(251,191,36,0.1)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.25)' }}>
                            WARNING
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Compliance */}
                    <div className="rounded-xl p-4 space-y-4" style={{ border: '1px solid var(--border-0)' }}>
                      <p className="text-micro font-700 uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Compliance Checks</p>
                      <div className="space-y-3">
                        {[
                          { label: 'ELD Driver Logs (HOS)', desc: '98.9% compliant in HOS audit.' },
                          { label: 'DVIR Safety Inspections', desc: 'All dispatched vehicles cleared.' },
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-3 text-xs">
                            <Trophy size={15} weight="duotone" style={{ color: '#34D399', flexShrink: 0 }} />
                            <div>
                              <span className="font-600 block" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                              <p className="text-[9px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Map */}
              {activeTab === 'map' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-700 text-lg" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                      Active Telemetry Tracker
                    </h3>
                    <p className="text-micro font-700 uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      Real-time GPS coordinate simulation
                    </p>
                  </div>

                  <div className="relative w-full h-80 rounded-xl overflow-hidden"
                    style={{ background: 'var(--surface-0)', border: '1px solid var(--border-0)' }}>
                    {/* Radar */}
                    <div className={`absolute inset-0 transition-opacity duration-1000 ${radarSweep ? 'opacity-100' : 'opacity-40'}`}
                      style={{ background: 'rgba(249,115,22,0.03)' }}>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full animate-ping"
                        style={{ border: '1px solid rgba(249,115,22,0.15)' }} />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full animate-pulse"
                        style={{ border: '1px solid rgba(249,115,22,0.08)' }} />
                    </div>

                    {/* Marker 1 */}
                    <div className="absolute top-20 left-1/3 text-center">
                      <div className="relative mx-auto w-5 h-5">
                        <span className="absolute -inset-1.5 rounded-full animate-ping" style={{ background: 'rgba(249,115,22,0.3)' }} />
                        <div className="h-5 w-5 rounded-full border border-white flex items-center justify-center"
                          style={{ background: '#F97316' }}>
                          <Truck size={10} weight="fill" style={{ color: '#fff' }} />
                        </div>
                      </div>
                      <span className="mt-1 text-[8px] font-700 px-1 py-0.5 rounded"
                        style={{ background: 'rgba(4,6,15,0.9)', color: '#F97316', border: '1px solid var(--border-1)', fontFamily: 'IBM Plex Mono' }}>
                        KCA-739-F
                      </span>
                    </div>

                    {/* Marker 2 */}
                    <div className="absolute top-44 right-1/4 text-center">
                      <div className="relative mx-auto w-5 h-5">
                        <span className="absolute -inset-1.5 rounded-full animate-ping" style={{ background: 'rgba(52,211,153,0.3)' }} />
                        <div className="h-5 w-5 rounded-full border border-white flex items-center justify-center"
                          style={{ background: '#34D399' }}>
                          <Truck size={10} weight="fill" style={{ color: '#fff' }} />
                        </div>
                      </div>
                      <span className="mt-1 text-[8px] font-700 px-1 py-0.5 rounded"
                        style={{ background: 'rgba(4,6,15,0.9)', color: '#34D399', border: '1px solid var(--border-1)', fontFamily: 'IBM Plex Mono' }}>
                        KBZ-012-V
                      </span>
                    </div>

                    {/* Bottom overlay */}
                    <div className="absolute bottom-4 left-4 right-4 p-3 rounded-lg flex items-center justify-between text-xs"
                      style={{ background: 'rgba(4,6,15,0.9)', border: '1px solid var(--border-1)', backdropFilter: 'blur(8px)' }}>
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ background: '#34D399' }} />
                        <div>
                          <span className="font-600 block" style={{ color: 'var(--text-primary)' }}>Live GPS Stream Active</span>
                          <p className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Nairobi Metropolitan coverage</p>
                        </div>
                      </div>
                      <span className="font-700 text-[10px]" style={{ color: '#F97316', fontFamily: 'IBM Plex Mono' }}>
                        -1.2921°S, 36.8219°E
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Vehicles */}
              {activeTab === 'vehicles' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-700 text-lg" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                      Active Fleet Ledger
                    </h3>
                    <p className="text-micro font-700 uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      Asset allocations, diagnostics, and plates
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: 'Cascadia CAS-03', plate: 'KCA-739-FX', make: 'Freightliner', year: '2023', fuel: '74%', speed: '62 kph', status: 'Active', statusColor: '#34D399' },
                      { name: 'Delivery VOL-12', plate: 'KBZ-012-VV', make: 'Volvo Trucks', year: '2024', fuel: '89%', speed: '55 kph', status: 'Active', statusColor: '#34D399' },
                    ].map(v => (
                      <div key={v.name} className="rounded-xl p-4 space-y-4"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-600" style={{ color: 'var(--text-primary)' }}>{v.name}</h4>
                            <span className="text-[9px] font-700 uppercase tracking-wider block mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                              {v.year} {v.make}
                            </span>
                          </div>
                          <span className="text-[9px] font-700 px-2 py-0.5 rounded-full"
                            style={{ background: `${v.statusColor}12`, color: v.statusColor, border: `1px solid ${v.statusColor}25` }}>
                            {v.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center pt-3" style={{ borderTop: '1px solid var(--border-0)' }}>
                          {[
                            { label: 'PLATE', val: v.plate, mono: true, color: 'var(--text-secondary)' },
                            { label: 'FUEL', val: v.fuel, mono: false, color: '#34D399' },
                            { label: 'SPEED', val: v.speed, mono: true, color: '#F97316' },
                          ].map(cell => (
                            <div key={cell.label} className="p-2 rounded-lg text-xs" style={{ background: 'var(--surface-0)', border: '1px solid var(--border-0)' }}>
                              <span className="text-[8px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>{cell.label}</span>
                              <span className="font-700 block mt-0.5" style={{ color: cell.color, fontFamily: cell.mono ? 'IBM Plex Mono' : 'DM Sans' }}>{cell.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Analytics */}
              {activeTab === 'analytics' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-700 text-lg" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                      Advanced Telemetry Charts
                    </h3>
                    <p className="text-micro font-700 uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      Historical logs and performance data
                    </p>
                  </div>
                  <div className="h-64 w-full rounded-xl p-3" style={{ border: '1px solid var(--border-0)', background: 'var(--surface-2)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sampleAnalytics} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gShowcase" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-0)" opacity={0.6} />
                        <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={9} fontFamily="DM Sans" tickLine={false} />
                        <YAxis stroke="var(--text-tertiary)" fontSize={9} fontFamily="IBM Plex Mono" tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 10 }} />
                        <Area type="monotone" name="Speed (kph)" dataKey="speed" stroke="#F97316" strokeWidth={2.5} fill="url(#gShowcase)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 5: Drivers */}
              {activeTab === 'drivers' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-700 text-lg" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                      Active Operator Roster
                    </h3>
                    <p className="text-micro font-700 uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      Safety scores, CDL licenses, and hours
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: 'Precious K.', license: 'Class A CDL', safety: 100, hours: '38h logged', status: 'Active', statusColor: '#34D399' },
                      { name: 'Fleet Manager', license: 'Class B CDL', safety: 98, hours: '42h logged', status: 'On Trip', statusColor: '#A78BFA' },
                    ].map(d => (
                      <div key={d.name} className="rounded-xl p-4 space-y-4"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center font-700 text-xs"
                            style={{ background: 'rgba(249,115,22,0.12)', color: '#F97316' }}>
                            {d.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs font-600" style={{ color: 'var(--text-primary)' }}>{d.name}</h4>
                            <span className="text-[9px] font-700 uppercase tracking-wider block mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                              {d.license}
                            </span>
                          </div>
                          <span className="ml-auto text-[9px] font-700 px-2 py-0.5 rounded-full"
                            style={{ background: `${d.statusColor}12`, color: d.statusColor, border: `1px solid ${d.statusColor}25` }}>
                            {d.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-3" style={{ borderTop: '1px solid var(--border-0)' }}>
                          <div className="flex items-center gap-1">
                            <Star size={13} weight="fill" style={{ color: '#FBBF24' }} />
                            <span className="font-700" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
                              {d.safety} / 100
                            </span>
                          </div>
                          <span className="text-[10px] font-500" style={{ color: 'var(--text-tertiary)' }}>{d.hours}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Design Principles */}
      <section className="relative max-w-7xl mx-auto px-6 pb-24 pt-20" style={{ borderTop: '1px solid var(--border-0)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div>
            <h3 className="text-xl font-700 flex items-center gap-2 mb-3" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
              <StackSimple size={18} weight="duotone" style={{ color: '#F97316' }} /> Type System
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Space Grotesk for display headings, DM Sans for UI body copy, IBM Plex Mono for all data and numbers.
              Strict CSS custom property tokens for consistent spacing and color.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-700 flex items-center gap-2 mb-3" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
              <Lightning size={18} weight="duotone" style={{ color: '#FBBF24' }} /> Orange Accent System
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Single electric-orange (#F97316) primary accent. Status colors are semantically fixed: green active,
              amber idle, purple on-trip, slate offline, red error — never swapped for aesthetics.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-700 flex items-center gap-2 mb-3" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
              <ShieldCheck size={18} weight="duotone" style={{ color: '#34D399' }} /> Kenyan Fleet Context
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              All units are localized: kph, km, KSh, liters. GPS coordinates default to Kenya.
              Compliance fields track CDL/DOT/drug-test cycles relevant to East African logistics operations.
            </p>
          </div>
        </div>
      </section>

      {/* Phase 1 — Shared primitives proof surface */}
      <section className="relative max-w-7xl mx-auto px-6 pb-24" style={{ borderTop: '1px solid var(--border-0)' }}>
        <div className="pt-20 mb-10">
          <div className="badge-live mb-4">Phase 1 · Shared Primitives</div>
          <h2 className="text-3xl font-700" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
            Design primitives
          </h2>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            StatusBadge, FormField, Button, and Card — built once, adopted across the app in Phase 3.
          </p>
        </div>

        {/* StatusBadge — every domain */}
        <div className="mb-12">
          <h3 className="text-sm font-700 uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
            StatusBadge
          </h3>
          <div className="surface-card p-5 space-y-4">
            {(Object.keys(statusRegistry) as StatusDomain[]).map((domain) => (
              <div key={domain} className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-600 w-36 shrink-0" style={{ color: 'var(--text-secondary)' }}>
                  {domain}
                </span>
                {Object.keys(statusRegistry[domain]).map((status) => (
                  <StatusBadge key={status} domain={domain} status={status} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* FormField — both layouts */}
        <div className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-700 uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
              FormField — stacked
            </h3>
            <div className="surface-card p-5 space-y-4">
              <FormField label="Origin" htmlFor="demo-origin">
                <input id="demo-origin" className="field-input" placeholder="e.g. Nairobi CBD" />
              </FormField>
              <FormField label="Destination" htmlFor="demo-dest" error="Destination is required">
                <input id="demo-dest" className="field-input" placeholder="e.g. Mombasa Port" />
              </FormField>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-700 uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
              FormField — inline
            </h3>
            <div className="surface-card p-5">
              <FormField label="Vehicle" layout="inline" htmlFor="demo-vehicle">
                <select id="demo-vehicle" className="field-input">
                  <option>Heavy Duty Isuzu FSR Truck</option>
                </select>
              </FormField>
              <FormField label="Odometer" layout="inline" htmlFor="demo-odo" error="Must be a positive number">
                <input id="demo-odo" className="field-input" placeholder="124500" />
              </FormField>
            </div>
          </div>
        </div>

        {/* Button variants */}
        <div className="mb-12">
          <h3 className="text-sm font-700 uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
            Button
          </h3>
          <div className="surface-card p-5 flex flex-wrap items-center gap-3">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="default" isLoading>Loading</Button>
            <Button variant="default" disabled>Disabled</Button>
          </div>
        </div>

        {/* Card */}
        <div>
          <h3 className="text-sm font-700 uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
            Card
          </h3>
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Fleet Health Score</CardTitle>
              <CardDescription>Aggregate across all active vehicles</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-700" style={{ fontFamily: 'IBM Plex Mono', color: 'var(--accent-text)' }}>94.2%</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default DesignShowcasePage;
