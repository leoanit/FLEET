// Single source of truth for every status→color mapping in the app, consolidating
// what used to be 6 independently-duplicated color maps (DispatchTable, DriverListTable
// [x2 — status + compliance], VehicleList, RequestsTable, EmployeeAccountsPage,
// DashboardLayout's notifConfig). Every value is a CSS variable name (never a raw hex)
// so the colors stay correct across light/dark and any future rebrand.

export type StatusDomain =
  | 'dispatch'
  | 'driver'
  | 'compliance'
  | 'vehicle'
  | 'transportRequest'
  | 'employeeAccount'
  | 'notification';

export interface StatusEntry {
  /** CSS variable name, e.g. '--apex-green' */
  color: string;
  /** Show a pulsing dot — used for "actively happening right now" states */
  pulse?: boolean;
}

export const statusRegistry: Record<StatusDomain, Record<string, StatusEntry>> = {
  dispatch: {
    Pending: { color: '--apex-gray' },
    Assigned: { color: '--apex-blue' },
    'In Progress': { color: '--apex-green', pulse: true },
    Completed: { color: '--apex-purple' },
    Cancelled: { color: '--apex-red' },
  },
  driver: {
    active: { color: '--apex-green' },
    idle: { color: '--apex-yellow' },
    'on-trip': { color: '--apex-purple' },
    offline: { color: '--apex-gray' },
  },
  compliance: {
    compliant: { color: '--apex-green' },
    'expiring-soon': { color: '--apex-yellow' },
    expired: { color: '--apex-red' },
  },
  vehicle: {
    active: { color: '--apex-green' },
    idle: { color: '--apex-yellow' },
    maintenance: { color: '--apex-red' },
    offline: { color: '--apex-gray' },
  },
  transportRequest: {
    Pending: { color: '--apex-yellow' },
    Approved: { color: '--apex-green' },
    Rejected: { color: '--apex-red' },
  },
  employeeAccount: {
    pending: { color: '--apex-yellow' },
    approved: { color: '--apex-green' },
    rejected: { color: '--apex-red' },
  },
  notification: {
    alert: { color: '--apex-red' },
    warning: { color: '--apex-yellow' },
    success: { color: '--apex-green' },
    info: { color: '--apex-blue' },
  },
};

export function getStatusEntry(domain: StatusDomain, status: string): StatusEntry {
  return statusRegistry[domain][status] ?? { color: '--apex-gray' };
}
