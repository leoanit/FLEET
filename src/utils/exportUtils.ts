// ─── FleetOS Export Utilities ────────────────────────────────────────────────
// Pure browser-based CSV and PDF export. No external libraries needed.

/** Format a date string into a human-readable format */
const fmtDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-KE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

/** Transient in-app toast used when a native dialog would otherwise be needed */
const showExportToast = (message: string): void => {
  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
    zIndex: '9999', maxWidth: '90%',
    background: 'var(--surface-1)', border: '1px solid rgba(249,115,22,0.35)',
    color: 'var(--text-primary)', borderRadius: '12px', padding: '12px 18px',
    fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
    boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
};

// ─── CSV Export ───────────────────────────────────────────────────────────────

/** Escape a CSV cell value safely */
const csvCell = (val: string | number | undefined | null): string => {
  const str = String(val ?? '');
  // Wrap in quotes if it contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/** Build and trigger a CSV file download */
export const downloadCSV = (
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][]
): void => {
  const csvLines = [
    headers.map(csvCell).join(','),
    ...rows.map(row => row.map(csvCell).join(','))
  ];
  const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ─── PDF Export ───────────────────────────────────────────────────────────────

/** Generate and print/download a PDF via browser print dialog */
export const downloadPDF = (
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number | undefined | null)[][],
  summary?: { label: string; value: string | number }[]
): void => {
  const generatedAt = new Date().toLocaleString('en-KE', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const tableRows = rows.map(row => `
    <tr>
      ${row.map(cell => `<td>${cell ?? '—'}</td>`).join('')}
    </tr>
  `).join('');

  const summaryHtml = summary ? `
    <div class="summary">
      ${summary.map(s => `
        <div class="summary-item">
          <span class="summary-label">${s.label}</span>
          <span class="summary-value">${s.value}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${title} — FleetOS Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 11px;
          color: #1e293b;
          background: #ffffff;
          padding: 32px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 18px;
          border-bottom: 2px solid #0f172a;
          margin-bottom: 20px;
        }
        .logo-block { display: flex; align-items: center; gap: 10px; }
        .logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #14b8a6, #6366f1);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 900; font-size: 14px;
        }
        .logo-text h1 { font-size: 18px; font-weight: 900; color: #0f172a; }
        .logo-text p  { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }
        .report-meta { text-align: right; }
        .report-meta h2 { font-size: 14px; font-weight: 800; color: #0f172a; }
        .report-meta p  { font-size: 9px; color: #64748b; margin-top: 4px; }
        .subtitle { font-size: 10px; color: #64748b; margin-bottom: 16px; }

        .summary {
          display: flex; flex-wrap: wrap; gap: 12px;
          margin-bottom: 20px;
        }
        .summary-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 16px;
          min-width: 110px;
          flex: 1;
        }
        .summary-label { display: block; font-size: 8px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 4px; }
        .summary-value { display: block; font-size: 16px; font-weight: 800; color: #0f172a; }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        thead tr {
          background: #0f172a;
          color: #ffffff;
        }
        thead th {
          padding: 9px 10px;
          text-align: left;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 8.5px;
          white-space: nowrap;
        }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody tr:hover { background: #f1f5f9; }
        tbody td {
          padding: 8px 10px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
          line-height: 1.4;
        }
        .footer {
          margin-top: 24px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 8.5px;
          color: #94a3b8;
        }
        .badge {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .badge-pending    { background: #fef3c7; color: #92400e; }
        .badge-assigned   { background: #dbeafe; color: #1e40af; }
        .badge-inprogress { background: #d1fae5; color: #065f46; }
        .badge-completed  { background: #dcfce7; color: #14532d; }
        .badge-cancelled  { background: #fee2e2; color: #991b1b; }
        .badge-active     { background: #d1fae5; color: #065f46; }
        .badge-idle       { background: #f1f5f9; color: #475569; }
        .badge-maintenance{ background: #fef3c7; color: #92400e; }
        .badge-offline    { background: #fee2e2; color: #991b1b; }
        @media print {
          body { padding: 20px; }
          @page { margin: 1.5cm; size: A4 landscape; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-block">
          <div class="logo-icon">F</div>
          <div class="logo-text">
            <h1>FleetOS</h1>
            <p>Enterprise Fleet Management</p>
          </div>
        </div>
        <div class="report-meta">
          <h2>${title}</h2>
          <p>Generated: ${generatedAt}</p>
          <p>Total Records: ${rows.length}</p>
        </div>
      </div>

      <p class="subtitle">${subtitle}</p>

      ${summaryHtml}

      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="footer">
        <span>FleetOS Enterprise — Confidential Document</span>
        <span>Generated on ${generatedAt}</span>
      </div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) {
    showExportToast('Please allow popups for this site to enable PDF export.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  // Short delay so browser fully renders before print dialog
  setTimeout(() => {
    win.print();
  }, 600);
};

// ─── Domain-Specific Export Functions ────────────────────────────────────────

export interface DispatchExportRow {
  referenceNumber: string;
  origin: string;
  destination: string;
  status: string;
  driverName?: string;
  vehicleName?: string;
  plateNumber?: string;
  scheduledDate: string;
  notes?: string;
  createdAt: string;
}

export const exportDispatchesCSV = (dispatches: DispatchExportRow[]) => {
  downloadCSV(
    'FleetOS_Dispatches',
    ['Reference #', 'Origin', 'Destination', 'Status', 'Driver', 'Vehicle', 'Plate No.', 'Scheduled Date', 'Notes', 'Created At'],
    dispatches.map(d => [
      d.referenceNumber, d.origin, d.destination, d.status,
      d.driverName || '—', d.vehicleName || '—', d.plateNumber || '—',
      fmtDate(d.scheduledDate), d.notes || '—', fmtDate(d.createdAt),
    ])
  );
};

export const exportDispatchesPDF = (dispatches: DispatchExportRow[]) => {
  const statusCounts = dispatches.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  downloadPDF(
    'Dispatch Registry Report',
    'Complete logistics dispatch ledger including route assignments, driver allocations, and status tracking.',
    ['Ref #', 'Origin', 'Destination', 'Status', 'Driver', 'Vehicle', 'Plate', 'Scheduled'],
    dispatches.map(d => [
      d.referenceNumber, d.origin, d.destination, d.status,
      d.driverName || '—', d.vehicleName || '—', d.plateNumber || '—',
      fmtDate(d.scheduledDate),
    ]),
    [
      { label: 'Total', value: dispatches.length },
      { label: 'Pending', value: statusCounts['Pending'] || 0 },
      { label: 'Assigned', value: statusCounts['Assigned'] || 0 },
      { label: 'In Progress', value: statusCounts['In Progress'] || 0 },
      { label: 'Completed', value: statusCounts['Completed'] || 0 },
    ]
  );
};

export interface VehicleExportRow {
  name: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  type: string;
  status: string;
  assignedDriverName?: string;
  odometer?: number;
  fuelLevel?: number;
  locationName?: string;
  createdAt: string;
}

export const exportVehiclesCSV = (vehicles: VehicleExportRow[]) => {
  downloadCSV(
    'FleetOS_Vehicles',
    ['Vehicle Name', 'Plate No.', 'Make', 'Model', 'Year', 'Type', 'Status', 'Assigned Driver', 'Odometer (km)', 'Fuel Level (%)', 'Last Location', 'Enrolled At'],
    vehicles.map(v => [
      v.name, v.plateNumber, v.make, v.model, v.year, v.type, v.status,
      v.assignedDriverName || '—', v.odometer ?? '—', v.fuelLevel ?? '—',
      v.locationName || '—', fmtDate(v.createdAt),
    ])
  );
};

export const exportVehiclesPDF = (vehicles: VehicleExportRow[]) => {
  const statusCounts = vehicles.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  downloadPDF(
    'Fleet Vehicle Registry',
    'Complete vehicle fleet inventory including telemetry status, assignments, and operational details.',
    ['Vehicle Name', 'Plate No.', 'Make / Model', 'Year', 'Type', 'Status', 'Driver', 'Odometer', 'Fuel %', 'Location'],
    vehicles.map(v => [
      v.name, v.plateNumber, `${v.make} ${v.model}`, v.year, v.type, v.status,
      v.assignedDriverName || '—',
      v.odometer ? `${v.odometer.toLocaleString()} km` : '—',
      v.fuelLevel !== undefined ? `${v.fuelLevel}%` : '—',
      v.locationName || '—',
    ]),
    [
      { label: 'Total', value: vehicles.length },
      { label: 'Active', value: statusCounts['active'] || 0 },
      { label: 'Idle', value: statusCounts['idle'] || 0 },
      { label: 'Maintenance', value: statusCounts['maintenance'] || 0 },
      { label: 'Offline', value: statusCounts['offline'] || 0 },
    ]
  );
};

export interface DriverExportRow {
  name: string;
  email: string;
  phone: string;
  status: string;
  assignedVehicleName?: string;
  tripsCompleted: number;
  rating: number;
  licenseClass?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseStatus?: string;
  createdAt: string;
}

export const exportDriversCSV = (drivers: DriverExportRow[]) => {
  downloadCSV(
    'FleetOS_Drivers',
    ['Name', 'Email', 'Phone', 'Status', 'Assigned Vehicle', 'Trips Completed', 'Rating', 'License Class', 'License No.', 'License Expiry', 'License Status', 'Enrolled At'],
    drivers.map(d => [
      d.name, d.email, d.phone, d.status,
      d.assignedVehicleName || '—', d.tripsCompleted, d.rating,
      d.licenseClass || '—', d.licenseNumber || '—',
      fmtDate(d.licenseExpiry), d.licenseStatus || '—',
      fmtDate(d.createdAt),
    ])
  );
};

export const exportDriversPDF = (drivers: DriverExportRow[]) => {
  const statusCounts = drivers.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  downloadPDF(
    'Driver Operator Registry',
    'Certified logistics operator dossiers including compliance status, performance ratings, and vehicle assignments.',
    ['Name', 'Email', 'Phone', 'Status', 'Vehicle', 'Trips', 'Rating', 'License Class', 'License Expiry', 'License Status'],
    drivers.map(d => [
      d.name, d.email, d.phone, d.status,
      d.assignedVehicleName || '—', d.tripsCompleted, `${d.rating}/5`,
      d.licenseClass || '—', fmtDate(d.licenseExpiry), d.licenseStatus || '—',
    ]),
    [
      { label: 'Total', value: drivers.length },
      { label: 'Active', value: statusCounts['active'] || 0 },
      { label: 'On Trip', value: statusCounts['on-trip'] || 0 },
      { label: 'Idle', value: statusCounts['idle'] || 0 },
      { label: 'Offline', value: statusCounts['offline'] || 0 },
    ]
  );
};
