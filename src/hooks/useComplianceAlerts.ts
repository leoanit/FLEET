import { useMemo, useEffect, useRef } from 'react';
import { useDriversList } from '../features/drivers/hooks/useDrivers';
import { useUIStore } from '../store/useUIStore';
import { Driver } from '../features/drivers/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComplianceSeverity = 'expired' | 'expiring-soon';
export type ComplianceType = 'license';

export interface ComplianceAlert {
  driverId: string;
  driverName: string;
  severity: ComplianceSeverity;
  type: ComplianceType;
  label: string;       // e.g. "CDL Class B License"
  expiryDate: string;  // ISO date of when the credential expires/expired
  daysRemaining: number; // negative means already expired
}

// ─── Config ───────────────────────────────────────────────────────────────────


// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns how many days until a date string. Negative = already passed. */
export const daysFromNow = (dateStr: string): number => {
  const target = new Date(dateStr).getTime();
  const now    = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

/** Build a full compliance alert list from all drivers. */
const buildAlerts = (drivers: Driver[]): ComplianceAlert[] => {
  const alerts: ComplianceAlert[] = [];

  for (const driver of drivers) {
    const { compliance } = driver;
    if (!compliance) continue;

    // ── 1. CDL / Driver's License ─────────────────────────────────────────
    // The backend already computes licenseStatus — trust it.
    if (compliance.licenseStatus === 'expired' || compliance.licenseStatus === 'expiring-soon') {
      alerts.push({
        driverId:     driver.id,
        driverName:   driver.name,
        severity:     compliance.licenseStatus === 'expired' ? 'expired' : 'expiring-soon',
        type:         'license',
        label:        `CDL Class ${compliance.licenseClass || '?'} License`,
        expiryDate:   compliance.licenseExpiry,
        daysRemaining: daysFromNow(compliance.licenseExpiry),
      });
    }

  }

  // Sort: expired first, then by urgency (fewest days first)
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'expired' ? -1 : 1;
    }
    return a.daysRemaining - b.daysRemaining;
  });
};

// ─── Human-readable helpers (used by UI) ─────────────────────────────────────

export const formatDaysLabel = (days: number): string => {
  if (days < 0) return `expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'expires today';
  return `${days}d remaining`;
};

export const complianceTypeLabel: Record<ComplianceType, string> = {
  'license': 'License',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Computes compliance alerts across all 3 credential vectors for every driver.
 * Also automatically pushes alerts into the notification bell on first detection
 * (deduplicated per session using a ref — survives re-renders but resets on page refresh).
 */
export const useComplianceAlerts = () => {
  const { data: drivers = [], isLoading } = useDriversList();
  const addNotification = useUIStore(state => state.addNotification);

  // Track which alerts we've already pushed to the bell this session.
  // Using a ref (not state) so it never triggers a re-render.
  const notifiedRef = useRef(new Set<string>());

  const alerts = useMemo(() => buildAlerts(drivers), [drivers]);

  // Push once per unique alert per browser session.
  useEffect(() => {
    alerts.forEach(alert => {
      const key = `${alert.driverId}-${alert.type}`;
      if (notifiedRef.current.has(key)) return;
      notifiedRef.current.add(key);

      const dayLabel = alert.daysRemaining < 0
        ? `expired ${Math.abs(alert.daysRemaining)} day${Math.abs(alert.daysRemaining) !== 1 ? 's' : ''} ago`
        : `expires in ${alert.daysRemaining} day${alert.daysRemaining !== 1 ? 's' : ''}`;

      addNotification(
        alert.severity === 'expired' ? 'alert' : 'warning',
        `${alert.severity === 'expired' ? 'EXPIRED' : 'Expiring Soon'}: ${alert.driverName}`,
        `${alert.label} ${dayLabel}. Verify credentials immediately.`,
      );
    });
  }, [alerts, addNotification]);

  const expiredCount     = alerts.filter(a => a.severity === 'expired').length;
  const expiringCount    = alerts.filter(a => a.severity === 'expiring-soon').length;
  const driversAffected  = new Set(alerts.map(a => a.driverId)).size;

  return { alerts, expiredCount, expiringCount, driversAffected, isLoading };
};
