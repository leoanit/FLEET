import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useThemeStore } from '../store/useThemeStore';
import { useGPSStore, WebSocketClient, getWebSocketUrl } from '../services/websocket';
import {
  SquaresFour, Truck, Users, MapTrifold, CalendarDots,
  Wrench, ChartBar, Bell, SignOut, List, X,
  MagnifyingGlass, Warning, CheckCircle, Info, Trash,
  Checks, BellSlash, CaretRight, ClipboardText, UserPlus,
  Sun, Moon,
} from '@phosphor-icons/react';

// ─── Custom Logo Mark ─────────────────────────────────────────────────────────
const LogoMark = () => (
  <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
    <polygon
      points="15,2.5 26,8.5 26,21.5 15,27.5 4,21.5 4,8.5"
      stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round"
    />
    <path
      d="M9 20 L12.5 15.5 L17 17.5 L21 11"
      stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
    />
    <circle cx="9"  cy="20" r="1.4" fill="var(--accent)" />
    <circle cx="21" cy="11" r="1.4" fill="var(--accent)" />
  </svg>
);

// ─── Nav definition ───────────────────────────────────────────────────────────
const navItems = [
  { label: 'Dashboard',        path: '/dashboard', Icon: SquaresFour },
  { label: 'Vehicles',         path: '/vehicles',  Icon: Truck       },
  { label: 'Drivers',          path: '/drivers',   Icon: Users       },
  { label: 'Trips & Dispatch', path: '/trips',     Icon: CalendarDots },
  { label: 'Transport Requests', path: '/requests', Icon: ClipboardText },
  { label: 'Employee Accounts', path: '/employee-accounts', Icon: UserPlus },
  { label: 'GPS Tracking',     path: '/gps',       Icon: MapTrifold  },
  { label: 'Maintenance',      path: '/maintenance',Icon: Wrench      },
  { label: 'Reports',          path: '/reports',   Icon: ChartBar    },
];

// Notification color mapping — routes through the same --apex-* tokens as
// StatusBadge/statusRegistry rather than fixed Tailwind color classes, so it
// adapts correctly between light and dark instead of staying visually fixed.
const notifConfig: Record<'alert' | 'warning' | 'success' | 'info', { Icon: React.ElementType; colorVar: string }> = {
  alert:   { Icon: Warning,     colorVar: '--apex-red' },
  warning: { Icon: Warning,     colorVar: '--apex-yellow' },
  success: { Icon: CheckCircle, colorVar: '--apex-green' },
  info:    { Icon: Info,        colorVar: '--apex-blue' },
};

export const DashboardLayout: React.FC = () => {
  const {
    sidebarOpen, toggleSidebar, setSidebarOpen,
    activeNotificationsCount, notifications, notificationsOpen,
    toggleNotifications, closeNotifications,
    markAsRead, markAllAsRead, deleteNotification, clearAllNotifications,
    toast, setToast,
  } = useUIStore();

  const { user, logout }    = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const isConnected         = useGPSStore(s => s.isConnected);
  const navigate            = useNavigate();
  const location            = useLocation();
  const toastTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastProgressRef    = useRef<HTMLDivElement>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  // WebSocket
  useEffect(() => {
    const ws = new WebSocketClient(getWebSocketUrl());
    ws.connect(true);
    return () => ws.disconnect();
  }, []);

  // Toast dismiss
  useEffect(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (!toast) return;
    if (toastProgressRef.current) {
      toastProgressRef.current.style.transition = 'none';
      toastProgressRef.current.style.width = '100%';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (toastProgressRef.current) {
          toastProgressRef.current.style.transition = 'width 5000ms linear';
          toastProgressRef.current.style.width = '0%';
        }
      }));
    }
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, [toast, setToast]);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';

  const handleSignOut = () => { logout(); navigate('/login'); };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden text-[var(--text-primary)]" style={{ background: 'var(--surface-0)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Top toolbar ───────────────────────────────────────────────────── */}
      <header className="relative z-30 flex h-16 shrink-0 items-center justify-between gap-3 px-4 lg:px-5"
        style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border-0)' }}>

        {/* Left: mobile hamburger + logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={toggleSidebar} className="lg:hidden p-1.5 rounded-md hover:bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
            {sidebarOpen ? <X size={18} /> : <List size={18} />}
          </button>
          <Link to="/" className="flex items-center gap-2.5 group">
            <LogoMark />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-display font-700 text-[15px] tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>FleetOS</span>
              <span className="text-micro" style={{ color: 'var(--text-secondary)' }}>Enterprise</span>
            </div>
          </Link>
        </div>

        {/* Center: icon-over-label nav — desktop only */}
        <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
          {navItems.map(({ label, path, Icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Link key={path} to={path} title={label}
                className={`nav-link flex flex-col items-center gap-0.5 px-2.5 py-1.5 shrink-0 ${active ? 'nav-link-active' : ''}`}>
                <Icon size={17} weight={active ? 'bold' : 'regular'} />
                <span className="text-[8px] font-700 uppercase tracking-wide leading-none text-center whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search — widest screens only, room is tight with 9 nav items */}
          <div className="relative hidden xl:flex items-center">
            <MagnifyingGlass size={13} className="absolute left-3 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search fleet, drivers, routes..."
              className="rounded-lg pl-8 pr-4 py-1.5 text-[11px] outline-none transition-all w-48"
              style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--border-0)',
                color: 'var(--text-primary)',
                fontFamily: 'DM Sans',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--focus-ring)')}
              onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-0)')}
            />
          </div>

          {/* Live badge */}
          <div className="badge-live hidden md:flex">Operational</div>

          {/* GPS telemetry — compact dot, label carried by title tooltip */}
          <div className="hidden sm:flex items-center gap-1.5 px-2" title={`GPS Telemetry: ${isConnected ? 'Live' : 'Offline'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'anim-breath' : ''}`}
              style={{ background: isConnected ? 'var(--apex-green)' : 'var(--text-tertiary)', boxShadow: isConnected ? '0 0 6px var(--apex-green)' : 'none' }} />
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Bell */}
          <button
            onClick={toggleNotifications}
            className="relative p-2 rounded-lg transition-all"
            style={{
              background: notificationsOpen ? 'var(--accent-soft-bg)' : 'transparent',
              border: `1px solid ${notificationsOpen ? 'var(--accent-soft-border)' : 'transparent'}`,
              color: notificationsOpen ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <Bell size={17} weight={notificationsOpen ? 'fill' : 'regular'} />
            {activeNotificationsCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-700 ring-2 ring-[var(--surface-1)]"
                style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>
                {activeNotificationsCount > 9 ? '9+' : activeNotificationsCount}
              </span>
            )}
          </button>

          {/* Avatar + dropdown */}
          <div className="relative">
            <button onClick={() => setAvatarMenuOpen(v => !v)} className="relative h-8 w-8 shrink-0">
              <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, var(--accent), var(--apex-blue), var(--accent))', padding: '1px' }}>
                <div className="h-full w-full rounded-full flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                  <span className="font-display text-[9px] font-700" style={{ color: 'var(--accent-text)' }}>{initials}</span>
                </div>
              </div>
            </button>

            {avatarMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAvatarMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl overflow-hidden"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', boxShadow: `0 16px 40px var(--shadow-ambient)` }}>
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-0)' }}>
                    <p className="text-[11px] font-600 truncate" style={{ color: 'var(--text-primary)' }}>{user?.name ?? 'User'}</p>
                    <p className="text-micro capitalize" style={{ color: 'var(--text-secondary)' }}>{user?.role ?? 'operator'}</p>
                  </div>
                  <button onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-600 text-left transition-colors"
                    style={{ color: 'var(--apex-red)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--apex-red) 8%, transparent)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <SignOut size={14} weight="bold" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile nav dropdown ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-16 left-0 right-0 z-50 lg:hidden max-h-[70vh] overflow-y-auto"
            style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border-0)', boxShadow: `0 16px 40px var(--shadow-ambient)` }}>
            <nav className="p-3 space-y-1">
              {navItems.map(({ label, path, Icon }) => {
                const active = location.pathname.startsWith(path);
                return (
                  <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
                    className={`nav-link flex items-center gap-3 px-3 py-2.5 text-sm ${active ? 'nav-link-active' : ''}`}>
                    <Icon size={18} weight={active ? 'bold' : 'regular'} />
                    <span>{label}</span>
                    {active && <CaretRight size={12} weight="bold" className="ml-auto opacity-40" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-5" style={{ background: 'var(--surface-0)' }}>
        <Outlet />
      </main>

      {/* ── Notifications drawer ────────────────────────────────────────────── */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={closeNotifications} />
      )}
      <div className={`fixed top-0 right-0 z-[70] h-full w-[330px] flex flex-col transition-transform duration-250 ease-in-out ${notificationsOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'var(--surface-1)', borderLeft: '1px solid var(--border-0)' }}>

        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-soft-bg)', border: '1px solid var(--accent-soft-border)' }}>
              <Bell size={15} weight="bold" style={{ color: 'var(--accent-text)' }} />
            </div>
            <div>
              <p className="font-display font-600 text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</p>
              <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
                {activeNotificationsCount > 0 ? `${activeNotificationsCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          <button onClick={closeNotifications} className="p-1.5 rounded-md hover:bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <X size={15} />
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center justify-between px-5 py-2" style={{ borderBottom: '1px solid var(--border-0)', background: 'var(--surface-0)' }}>
            <button onClick={markAllAsRead} disabled={activeNotificationsCount === 0}
              className="flex items-center gap-1.5 text-[11px] font-500 transition-colors disabled:opacity-40 px-2 py-1 rounded-md hover:bg-white/5"
              style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}>
              <Checks size={13} /> Mark all read
            </button>
            <button onClick={clearAllNotifications}
              className="flex items-center gap-1.5 text-[11px] font-500 transition-colors px-2 py-1 rounded-md"
              style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--apex-red)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--apex-red) 8%, transparent)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
              <Trash size={13} /> Clear all
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                <BellSlash size={24} weight="thin" style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <div>
                <p className="font-display font-600 text-sm" style={{ color: 'var(--text-primary)' }}>All clear</p>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>No active alerts. Fleet running nominally.</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {notifications.map(n => {
                const c = notifConfig[n.type];
                return (
                  <div key={n.id} onClick={() => markAsRead(n.id)}
                    className="relative rounded-xl cursor-pointer transition-all group overflow-hidden"
                    style={{
                      border: `1px solid ${n.read ? 'var(--border-0)' : `color-mix(in srgb, var(${c.colorVar}) 30%, transparent)`}`,
                      background: n.read ? 'var(--surface-0)' : `color-mix(in srgb, var(${c.colorVar}) 8%, transparent)`,
                    }}>
                    {!n.read && <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: `var(${c.colorVar})` }} />}
                    <div className="p-3.5 pl-4 flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: n.read ? 'transparent' : `color-mix(in srgb, var(${c.colorVar}) 8%, transparent)`,
                          border: `1px solid ${n.read ? 'var(--border-0)' : `color-mix(in srgb, var(${c.colorVar}) 20%, transparent)`}`,
                        }}>
                        <c.Icon size={15} weight={n.read ? 'regular' : 'bold'} style={{ color: n.read ? 'var(--text-secondary)' : `var(${c.colorVar})` }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-micro" style={{ color: n.read ? 'var(--text-secondary)' : `var(${c.colorVar})` }}>
                            {n.type}
                          </span>
                          <button onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                            className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-tertiary)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--apex-red)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}>
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-[11px] font-600 leading-snug mb-1" style={{ color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)', fontFamily: 'DM Sans' }}>{n.title}</p>
                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}>{n.message}</p>
                        <p className="font-mono text-[10px] mt-2" style={{ color: 'var(--text-tertiary)' }}>{n.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (() => {
        const c = notifConfig[toast.type];
        return (
          <div className="fixed bottom-5 right-5 z-[100] w-[320px] rounded-xl overflow-hidden"
            style={{ background: 'var(--surface-2)', border: `1px solid color-mix(in srgb, var(${c.colorVar}) 30%, transparent)`, boxShadow: '0 20px 60px var(--shadow-ambient)' }}>
            <div ref={toastProgressRef} style={{ height: '2px', width: '100%', background: `var(${c.colorVar})` }} />
            <div className="flex items-start gap-3 p-4">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in srgb, var(${c.colorVar}) 10%, transparent)`, border: `1px solid color-mix(in srgb, var(${c.colorVar}) 25%, transparent)` }}>
                <c.Icon size={16} weight="bold" style={{ color: `var(${c.colorVar})` }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-600 text-xs mb-0.5" style={{ color: 'var(--text-primary)' }}>{toast.title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="p-1 rounded-md hover:bg-white/5 transition-colors shrink-0" style={{ color: 'var(--text-secondary)' }}>
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
