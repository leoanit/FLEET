import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { login as apiLogin } from '../../services/authApi';
import { Eye, EyeSlash, ArrowRight, Truck, NavigationArrow, Gauge, ShieldCheck } from '@phosphor-icons/react';

// ─── Logo ────────────────────────────────────────────────────────────────────
const LogoMark = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <polygon
      points="18,3 31,10 31,26 18,33 5,26 5,10"
      stroke="#F97316" strokeWidth="1.4" strokeLinejoin="round"
    />
    <path
      d="M10.5 24.5 L15 19 L20.5 21.5 L25.5 13"
      stroke="#F97316" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    />
    <circle cx="10.5" cy="24.5" r="1.8" fill="#F97316" />
    <circle cx="25.5" cy="13"   r="1.8" fill="#F97316" />
  </svg>
);

// ─── Left panel live stat tile ────────────────────────────────────────────────
const StatTile: React.FC<{ Icon: React.ElementType; label: string; value: string; sub: string; delay?: string }> = ({ Icon, label, value, sub, delay = '' }) => (
  <div className={`flex items-center gap-4 rounded-2xl p-4 anim-in ${delay}`}
    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
      <Icon size={20} weight="duotone" style={{ color: '#F97316' }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-micro mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
      <p className="font-mono font-700 text-lg leading-tight" style={{ color: '#ECF0FF' }}>{value}</p>
      <p className="text-[11px] font-500 leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans' }}>{sub}</p>
    </div>
  </div>
);

// ─── Demo credential pill ─────────────────────────────────────────────────────
const CredPill: React.FC<{
  role: string;
  email: string;
  password: string;
  color: string;
  onFill: (e: string, p: string) => void;
}> = ({ role, email, password, color, onFill }) => (
  <button onClick={() => onFill(email, password)}
    className="group flex flex-col gap-1 rounded-xl p-3 w-full text-left transition-all"
    style={{ background: `${color}08`, border: `1px solid ${color}20` }}
    onMouseEnter={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.borderColor = `${color}35`; }}
    onMouseLeave={e => { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.borderColor = `${color}20`; }}>
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-700 uppercase tracking-widest" style={{ color, fontFamily: 'DM Sans' }}>{role}</span>
      <ArrowRight size={12} weight="bold" style={{ color: `${color}80` }} className="group-hover:translate-x-0.5 transition-transform" />
    </div>
    <p className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{email}</p>
  </button>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const LoginPage: React.FC = () => {
  const { setCredentials } = useAuthStore();
  const navigate = useNavigate();

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { user, token } = await apiLogin(email, password);
      setCredentials(user, token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCreds = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--surface-0)', fontFamily: 'DM Sans' }}>

      {/* ── Left brand panel ────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[480px] shrink-0 relative flex-col overflow-hidden scan-fx"
        style={{ background: 'var(--surface-1)', borderRight: '1px solid var(--border-0)' }}>

        {/* Dot grid background */}
        <div className="dot-grid absolute inset-0 pointer-events-none" style={{ opacity: 0.7 }} />

        {/* Orange ambient blob */}
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-20 -right-16 h-48 w-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.07) 0%, transparent 70%)', filter: 'blur(30px)' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14 anim-in">
            <LogoMark />
            <div className="flex flex-col leading-none">
              <span className="font-display font-700 text-xl tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk', letterSpacing: '-0.04em' }}>FleetOS</span>
              <span className="text-micro" style={{ color: 'var(--text-secondary)' }}>Enterprise Fleet Intelligence</span>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-10 anim-in d-100">
            <div className="badge-live mb-5">System Operational</div>
            <h2 className="font-display font-700 text-[2.1rem] leading-[1.15] mb-3" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
              Command your<br/>
              <span style={{ color: 'var(--apex-orange)' }}>fleet at scale.</span>
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: '340px', fontFamily: 'DM Sans' }}>
              Real-time telemetry, intelligent dispatch, predictive maintenance, and compliance
              in a single enterprise platform.
            </p>
          </div>

          {/* Stats */}
          <div className="space-y-2.5 flex-1">
            <StatTile Icon={Truck}           label="VEHICLES IN NETWORK"  value="247"      sub="12 dispatched today"   delay="d-200" />
            <StatTile Icon={NavigationArrow} label="TRIPS IN PROGRESS"    value="38"       sub="Across 3 regions"       delay="d-300" />
            <StatTile Icon={Gauge}           label="FLEET HEALTH SCORE"   value="94.2%"    sub="Above baseline"         delay="d-400" />
            <StatTile Icon={ShieldCheck}     label="COMPLIANCE RATE"      value="99.1%"    sub="All licenses current"   delay="d-500" />
          </div>

          {/* Footer */}
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border-0)' }}>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)', fontFamily: 'DM Sans' }}>
              © 2026 FleetOS Enterprise · SOC-2 Type II Certified · ISO 27001
            </p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 relative overflow-y-auto" style={{ background: 'var(--surface-0)' }}>

        {/* Subtle corner gradient */}
        <div className="absolute top-0 right-0 h-96 w-96 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(249,115,22,0.05) 0%, transparent 70%)' }} />

        <div className="w-full max-w-sm anim-in relative z-10">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <LogoMark />
            <span className="font-display font-700 text-xl" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>FleetOS</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="font-display font-700 text-2xl mb-1.5" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
              Sign in
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}>
              Access your fleet operations center
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Error banner */}
            {error && (
              <div className="rounded-xl p-3.5 text-sm anim-in" style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <p className="font-600 text-xs" style={{ color: '#F87171', fontFamily: 'DM Sans' }}>{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-label block mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-0)',
                  color: 'var(--text-primary)',
                  fontFamily: 'DM Sans',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
                onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-0)')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-label block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl px-4 py-2.5 pr-11 text-sm outline-none transition-all"
                  style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-0)',
                    color: 'var(--text-primary)',
                    fontFamily: 'DM Sans',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-0)')}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--apex-orange)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                  {showPwd ? <EyeSlash size={16} weight="regular" /> : <Eye size={16} weight="regular" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-display font-600 text-sm transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isLoading ? 'rgba(249,115,22,0.6)' : '#F97316',
                color: '#0A0D18',
                fontFamily: 'Space Grotesk',
                letterSpacing: '-0.01em',
                boxShadow: isLoading ? 'none' : '0 0 24px rgba(249,115,22,0.25)',
              }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.boxShadow = '0 0 36px rgba(249,115,22,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(249,115,22,0.25)'; }}>
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  Sign in to FleetOS
                  <ArrowRight size={16} weight="bold" />
                </>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-7">
            <p className="text-micro mb-3 text-center" style={{ color: 'var(--text-tertiary)' }}>Demo accounts — click to fill</p>
            <div className="grid grid-cols-1 gap-2">
              <CredPill role="System Admin"       email="admin@fleetos.com"           password="admin123"      color="#F97316" onFill={fillCreds} />
              <CredPill role="Fleet Dispatcher"   email="dispatcher@fleetos.com"      password="dispatcher123" color="#60A5FA" onFill={fillCreds} />
              <CredPill role="Driver"             email="david.mwangi@fleetos.co.ke"  password="driver123"     color="#34D399" onFill={fillCreds} />
            </div>
          </div>

          {/* CRA employee access request */}
          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-tertiary)', fontFamily: 'DM Sans' }}>
            CRA employee?{' '}
            <button
              type="button"
              onClick={() => navigate('/request-access')}
              style={{ color: '#F97316', fontWeight: 600 }}>
              Request access
            </button>
          </p>

          {/* Trust badges */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border-0)' }}>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {['SOC-2 Certified', 'AES-256 Encrypted', 'GDPR Ready'].map(label => (
                <div key={label} className="flex items-center gap-1.5">
                  <ShieldCheck size={11} weight="bold" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-[10px] font-500" style={{ color: 'var(--text-tertiary)', fontFamily: 'DM Sans', letterSpacing: '0.04em' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
