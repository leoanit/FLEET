import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDriverDetails, useDriverActions } from '../../features/drivers/hooks/useDrivers';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import {
  ArrowLeft, Truck, Envelope, Phone, Trophy, Clock, Star,
  PlusCircle, User,
} from '@phosphor-icons/react';

const Spinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <div className="rounded-full border-2 animate-spin flex-shrink-0"
    style={{ width: size, height: size, borderColor: 'rgba(249,115,22,0.2)', borderTopColor: '#F97316' }} />
);

export const DriverDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'performance' | 'notes'>('overview');
  const [newNoteContent, setNewNoteContent] = useState('');

  const { data: driver, isLoading, isError } = useDriverDetails(id || '');
  const { addNote, isAddingNote } = useDriverActions();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner size={32} />
        <p className="text-micro uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
          Retrieving operator dossier...
        </p>
      </div>
    );
  }

  if (isError || !driver) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-600 mb-4" style={{ color: '#F87171' }}>
          Operator profile not found in active database.
        </p>
        <button onClick={() => navigate('/drivers')}
          className="rounded-xl font-600 text-sm"
          style={{ background: '#F97316', color: '#04060F', padding: '8px 20px', border: 'none', cursor: 'pointer' }}>
          Back to Roster
        </button>
      </div>
    );
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    try {
      await addNote({ driverId: driver.id, author: 'Fleet Admin', content: newNoteContent });
      setNewNoteContent('');
    } catch (err) {
      console.error('Failed to append admin note:', err);
    }
  };

  const performanceHistory = [
    { week: 'Wk 1', safety: 90, eco: 85 },
    { week: 'Wk 2', safety: 92, eco: 88 },
    { week: 'Wk 3', safety: driver.performance.safetyScore - 4, eco: 84 },
    { week: 'Wk 4', safety: driver.performance.safetyScore, eco: driver.performance.fuelEfficiencyScore },
  ];

  const skillsData = [
    { subject: 'Eco Driving', A: driver.performance.fuelEfficiencyScore },
    { subject: 'Safety', A: driver.performance.safetyScore },
    { subject: 'Route', A: 96 },
    { subject: 'HOS', A: 99 },
    { subject: 'Timeliness', A: driver.performance.onTimeDeliveryRate },
  ];

  const getStatusColor = (status: string) => ({
    active: '#34D399', idle: '#FBBF24', 'on-trip': '#A78BFA', offline: '#94A3B8',
  }[status] || '#94A3B8');

  const statusColor = getStatusColor(driver.status);

  const getComplianceColor = (status: string) => ({
    compliant: '#34D399', 'expiring-soon': '#FBBF24', expired: '#F87171',
  }[status] || '#94A3B8');

  const tabs = ['overview', 'compliance', 'performance', 'notes'] as const;

  const inputCls: React.CSSProperties = {
    width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-1)',
    borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)',
    fontFamily: 'DM Sans', outline: 'none', transition: 'border-color 0.15s', resize: 'vertical',
  };

  return (
    <div style={{ color: 'var(--text-primary)', fontFamily: 'DM Sans' }}>

      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5 mb-5"
        style={{ borderBottom: '1px solid var(--border-0)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/drivers')}
            className="p-2 rounded-xl transition-all"
            style={{ border: '1px solid var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-secondary)', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <ArrowLeft size={18} weight="bold" />
          </button>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-700"
              style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316' }}>
              {driver.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-700 leading-none" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.03em' }}>
                  {driver.name}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-700 uppercase tracking-wider"
                  style={{ background: `${statusColor}12`, border: `1px solid ${statusColor}25`, color: statusColor }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor }} />
                  {driver.status}
                </span>
              </div>
              <p className="text-micro font-700 uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', fontFamily: 'IBM Plex Mono' }}>
                {driver.compliance.licenseClass} · {driver.compliance.licenseNumber}
              </p>
            </div>
          </div>
        </div>

        {driver.assignedVehicleName && (
          <div className="surface-card flex items-center gap-3 max-w-sm" style={{ padding: '12px 16px' }}>
            <Truck size={18} weight="duotone" style={{ color: '#F97316' }} />
            <div>
              <span className="text-micro font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Assigned Vehicle</span>
              <span className="text-xs font-600 block" style={{ color: 'var(--text-primary)' }}>{driver.assignedVehicleName}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 pb-4 mb-5" style={{ borderBottom: '1px solid var(--border-0)' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="rounded-lg px-4 py-2 text-xs font-600 uppercase tracking-wider transition-all"
            style={{
              background: activeTab === tab ? 'rgba(249,115,22,0.1)' : 'transparent',
              border: activeTab === tab ? '1px solid rgba(249,115,22,0.25)' : '1px solid transparent',
              color: activeTab === tab ? '#F97316' : 'var(--text-tertiary)',
              cursor: 'pointer',
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

          <div className="surface-card md:col-span-2 anim-in">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <p className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Operator Details</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Personal and licensing information</p>
            </div>
            <div className="p-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                    <Envelope size={14} weight="duotone" style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <div>
                    <span className="text-micro uppercase tracking-wider block mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Email</span>
                    <span className="font-500" style={{ color: 'var(--text-primary)' }}>{driver.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                    <Phone size={14} weight="duotone" style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <div>
                    <span className="text-micro uppercase tracking-wider block mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Phone</span>
                    <span className="font-500" style={{ color: 'var(--text-primary)' }}>{driver.phone}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                    <Trophy size={14} weight="duotone" style={{ color: '#FBBF24' }} />
                  </div>
                  <div>
                    <span className="text-micro uppercase tracking-wider block mb-0.5" style={{ color: 'var(--text-tertiary)' }}>License Class</span>
                    <span className="font-600" style={{ color: 'var(--text-primary)' }}>{driver.compliance.licenseClass}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                    <Star size={14} weight="duotone" style={{ color: '#FBBF24' }} />
                  </div>
                  <div>
                    <span className="text-micro uppercase tracking-wider block mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Rating</span>
                    <span className="font-600" style={{ color: 'var(--text-primary)' }}>
                      {driver.rating.toFixed(1)} <span style={{ color: 'var(--text-tertiary)' }}>/ 5.0</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card anim-in d-100">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <p className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Performance</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Current cycle metrics</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                <span className="flex items-center gap-2 text-xs font-500" style={{ color: 'var(--text-secondary)' }}>
                  <Clock size={14} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
                  Weekly Hours
                </span>
                <span className="font-700 text-xs" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
                  {driver.performance.weeklyHoursLogged} HRS
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                <span className="flex items-center gap-2 text-xs font-500" style={{ color: 'var(--text-secondary)' }}>
                  <Trophy size={14} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
                  Trips Completed
                </span>
                <span className="font-700 text-xs" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
                  {driver.tripsCompleted}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Compliance ── */}
      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* CDL */}
          <div className="surface-card anim-in">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <p className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>CDL Licensure</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Licensing dates and compliance status</p>
            </div>
            <div className="p-5 space-y-0">
              {[
                { label: 'CDL Number', value: driver.compliance.licenseNumber, mono: true },
                { label: 'Expiry Date', value: new Date(driver.compliance.licenseExpiry).toLocaleDateString('en-KE'), mono: false },
              ].map((row, i, arr) => (
                <div key={row.label} className="flex justify-between items-center py-3 text-xs"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-0)' : 'none' }}>
                  <span className="font-600 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{row.label}</span>
                  <span className="font-600" style={{ color: 'var(--text-primary)', fontFamily: row.mono ? 'IBM Plex Mono' : 'DM Sans' }}>{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-3 text-xs">
                <span className="font-600 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-700 uppercase tracking-widest"
                  style={{
                    background: `${getComplianceColor(driver.compliance.licenseStatus)}12`,
                    border: `1px solid ${getComplianceColor(driver.compliance.licenseStatus)}25`,
                    color: getComplianceColor(driver.compliance.licenseStatus),
                  }}>
                  {driver.compliance.licenseStatus}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── Performance ── */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="surface-card lg:col-span-2 overflow-hidden anim-in">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <p className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Telemetry Scoring Index</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Weekly safety and fuel efficiency scores</p>
            </div>
            <div className="p-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSafety" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gEco" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-0)" opacity={0.6} />
                  <XAxis dataKey="week" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} fontFamily="DM Sans" />
                  <YAxis stroke="var(--text-tertiary)" fontSize={10} domain={[70, 100]} tickLine={false} fontFamily="IBM Plex Mono" />
                  <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', borderRadius: 12 }} />
                  <Area type="monotone" name="Safety Score" dataKey="safety" stroke="#F97316" strokeWidth={2} fill="url(#gSafety)" dot={false} />
                  <Area type="monotone" name="Eco Efficiency" dataKey="eco" stroke="#60A5FA" strokeWidth={1.5} fill="url(#gEco)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface-card overflow-hidden anim-in d-100">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <p className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Skill Matrix</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Competency vs. benchmarks</p>
            </div>
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={skillsData}>
                  <PolarGrid stroke="var(--border-0)" opacity={0.5} />
                  <PolarAngleAxis dataKey="subject" stroke="var(--text-tertiary)" fontSize={9} fontFamily="DM Sans" />
                  <PolarRadiusAxis stroke="var(--border-0)" angle={30} domain={[0, 100]} fontSize={8} />
                  <Radar name="Score" dataKey="A" stroke="#F97316" fill="#F97316" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Notes ── */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="surface-card lg:col-span-2 overflow-hidden anim-in">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <p className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Operational Journal</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Dispatcher log notes and annotations</p>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {driver.notes.length === 0 ? (
                <div className="p-8 text-center text-xs italic" style={{ color: 'var(--text-tertiary)' }}>
                  No administrative entries recorded.
                </div>
              ) : (
                driver.notes.map(note => (
                  <div key={note.id} className="p-4 text-xs space-y-1.5 transition-colors"
                    style={{ borderBottom: '1px solid var(--border-0)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <div className="flex justify-between items-center">
                      <span className="font-600 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                        <User size={12} weight="duotone" style={{ color: '#F97316' }} />
                        {note.author}
                      </span>
                      <span className="text-micro" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(note.createdAt).toLocaleString('en-KE')}
                      </span>
                    </div>
                    <p className="leading-relaxed pl-5 font-500" style={{ color: 'var(--text-secondary)' }}>{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="surface-card anim-in d-100">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <p className="font-600 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>Log Note</p>
              <p className="text-micro mt-0.5" style={{ color: 'var(--text-secondary)' }}>Append to operator journal</p>
            </div>
            <div className="p-5">
              <form onSubmit={handleAddNote} className="space-y-4">
                <textarea
                  value={newNoteContent}
                  onChange={e => setNewNoteContent(e.target.value)}
                  placeholder="Describe behaviors, compliance notes, or updates..."
                  rows={4}
                  style={{ ...inputCls }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-1)')}
                  required
                />
                <button type="submit" disabled={isAddingNote}
                  className="w-full rounded-xl font-600 text-xs flex items-center justify-center gap-1.5"
                  style={{
                    background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
                    color: '#F97316', padding: '10px 0', cursor: isAddingNote ? 'not-allowed' : 'pointer',
                    opacity: isAddingNote ? 0.7 : 1,
                  }}>
                  <PlusCircle size={14} weight="duotone" /> Save Entry
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
