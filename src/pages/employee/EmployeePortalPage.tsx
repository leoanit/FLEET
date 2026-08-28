import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useTransportRequests } from '../../features/requests/hooks/useTransportRequests';
import { NewRequestModal } from '../../features/requests/components/NewRequestModal';
import { TransportRequest } from '../../features/requests/types';
import {
  Pulse, SignOut, Plus, MapPin, Calendar, Truck, User,
  Clock, CheckCircle, XCircle, Hash,
} from '@phosphor-icons/react';

const Spinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <div className="rounded-full border-2 animate-spin flex-shrink-0"
    style={{ width: size, height: size, borderColor: 'rgba(249,115,22,0.2)', borderTopColor: '#F97316' }} />
);

const statusMeta: Record<TransportRequest['status'], { color: string; Icon: React.ElementType }> = {
  Pending: { color: '#FBBF24', Icon: Clock },
  Approved: { color: '#34D399', Icon: CheckCircle },
  Rejected: { color: '#F87171', Icon: XCircle },
};

const RequestCard: React.FC<{ request: TransportRequest }> = ({ request }) => {
  const { color, Icon } = statusMeta[request.status];
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-0)' }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-700 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          <Hash size={11} /> {request.referenceNumber}
        </div>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-700 uppercase tracking-wider"
          style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
          <Icon size={11} weight="bold" />
          {request.status}
        </span>
      </div>

      <p className="text-sm font-600 mb-1" style={{ color: 'var(--text-primary)' }}>
        {request.origin} → {request.destination}
      </p>
      <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{request.purpose}</p>

      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        <Calendar size={12} />
        {new Date(request.travelDateTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>

      {request.status === 'Approved' && (
        <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid var(--border-0)' }}>
          {request.driverName && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <User size={13} style={{ color: '#34D399' }} /> {request.driverName}
            </div>
          )}
          {request.vehicleName && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <Truck size={13} style={{ color: '#34D399' }} /> {request.vehicleName} {request.plateNumber ? `— ${request.plateNumber}` : ''}
            </div>
          )}
        </div>
      )}

      {request.status === 'Rejected' && request.rejectionReason && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-0)' }}>
          <p className="text-xs" style={{ color: '#F87171' }}>{request.rejectionReason}</p>
        </div>
      )}
    </div>
  );
};

export const EmployeePortalPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  const { data: requests = [], isLoading } = useTransportRequests();

  const handleLogout = () => { logout(); navigate('/login'); };

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto" style={{ background: 'var(--surface-0)', color: 'var(--text-primary)', fontFamily: 'DM Sans' }}>

      {/* Header */}
      <header className="sticky top-0 z-40 px-5 py-4" style={{ background: 'var(--surface-0)', borderBottom: '1px solid var(--border-0)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <Pulse size={18} weight="duotone" style={{ color: '#F97316' }} />
            </div>
            <div>
              <p className="font-600 text-sm leading-none" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>FleetOS</p>
              <p className="text-micro uppercase tracking-widest mt-0.5" style={{ color: '#F97316' }}>Employee Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-600 truncate max-w-[100px]" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Employee'}</p>
              <p className="text-micro" style={{ color: 'var(--text-tertiary)' }}>{user?.department || 'CRA'}</p>
            </div>
            <button onClick={handleLogout}
              className="p-2.5 rounded-xl transition-colors"
              style={{ color: 'var(--text-tertiary)', border: '1px solid var(--border-0)', background: 'transparent', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
              title="Sign Out">
              <SignOut size={16} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-2 px-5 mt-4">
        {[
          { label: 'Pending', value: pendingCount, color: '#FBBF24' },
          { label: 'Approved', value: approvedCount, color: '#34D399' },
          { label: 'Rejected', value: rejectedCount, color: '#F87171' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-0)' }}>
            <p className="font-700 text-xl" style={{ fontFamily: 'IBM Plex Mono', color }}>{value}</p>
            <p className="text-[10px] font-700 uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* New request CTA */}
      <div className="px-5 mt-4">
        <button onClick={() => setShowNewRequestModal(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display font-600 text-sm transition-all"
          style={{ background: '#F97316', color: '#04060F', fontFamily: 'Space Grotesk', boxShadow: '0 0 24px rgba(249,115,22,0.2)' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 36px rgba(249,115,22,0.35)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 24px rgba(249,115,22,0.2)')}>
          <Plus size={16} weight="bold" /> New Transport Request
        </button>
      </div>

      {/* Requests list */}
      <div className="flex-1 px-5 py-5 space-y-3">
        <p className="text-[11px] font-700 uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>
          My Requests
        </p>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <MapPin size={24} style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-xs font-600" style={{ color: 'var(--text-tertiary)' }}>No transport requests yet</p>
          </div>
        ) : (
          requests.map(request => <RequestCard key={request.id} request={request} />)
        )}
      </div>

      <NewRequestModal isOpen={showNewRequestModal} onClose={() => setShowNewRequestModal(false)} />
    </div>
  );
};

export default EmployeePortalPage;
