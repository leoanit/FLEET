import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapTrifold, Wrench, Users, ChartBar, CalendarDots, ShieldCheck,
  ArrowRight, Truck, Lightning, CheckCircle, Star, CaretRight,
  NavigationArrow, Gauge, Pulse,
} from '@phosphor-icons/react';

// ─── Logo ─────────────────────────────────────────────────────────────────────
const LogoMark = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <polygon points="16,2.5 28,9 28,23 16,29.5 4,23 4,9" stroke="#F97316" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M9 22 L13 17 L18.5 19.5 L23 12" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9"  cy="22" r="1.6" fill="#F97316" />
    <circle cx="23" cy="12" r="1.6" fill="#F97316" />
  </svg>
);

// ─── Animated counter ──────────────────────────────────────────────────────────
const Counter: React.FC<{ target: number; suffix?: string }> = ({ target, suffix = '' }) => {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || seen.current) return;
      seen.current = true;
      const t0 = performance.now();
      const dur = 1800;
      const tick = (now: number) => {
        const p = Math.min((now - t0) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setN(Math.round(ease * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
};

// Verified Unsplash CDN URLs — each confirmed to show actual truck/fleet imagery
const PHOTOS = {
  // Truck driving on open road, Alaska — wide dramatic landscape
  hero:    'https://images.unsplash.com/photo-1591768793355-74d04bb6608f?w=1920&q=85&auto=format&fit=crop',
  // White freight truck on road during daytime
  convoy:  'https://images.unsplash.com/photo-1616432043562-3671ea2e5242?w=1600&q=80&auto=format&fit=crop',
  // Truck on highway — direct front angle
  highway: 'https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?w=1600&q=80&auto=format&fit=crop',
  // Aerial photography of freight truck lot — bird's eye fleet yard
  manager: 'https://images.unsplash.com/photo-1492168732976-2676c584c675?w=900&q=80&auto=format&fit=crop',
  // Black semi truck on road, Los Angeles — urban close shot
  driver:  'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=900&q=80&auto=format&fit=crop',
  // White semi truck driving down a rural road
  cta:     'https://images.unsplash.com/photo-1695222833131-54ee679ae8e5?w=1920&q=80&auto=format&fit=crop',
};

const features = [
  {
    Icon: MapTrifold,
    title: 'Real-Time GPS Tracking',
    desc: 'Sub-second position updates for every asset. Speed, heading, and fuel level broadcast over WebSocket to your command center.',
    accent: '#F97316',
    tags: ['Live GPS', 'WebSocket', 'Geofencing'],
  },
  {
    Icon: Wrench,
    title: 'Predictive Maintenance',
    desc: 'Odometer-triggered alerts catch vehicles before breakdown. Full service history, cost tracking and mechanic assignment in one log.',
    accent: '#60A5FA',
    tags: ['Mileage Alerts', 'Service Logs', 'Cost Tracking'],
  },
  {
    Icon: Users,
    title: 'Driver Compliance Hub',
    desc: 'CDL expiry, DOT physical, drug test status — tracked automatically. Never miss a license renewal or compliance deadline.',
    accent: '#34D399',
    tags: ['CDL Tracking', 'DOT Compliance', 'HOS Logs'],
  },
  {
    Icon: ChartBar,
    title: 'Analytics Command Center',
    desc: 'MongoDB aggregation pipelines power live KPIs — health score, active missions, weekly distance, driver utilization.',
    accent: '#A78BFA',
    tags: ['Live KPIs', 'Recharts', 'MongoDB'],
  },
  {
    Icon: CalendarDots,
    title: 'Intelligent Dispatch',
    desc: 'Create dispatches, bind drivers to vehicles, log timestamps at each lifecycle stage. Full origin-to-destination tracking.',
    accent: '#FB923C',
    tags: ['Trip Lifecycle', 'Driver Binding', 'Status Sync'],
  },
  {
    Icon: ShieldCheck,
    title: 'Enterprise RBAC Security',
    desc: 'JWT auth with role-based access control. Admins command the fleet; dispatchers coordinate; drivers get a focused field portal.',
    accent: '#F87171',
    tags: ['JWT Auth', 'Role Enforcement', 'BOLA Protected'],
  },
];

const stats = [
  { value: 500,   suffix: '+',  label: 'Vehicles Monitored',    Icon: Truck           },
  { value: 99.8,  suffix: '%',  label: 'System Uptime',          Icon: Pulse           },
  { value: 12,    suffix: 'ms', label: 'Avg Telemetry Latency',  Icon: Lightning       },
  { value: 50000, suffix: '+',  label: 'Trips Logged',           Icon: NavigationArrow },
];

const testimonials = [
  {
    quote: "FleetOS cut our vehicle downtime by 40%. The predictive maintenance alerts paid for the platform in the first quarter.",
    author: "Marcus R.", title: "VP Logistics, Cascade Transport", stars: 5,
  },
  {
    quote: "The compliance dashboard is a game-changer. We haven't had a single expired CDL slip through since deploying FleetOS.",
    author: "Sandra T.", title: "Safety Director, Northwest Freight", stars: 5,
  },
  {
    quote: "Real-time GPS on every asset, dispatch tracking, full service history — it replaced three tools we were paying for.",
    author: "James K.", title: "Operations Manager, Pacific Hauling", stars: 5,
  },
];

export const LandingPage: React.FC = () => (
  <div style={{ background: 'var(--surface-0)', color: 'var(--text-primary)', fontFamily: 'DM Sans' }}>

    {/* ── STICKY NAV ──────────────────────────────────────────────────────── */}
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{ background: 'rgba(4,6,15,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-0)' }}>
      <div className="flex items-center gap-3">
        <LogoMark />
        <div className="leading-none">
          <span className="font-display font-700 text-[17px]" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>FleetOS</span>
          <span className="block text-micro" style={{ color: 'var(--text-secondary)' }}>Enterprise</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-8 text-[13px] font-500" style={{ color: 'var(--text-secondary)' }}>
        {[['#features','Features'],['#stats','Platform'],['#testimonials','Customers']].map(([h,l]) => (
          <a key={l} href={h} className="transition-colors hover:text-white">{l}</a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link to="/login" className="hidden sm:inline-flex items-center px-4 py-2 text-[13px] font-600 transition-all rounded-lg"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-1)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-1)'; }}>
          Sign in
        </Link>
        <Link to="/login"
          className="inline-flex items-center gap-2 px-5 py-2 text-[13px] font-700 rounded-lg transition-all"
          style={{ background: '#F97316', color: '#04060F', fontFamily: 'Space Grotesk', letterSpacing: '-0.01em' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 24px rgba(249,115,22,0.45)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
          Launch Dashboard <ArrowRight size={14} weight="bold" />
        </Link>
      </div>
    </nav>

    {/* ── HERO ─────────────────────────────────────────────────────────────── */}
    <section className="relative min-h-[92vh] flex items-center overflow-hidden"
      style={{ backgroundImage: `url('${PHOTOS.hero}')`, backgroundSize: 'cover', backgroundPosition: 'center 60%', backgroundColor: '#04060F' }}>

      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(4,6,15,0.72)' }} />
      {/* Dot grid over photo */}
      <div className="dot-grid absolute inset-0" style={{ opacity: 0.3 }} />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--surface-0))' }} />

      <div className="relative z-10 mx-auto max-w-5xl px-8 py-24 text-center">
        <div className="badge-live mb-7 anim-in">Fleet Intelligence · Now Live</div>

        <h1 className="font-display font-800 leading-[1.05] mb-6 anim-in d-100"
          style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.045em', fontSize: 'clamp(2.8rem, 7vw, 5rem)', color: '#FFFFFF' }}>
          Total visibility.<br />
          <span style={{ color: '#F97316' }}>Total control.</span>
        </h1>

        <p className="text-lg leading-relaxed mb-10 mx-auto max-w-xl anim-in d-200"
          style={{ color: 'rgba(255,255,255,0.58)', fontFamily: 'DM Sans' }}>
          FleetOS gives your operations team real-time GPS telemetry, predictive maintenance,
          driver compliance, and intelligent dispatch — unified in one command center.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 anim-in d-300">
          <Link to="/login"
            className="inline-flex items-center gap-2.5 px-8 py-4 text-base font-700 rounded-xl transition-all"
            style={{ background: '#F97316', color: '#04060F', fontFamily: 'Space Grotesk' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 40px rgba(249,115,22,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
            Launch Command Center <ArrowRight size={18} weight="bold" />
          </Link>
          <a href="#features"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-600 rounded-xl transition-all"
            style={{ color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.15)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
            Explore Features <CaretRight size={16} weight="bold" />
          </a>
        </div>

        {/* Hero stat pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 anim-in d-400">
          {[
            ['500+', 'Vehicles tracked'],
            ['99.8%', 'Platform uptime'],
            ['< 12ms', 'GPS latency'],
            ['50k+', 'Trips logged'],
          ].map(([v, l]) => (
            <div key={l} className="flex items-center gap-2.5 rounded-full px-4 py-2"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="font-mono font-700 text-sm" style={{ color: '#F97316' }}>{v}</span>
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── ORANGE STATS TICKER ────────────────────────────────────────────────── */}
    <section id="stats" className="py-14" style={{ background: '#F97316' }}>
      <div className="mx-auto max-w-6xl px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(({ value, suffix, label, Icon }) => (
            <div key={label} className="flex flex-col items-center text-center gap-3">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.15)' }}>
                <Icon size={22} weight="bold" style={{ color: '#04060F' }} />
              </div>
              <div className="font-mono font-800 text-3xl" style={{ color: '#04060F', fontFamily: 'IBM Plex Mono', letterSpacing: '-0.03em' }}>
                <Counter target={value} suffix={suffix} />
              </div>
              <div className="text-[11px] font-700 uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.55)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
    <section id="features" className="py-28 px-8" style={{ background: 'var(--surface-0)' }}>
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-micro mb-4" style={{ color: '#F97316' }}>Platform Capabilities</p>
          <h2 className="font-display font-700 mb-4" style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
            Everything to run a world-class fleet
          </h2>
          <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Built on the MERN stack with real-time WebSocket telemetry and MongoDB aggregation pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ Icon, title, desc, accent, tags }) => (
            <div key={title} className="group rounded-2xl p-6 transition-all duration-300 relative overflow-hidden"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-0)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}35`; e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-0)'; e.currentTarget.style.background = 'var(--surface-1)'; }}>
              {/* Solid left accent bar */}
              <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full" style={{ background: accent }} />

              <div className="pl-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-5" style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}>
                  <Icon size={20} weight="duotone" style={{ color: accent }} />
                </div>
                <h3 className="font-display font-600 text-base mb-2" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{title}</h3>
                <p className="text-[12px] leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                <div className="flex flex-wrap gap-1.5 pt-4" style={{ borderTop: '1px solid var(--border-0)' }}>
                  {tags.map(tag => (
                    <span key={tag} className="text-[10px] font-600 uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{ background: `${accent}10`, color: accent, border: `1px solid ${accent}20` }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CONVOY PHOTO BREAK ───────────────────────────────────────────────── */}
    <section className="relative h-[400px] flex items-center overflow-hidden"
      style={{ backgroundImage: `url('${PHOTOS.convoy}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#080D1C' }}>
      <div className="absolute inset-0" style={{ background: 'rgba(4,6,15,0.65)' }} />
      <div className="dot-grid absolute inset-0 pointer-events-none" style={{ opacity: 0.25 }} />
      <div className="absolute left-0 top-0 bottom-0 w-1 pointer-events-none" style={{ background: '#F97316' }} />

      <div className="relative z-10 mx-auto max-w-4xl px-8 text-center">
        <p className="text-micro mb-4" style={{ color: '#F97316' }}>Built for the Road Ahead</p>
        <h2 className="font-display font-700 mb-4" style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#FFFFFF' }}>
          Where fleets go, FleetOS follows.
        </h2>
        <p className="text-base" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans' }}>
          Cellular, satellite, and last-mile coverage. Your vehicles are never out of sight.
        </p>
      </div>
    </section>

    {/* ── ROLE SPLIT ───────────────────────────────────────────────────────── */}
    <section className="py-28 px-8" style={{ background: 'var(--surface-0)' }}>
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <h2 className="font-display font-700 mb-3" style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
            Built for every role
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Two purpose-built interfaces — one for the command center, one for the road.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Fleet Manager card */}
          <div className="group relative rounded-2xl overflow-hidden min-h-[420px] flex flex-col justify-end"
            style={{ backgroundImage: `url('${PHOTOS.manager}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#080D1C' }}>
            <div className="absolute inset-0 transition-opacity duration-300" style={{ background: 'rgba(4,6,15,0.75)' }} />
            {/* Orange left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: '#F97316' }} />
            <div className="relative z-10 p-8">
              <div className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-700 uppercase tracking-wider mb-5"
                style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', color: '#F97316' }}>
                <ChartBar size={13} weight="bold" /> Fleet Manager · Desktop
              </div>
              <h3 className="font-display font-700 text-2xl mb-3" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.03em', color: '#FFFFFF' }}>
                Command Center Dashboard
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'DM Sans' }}>
                Live KPI cards, vehicle health radials, dispatch management, driver compliance alerts, and analytics panels — all in one data-dense console.
              </p>
              <ul className="space-y-2 mb-7">
                {['Live fleet telemetry & GPS visualization', 'Dispatch creation & driver-vehicle assignment', 'CDL & DOT compliance monitoring', 'Service log management with cost tracking'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'DM Sans' }}>
                    <CheckCircle size={13} weight="bold" style={{ color: '#F97316', flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-700 rounded-xl transition-all"
                style={{ background: '#F97316', color: '#04060F', fontFamily: 'Space Grotesk' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 24px rgba(249,115,22,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                Enter Command Center <ArrowRight size={15} weight="bold" />
              </Link>
            </div>
          </div>

          {/* Driver card */}
          <div className="group relative rounded-2xl overflow-hidden min-h-[420px] flex flex-col justify-end"
            style={{ backgroundImage: `url('${PHOTOS.driver}')`, backgroundSize: 'cover', backgroundPosition: 'center top', backgroundColor: '#080D1C' }}>
            <div className="absolute inset-0" style={{ background: 'rgba(4,6,15,0.75)' }} />
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: '#60A5FA' }} />
            <div className="relative z-10 p-8">
              <div className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-700 uppercase tracking-wider mb-5"
                style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', color: '#60A5FA' }}>
                <Truck size={13} weight="bold" /> Driver · Mobile PWA
              </div>
              <h3 className="font-display font-700 text-2xl mb-3" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.03em', color: '#FFFFFF' }}>
                Driver Field Portal
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'DM Sans' }}>
                Distraction-free mobile interface with massive touch targets built for outdoor use. One tap to start or end a trip, log fuel, or report vehicle issues.
              </p>
              <ul className="space-y-2 mb-7">
                {['One-tap trip START / END with timestamp', 'Active dispatch: origin, destination, vehicle', 'Quick-access fuel log form', 'Vehicle issue reporting from the field'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'DM Sans' }}>
                    <CheckCircle size={13} weight="bold" style={{ color: '#60A5FA', flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-700 rounded-xl transition-all"
                style={{ background: '#60A5FA', color: '#04060F', fontFamily: 'Space Grotesk' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 24px rgba(96,165,250,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                Enter Driver Portal <ArrowRight size={15} weight="bold" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ── HIGHWAY PHOTO BREAK (full-bleed) ─────────────────────────────────── */}
    <div className="relative h-[280px] overflow-hidden"
      style={{ backgroundImage: `url('${PHOTOS.highway}')`, backgroundSize: 'cover', backgroundPosition: 'center 40%', backgroundColor: '#04060F' }}>
      <div className="absolute inset-0" style={{ background: 'rgba(4,6,15,0.55)' }} />
      {/* Orange horizontal bar overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: '#F97316' }} />
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="flex flex-wrap gap-8 justify-center">
          {[
            { Icon: Gauge, label: 'Fleet Health', value: '94.2%' },
            { Icon: NavigationArrow, label: 'Active Missions', value: '38' },
            { Icon: Lightning, label: 'Alerts Today', value: '2' },
            { Icon: CheckCircle, label: 'Compliance Rate', value: '99.1%' },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 text-center">
              <Icon size={22} weight="duotone" style={{ color: '#F97316' }} />
              <span className="font-mono font-700 text-2xl" style={{ color: '#FFFFFF', fontFamily: 'IBM Plex Mono' }}>{value}</span>
              <span className="text-micro" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
    <section id="testimonials" className="py-24 px-8" style={{ background: 'var(--surface-1)' }}>
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <p className="text-micro mb-4" style={{ color: '#F97316' }}>Customer Stories</p>
          <h2 className="font-display font-700 mb-3" style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
            Trusted by fleet operations teams
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map(t => (
            <div key={t.author} className="rounded-2xl p-7 relative overflow-hidden"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
              {/* Solid top accent */}
              <div className="absolute top-0 left-6 right-6 h-px" style={{ background: '#F97316', opacity: 0.4 }} />

              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={14} weight="fill" style={{ color: '#F97316' }} />
                ))}
              </div>
              <p className="text-[13px] leading-relaxed mb-6 italic" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}>
                "{t.quote}"
              </p>
              <div className="pt-4" style={{ borderTop: '1px solid var(--border-0)' }}>
                <p className="text-sm font-700" style={{ color: 'var(--text-primary)', fontFamily: 'DM Sans' }}>{t.author}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA BANNER ───────────────────────────────────────────────────────── */}
    <section className="relative overflow-hidden py-24 px-8"
      style={{ backgroundImage: `url('${PHOTOS.cta}')`, backgroundSize: 'cover', backgroundPosition: 'center 30%', backgroundColor: '#04060F' }}>
      <div className="absolute inset-0" style={{ background: 'rgba(4,6,15,0.82)' }} />
      <div className="dot-grid absolute inset-0 pointer-events-none" style={{ opacity: 0.4 }} />
      {/* Full-width orange top border */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: '#F97316' }} />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <div className="badge-live mb-7 mx-auto" style={{ width: 'fit-content' }}>Ready to Deploy</div>
        <h2 className="font-display font-700 mb-4" style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.045em', color: '#FFFFFF' }}>
          Take command of<br />
          <span style={{ color: '#F97316' }}>your entire fleet.</span>
        </h2>
        <p className="text-base leading-relaxed mb-10 mx-auto max-w-lg" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans' }}>
          Connect your MongoDB instance, run the seed script, and your command center is live in under five minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login"
            className="inline-flex items-center gap-2.5 px-9 py-4 text-base font-700 rounded-xl transition-all"
            style={{ background: '#F97316', color: '#04060F', fontFamily: 'Space Grotesk' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 48px rgba(249,115,22,0.55)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
            Launch Free Demo <ArrowRight size={18} weight="bold" />
          </Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-9 py-4 text-base font-600 rounded-xl transition-all"
            style={{ color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.15)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
            View on GitHub
          </a>
        </div>
      </div>
    </section>

    {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
    <footer className="py-10 px-8" style={{ background: 'var(--surface-1)', borderTop: '1px solid var(--border-0)' }}>
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <LogoMark />
          <span className="font-display font-700 text-sm" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>FleetOS Enterprise</span>
        </div>
        <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>© 2026 FleetOS · Enterprise Fleet Intelligence Platform</p>
        <div className="flex gap-5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#stats" className="hover:text-white transition-colors">Platform</a>
        </div>
      </div>
    </footer>
  </div>
);

export default LandingPage;
