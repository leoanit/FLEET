import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestAccess } from '../../services/authApi';
import { ArrowLeft, ArrowRight, CheckCircle, ShieldCheck, Truck, NavigationArrow, Gauge } from '@phosphor-icons/react';

const CRA_EMAIL_DOMAIN = 'cra.go.ke';

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

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border-0)',
  color: 'var(--text-primary)',
  fontFamily: 'DM Sans',
};

export const RequestAccessPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const emailValid = email.length === 0 || email.toLowerCase().trim().endsWith(`@${CRA_EMAIL_DOMAIN}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.toLowerCase().trim().endsWith(`@${CRA_EMAIL_DOMAIN}`)) {
      setError(`Email must be a valid @${CRA_EMAIL_DOMAIN} address`);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await requestAccess(name, email, department, employeeId);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to submit your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--surface-0)', fontFamily: 'DM Sans' }}>

      {/* ── Left brand panel ────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[480px] shrink-0 relative flex-col overflow-hidden scan-fx"
        style={{ background: 'var(--surface-1)', borderRight: '1px solid var(--border-0)' }}>

        <div className="dot-grid absolute inset-0 pointer-events-none" style={{ opacity: 0.7 }} />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-20 -right-16 h-48 w-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.07) 0%, transparent 70%)', filter: 'blur(30px)' }} />

        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          <div className="flex items-center gap-3 mb-14 anim-in">
            <LogoMark />
            <div className="flex flex-col leading-none">
              <span className="font-display font-700 text-xl tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk', letterSpacing: '-0.04em' }}>FleetOS</span>
              <span className="text-micro" style={{ color: 'var(--text-secondary)' }}>Enterprise Fleet Intelligence</span>
            </div>
          </div>

          <div className="mb-10 anim-in d-100">
            <div className="badge-live mb-5">CRA Employee Access</div>
            <h2 className="font-display font-700 text-[2.1rem] leading-[1.15] mb-3" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
              Request transport,<br/>
              <span style={{ color: 'var(--apex-orange)' }}>on demand.</span>
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: '340px', fontFamily: 'DM Sans' }}>
              Submit your details for a CRA transport account. Once an admin or dispatcher
              reviews and approves your request, you can log in and request a vehicle
              for errands or meetings.
            </p>
          </div>

          <div className="space-y-2.5 flex-1">
            <StatTile Icon={Truck}           label="VEHICLES IN NETWORK"  value="247"      sub="12 dispatched today"   delay="d-200" />
            <StatTile Icon={NavigationArrow} label="TRIPS IN PROGRESS"    value="38"       sub="Across 3 regions"       delay="d-300" />
            <StatTile Icon={Gauge}           label="FLEET HEALTH SCORE"   value="94.2%"    sub="Above baseline"         delay="d-400" />
          </div>

          <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border-0)' }}>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)', fontFamily: 'DM Sans' }}>
              © 2026 FleetOS Enterprise · SOC-2 Type II Certified · ISO 27001
            </p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 relative overflow-y-auto" style={{ background: 'var(--surface-0)' }}>

        <div className="absolute top-0 right-0 h-96 w-96 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(249,115,22,0.05) 0%, transparent 70%)' }} />

        <div className="w-full max-w-sm anim-in relative z-10">

          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <LogoMark />
            <span className="font-display font-700 text-xl" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>FleetOS</span>
          </div>

          {submitted ? (
            <div className="text-center anim-in">
              <div className="mx-auto mb-5 h-14 w-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
                <CheckCircle size={28} weight="duotone" style={{ color: '#34D399' }} />
              </div>
              <h1 className="font-display font-700 text-2xl mb-2" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
                Request submitted
              </h1>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}>
                An admin or dispatcher will review your request. Once approved, log in with
                your CRA email and the password <span className="font-mono font-700" style={{ color: 'var(--text-primary)' }}>employee123</span>.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-display font-600 text-sm transition-all"
                style={{ background: '#F97316', color: '#0A0D18', fontFamily: 'Space Grotesk', letterSpacing: '-0.01em', boxShadow: '0 0 24px rgba(249,115,22,0.25)' }}>
                Back to sign in
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="font-display font-700 text-2xl mb-1.5" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
                  Request access
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}>
                  For CRA employees only — an admin or dispatcher must approve your request
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <div className="rounded-xl p-3.5 text-sm anim-in" style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)' }}>
                    <p className="font-600 text-xs" style={{ color: '#F87171', fontFamily: 'DM Sans' }}>{error}</p>
                  </div>
                )}

                <div>
                  <label className="text-label block mb-1.5">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Wanjiru"
                    required
                    autoFocus
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
                    onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-0)')}
                  />
                </div>

                <div>
                  <label className="text-label block mb-1.5">CRA email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={`you@${CRA_EMAIL_DOMAIN}`}
                    required
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                    style={{ ...inputStyle, borderColor: emailValid ? inputStyle.border as string : 'rgba(248,113,113,0.5)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
                    onBlur={e  => (e.currentTarget.style.borderColor = emailValid ? 'var(--border-0)' : 'rgba(248,113,113,0.5)')}
                  />
                  {!emailValid && (
                    <p className="text-[11px] mt-1" style={{ color: '#F87171', fontFamily: 'DM Sans' }}>
                      Must be a @{CRA_EMAIL_DOMAIN} email address
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-label block mb-1.5">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="Finance"
                    required
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
                    onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-0)')}
                  />
                </div>

                <div>
                  <label className="text-label block mb-1.5">Employee ID</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    placeholder="CRA-1001"
                    required
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)')}
                    onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-0)')}
                  />
                </div>

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
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit request
                      <ArrowRight size={16} weight="bold" />
                    </>
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-1.5 mt-5 text-xs font-600 transition-colors"
                style={{ color: 'var(--text-tertiary)', fontFamily: 'DM Sans' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}>
                <ArrowLeft size={12} weight="bold" />
                Back to sign in
              </button>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestAccessPage;
