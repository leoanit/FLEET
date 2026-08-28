import React, { useState } from 'react';
import { TransportRequest, TransportRequestStatus } from '../types';
import { Calendar, User, ArrowRight, CheckCircle, XCircle, Clock } from '@phosphor-icons/react';
import { Pagination } from '../../../components/ui/Pagination';

const PAGE_SIZE = 10;

interface RequestsTableProps {
  requests: TransportRequest[];
  onApprove: (request: TransportRequest) => void;
  onReject: (request: TransportRequest) => void;
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

const statusMeta: Record<TransportRequestStatus, { color: string; Icon: React.ElementType }> = {
  Pending: { color: '#FBBF24', Icon: Clock },
  Approved: { color: '#34D399', Icon: CheckCircle },
  Rejected: { color: '#F87171', Icon: XCircle },
};

export const RequestsTable: React.FC<RequestsTableProps> = ({ requests, onApprove, onReject }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      r.origin.toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE);
  const pageRequests = filteredRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getStatusBadge = (status: TransportRequestStatus) => {
    const { color, Icon } = statusMeta[status];
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-700 uppercase tracking-wider"
        style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
        <Icon size={11} weight="bold" />
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
          placeholder="Search reference, requester, origin, destination..."
          style={inputCls} onFocus={setFocus} onBlur={setBlur} />
        <select value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          style={{ ...inputCls, appearance: 'none' } as React.CSSProperties}
          onFocus={setFocus} onBlur={setBlur}>
          <option value="all">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-600 uppercase tracking-widest"
              style={{ borderBottom: '1px solid var(--border-0)', color: 'var(--text-tertiary)' }}>
              <th className="py-3 px-4">Ref</th>
              <th className="py-3 px-4">Requester</th>
              <th className="py-3 px-4">Route</th>
              <th className="py-3 px-4">Purpose</th>
              <th className="py-3 px-4">Travel Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs font-600" style={{ color: 'var(--text-tertiary)' }}>
                  No matching transport requests
                </td>
              </tr>
            ) : (
              pageRequests.map((r) => (
                <tr key={r.id} className="transition-colors"
                  style={{ borderBottom: '1px solid var(--border-0)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                  <td className="py-3.5 px-4">
                    <span className="text-xs font-700 tracking-wider" style={{ color: '#F97316', fontFamily: 'IBM Plex Mono' }}>
                      {r.referenceNumber}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-xs font-500" style={{ color: 'var(--text-secondary)' }}>
                      <User size={13} style={{ color: 'var(--text-tertiary)' }} /> {r.requesterName}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-sm font-600 block" style={{ color: 'var(--text-primary)' }}>
                      {r.origin} → {r.destination}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-[11px] truncate max-w-[180px] block" style={{ color: 'var(--text-tertiary)' }}>
                      {r.purpose}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <Calendar size={13} style={{ color: 'var(--text-tertiary)' }} />
                      {new Date(r.travelDateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {getStatusBadge(r.status)}
                    {r.status === 'Rejected' && r.rejectionReason && (
                      <p className="text-[10px] mt-1 max-w-[160px]" style={{ color: 'var(--text-tertiary)' }}>{r.rejectionReason}</p>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {r.status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => onApprove(r)}
                          className="flex items-center gap-1 px-2.5 h-7 text-[10px] font-700 uppercase tracking-wide rounded transition-all"
                          style={{ background: '#34D399', color: '#04060F' }}
                          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 12px rgba(52,211,153,0.4)')}
                          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                          <CheckCircle size={11} weight="bold" /> Approve
                        </button>
                        <button onClick={() => onReject(r)}
                          className="flex items-center gap-1 px-2.5 h-7 text-[10px] font-700 uppercase tracking-wide rounded transition-all"
                          style={{ background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <XCircle size={11} weight="bold" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-600" style={{ color: 'var(--text-tertiary)' }}>
                        {r.reviewedBy ? `by ${r.reviewedBy}` : '—'} <ArrowRight size={9} />
                      </span>
                    )}
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
        totalItems={filteredRequests.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
