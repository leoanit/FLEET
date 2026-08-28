import React, { useState } from 'react';
import { Driver } from '../types';
import { Truck, Star, ArrowRight, PencilSimple, Trash, LockKey } from '@phosphor-icons/react';
import { Pagination } from '../../../components/ui/Pagination';

const PAGE_SIZE = 10;

interface DriverListTableProps {
  drivers: Driver[];
  onEdit: (driver: Driver) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onResetPassword?: (driverId: string) => void;
  isAdmin?: boolean;
  resettingId?: string | null;
}

const inputCls: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface-2)',
  border: '1px solid var(--border-0)',
  borderRadius: '8px',
  padding: '6px 10px',
  fontSize: '12px',
  color: 'var(--text-primary)',
  fontFamily: 'DM Sans',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const setFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
  (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)');
const setBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
  (e.currentTarget.style.borderColor = 'var(--border-0)');

export const DriverListTable: React.FC<DriverListTableProps> = ({ drivers, onEdit, onDelete, onSelect, onResetPassword, isAdmin = false, resettingId = null }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch = driver.name.toLowerCase().includes(search.toLowerCase()) ||
                          driver.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    const matchesCompliance = complianceFilter === 'all' || driver.compliance.licenseStatus === complianceFilter;
    return matchesSearch && matchesStatus && matchesCompliance;
  });

  const totalPages = Math.ceil(filteredDrivers.length / PAGE_SIZE);
  const pageDrivers = filteredDrivers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      active: '#34D399', idle: '#FBBF24', 'on-trip': '#A78BFA', offline: '#94A3B8',
    };
    const color = colorMap[status] || '#94A3B8';
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-700 uppercase tracking-wider"
        style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        {status}
      </span>
    );
  };

  const getComplianceBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      compliant:       { color: '#34D399', label: 'Compliant' },
      'expiring-soon': { color: '#FBBF24', label: 'Expiring Soon' },
      expired:         { color: '#F87171', label: 'EXPIRED' },
    };
    const { color, label } = map[status] || { color: '#94A3B8', label: 'Unknown' };
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-700 uppercase tracking-wider"
        style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* FILTER ROW */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pb-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
        <input type="text" value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="Search driver name or email..." style={inputCls}
          onFocus={setFocus} onBlur={setBlur} />
        <select value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          style={{ ...inputCls, appearance: 'none' } as React.CSSProperties}
          onFocus={setFocus} onBlur={setBlur}>
          <option value="all">All Operational Statuses</option>
          <option value="active">Active On-Duty</option>
          <option value="idle">Idle Available</option>
          <option value="on-trip">On Active Trip</option>
          <option value="offline">Offline Off-Duty</option>
        </select>
        <select value={complianceFilter}
          onChange={(e) => { setComplianceFilter(e.target.value); setCurrentPage(1); }}
          style={{ ...inputCls, appearance: 'none' } as React.CSSProperties}
          onFocus={setFocus} onBlur={setBlur}>
          <option value="all">All Compliance Rulings</option>
          <option value="compliant">Compliant CDL</option>
          <option value="expiring-soon">CDL Warnings (Expiring)</option>
          <option value="expired">Violations (Expired)</option>
        </select>
      </div>

      {/* TABLE + PAGINATION */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-600 uppercase tracking-widest"
              style={{ borderBottom: '1px solid var(--border-0)', color: 'var(--text-tertiary)' }}>
              <th className="py-3 px-4">Operator</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">CDL Compliance</th>
              <th className="py-3 px-4">Active Vehicle</th>
              <th className="py-3 px-4">Drive Rating</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs font-600" style={{ color: 'var(--text-tertiary)' }}>
                  No matching driver registry coordinates found
                </td>
              </tr>
            ) : (
              pageDrivers.map((driver) => (
                <tr key={driver.id} className="group transition-colors"
                  style={{ borderBottom: '1px solid var(--border-0)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-700"
                        style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316' }}>
                        {driver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <span className="font-600 text-sm block" style={{ color: 'var(--text-primary)' }}>{driver.name}</span>
                        <span className="text-[10px] block leading-tight" style={{ color: 'var(--text-tertiary)' }}>{driver.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">{getStatusBadge(driver.status)}</td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      {getComplianceBadge(driver.compliance.licenseStatus)}
                      <span className="text-[9px] font-500" style={{ color: 'var(--text-tertiary)' }}>
                        Exp: {new Date(driver.compliance.licenseExpiry).toLocaleDateString('en-KE')}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {driver.assignedVehicleName ? (
                      <div className="flex items-center gap-1.5 text-xs font-600" style={{ color: 'var(--text-secondary)' }}>
                        <Truck size={13} style={{ color: 'var(--text-tertiary)' }} /> {driver.assignedVehicleName}
                      </div>
                    ) : (
                      <span className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>Unassigned</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-xs font-700" style={{ color: 'var(--text-primary)' }}>
                        <Star size={13} weight="fill" style={{ color: '#FBBF24' }} />
                        {driver.rating.toFixed(1)}
                      </div>
                      <span className="text-[9px] font-600 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                        Safety: {driver.performance.safetyScore}%
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => onEdit(driver)} title="Edit profile"
                        className="p-1.5 rounded transition-colors"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#F97316'; e.currentTarget.style.background = 'rgba(249,115,22,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = ''; }}>
                        <PencilSimple size={14} />
                      </button>

                      {isAdmin && onResetPassword && (
                        <button
                          onClick={() => onResetPassword(driver.id)}
                          disabled={resettingId === driver.id}
                          title="Reset login password"
                          className="p-1.5 rounded transition-colors"
                          style={{ color: 'var(--text-tertiary)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#A78BFA'; e.currentTarget.style.background = 'rgba(167,139,250,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = ''; }}>
                          {resettingId === driver.id
                            ? <div className="h-3.5 w-3.5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(167,139,250,0.3)', borderTopColor: '#A78BFA' }} />
                            : <LockKey size={14} />}
                        </button>
                      )}

                      <button onClick={() => onDelete(driver.id)} title="Delete"
                        className="p-1.5 rounded transition-colors"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = ''; }}>
                        <Trash size={14} />
                      </button>
                      <button onClick={() => onSelect(driver.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-600 transition-all"
                        style={{ border: '1px solid var(--border-1)', color: 'var(--text-secondary)', background: 'transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                        Profile <ArrowRight size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredDrivers.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
