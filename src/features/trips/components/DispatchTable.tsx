import React, { useState } from 'react';
import { Dispatch } from '../types';
import { Truck, Users, Calendar, ArrowRight, Play, PencilSimple, Trash } from '@phosphor-icons/react';
import { Pagination } from '../../../components/ui/Pagination';

const PAGE_SIZE = 10;

interface DispatchTableProps {
  dispatches: Dispatch[];
  onEdit: (dispatch: Dispatch) => void;
  onDelete: (id: string) => void;
  onStartTrip: (dispatchId: string) => void;
  onSelect: (id: string) => void;
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

export const DispatchTable: React.FC<DispatchTableProps> = ({
  dispatches, onEdit, onDelete, onStartTrip, onSelect,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredDispatches = dispatches.filter((disp) => {
    const matchesSearch =
      disp.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      disp.origin.toLowerCase().includes(search.toLowerCase()) ||
      disp.destination.toLowerCase().includes(search.toLowerCase()) ||
      (disp.driverName && disp.driverName.toLowerCase().includes(search.toLowerCase())) ||
      (disp.vehicleName && disp.vehicleName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || disp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDispatches.length / PAGE_SIZE);
  const pageDispatches = filteredDispatches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; pulse?: boolean }> = {
      Pending:      { color: '#94A3B8' },
      Assigned:     { color: '#60A5FA' },
      'In Progress':{ color: '#34D399', pulse: true },
      Completed:    { color: '#A78BFA' },
      Cancelled:    { color: '#F87171' },
    };
    const { color, pulse } = map[status] || { color: '#94A3B8' };
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-700 uppercase tracking-wider"
        style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
        <span className={`h-1.5 w-1.5 rounded-full ${pulse ? 'animate-pulse' : ''}`} style={{ background: color }} />
        {status}
      </span>
    );
  };

  const setFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)');
  const setBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = 'var(--border-0)');

  return (
    <div className="space-y-4">
      {/* FILTER BAR */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pb-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
        <input type="text" value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="Search reference, origin, destination, driver, vehicle..."
          style={inputCls} onFocus={setFocus} onBlur={setBlur} />
        <select value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          style={{ ...inputCls, appearance: 'none' } as React.CSSProperties}
          onFocus={setFocus} onBlur={setBlur}>
          <option value="all">All Dispatch Statuses</option>
          <option value="Pending">Pending Assignment</option>
          <option value="Assigned">Assigned & Ready</option>
          <option value="In Progress">In Transit</option>
          <option value="Completed">Completed Trips</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-600 uppercase tracking-widest"
              style={{ borderBottom: '1px solid var(--border-0)', color: 'var(--text-tertiary)' }}>
              <th className="py-3 px-4">Ref Code</th>
              <th className="py-3 px-4">Route</th>
              <th className="py-3 px-4">Operator</th>
              <th className="py-3 px-4">Vehicle</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDispatches.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs font-600" style={{ color: 'var(--text-tertiary)' }}>
                  No matching dispatch operations located
                </td>
              </tr>
            ) : (
              pageDispatches.map((disp) => (
                <tr key={disp.id} className="transition-colors"
                  style={{ borderBottom: '1px solid var(--border-0)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                  <td className="py-3.5 px-4">
                    <span className="text-xs font-700 tracking-wider"
                      style={{ color: '#F97316', fontFamily: 'IBM Plex Mono' }}>
                      {disp.referenceNumber}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-sm font-600 block" style={{ color: 'var(--text-primary)' }}>
                      {disp.origin} → {disp.destination}
                    </span>
                    {disp.notes && (
                      <span className="text-[10px] truncate max-w-xs block mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {disp.notes}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    {disp.driverId ? (
                      <div className="flex items-center gap-1.5 text-xs font-500" style={{ color: 'var(--text-secondary)' }}>
                        <Users size={13} style={{ color: 'var(--text-tertiary)' }} /> {disp.driverName}
                      </div>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-700 uppercase tracking-wide px-2 py-0.5 rounded"
                        style={{ background: 'rgba(251,191,36,0.1)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.2)' }}>
                        Needs Driver
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    {disp.vehicleId ? (
                      <div className="flex items-center gap-1.5 text-xs font-500" style={{ color: 'var(--text-secondary)' }}>
                        <Truck size={13} style={{ color: 'var(--text-tertiary)' }} /> {disp.vehicleName}
                      </div>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-700 uppercase tracking-wide px-2 py-0.5 rounded"
                        style={{ background: 'rgba(251,191,36,0.1)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.2)' }}>
                        Needs Vehicle
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <Calendar size={13} style={{ color: 'var(--text-tertiary)' }} />
                      {new Date(disp.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">{getStatusBadge(disp.status)}</td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {disp.status === 'Assigned' && (
                        <button onClick={(e) => { e.stopPropagation(); onStartTrip(disp.id); }}
                          className="flex items-center gap-1 px-2 h-7 text-[10px] font-700 uppercase tracking-wide rounded transition-all"
                          style={{ background: '#34D399', color: '#04060F' }}
                          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 12px rgba(52,211,153,0.4)')}
                          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                          <Play size={10} weight="fill" /> Start
                        </button>
                      )}

                      {disp.status !== 'Completed' && disp.status !== 'Cancelled' && (
                        <button onClick={(e) => { e.stopPropagation(); onEdit(disp); }}
                          className="p-1.5 rounded transition-colors" title="Edit"
                          style={{ color: 'var(--text-tertiary)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#F97316'; e.currentTarget.style.background = 'rgba(249,115,22,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = ''; }}>
                          <PencilSimple size={13} />
                        </button>
                      )}

                      {['Pending', 'Cancelled'].includes(disp.status) && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(disp.id); }}
                          className="p-1.5 rounded transition-colors" title="Delete"
                          style={{ color: 'var(--text-tertiary)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = ''; }}>
                          <Trash size={13} />
                        </button>
                      )}

                      <button onClick={() => onSelect(disp.id)}
                        className="flex items-center gap-1 px-2 h-7 rounded text-[10px] font-600 transition-all"
                        style={{ border: '1px solid var(--border-1)', color: 'var(--text-secondary)', background: 'transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                        Details <ArrowRight size={10} />
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
        totalItems={filteredDispatches.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
