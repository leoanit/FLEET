import React, { useState } from 'react';
import { ClipboardText, Clock, CheckCircle, XCircle, Warning } from '@phosphor-icons/react';
import { useTransportRequests, useRejectTransportRequest } from '../hooks/useTransportRequests';
import { RequestsTable } from '../components/RequestsTable';
import { ApproveRequestModal } from '../components/ApproveRequestModal';
import { RejectReasonModal } from '../../../components/ui/RejectReasonModal';
import { TransportRequest } from '../types';

const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="h-7 w-7 rounded-full border-2 animate-spin"
      style={{ borderColor: 'rgba(249,115,22,0.3)', borderTopColor: '#F97316' }} />
    <p className="text-micro" style={{ color: 'var(--text-tertiary)' }}>Loading transport requests...</p>
  </div>
);

export const TransportRequestsPage: React.FC = () => {
  const [approveTarget, setApproveTarget] = useState<TransportRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<TransportRequest | null>(null);

  const { data: requests = [], isLoading, isError } = useTransportRequests();
  const rejectMutation = useRejectTransportRequest();

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      await rejectMutation.mutateAsync({ id: rejectTarget.id, reason });
      setRejectTarget(null);
    } catch (err) {
      console.error('Failed to reject transport request:', err);
    }
  };

  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

  const kpis = [
    { label: 'Total Requests', value: totalCount,    Icon: ClipboardText, color: '#F97316' },
    { label: 'Pending Review', value: pendingCount,  Icon: Clock,         color: '#FBBF24' },
    { label: 'Approved',       value: approvedCount, Icon: CheckCircle,   color: '#34D399' },
    { label: 'Rejected',       value: rejectedCount, Icon: XCircle,       color: '#F87171' },
  ];

  return (
    <div style={{ fontFamily: 'DM Sans', color: 'var(--text-primary)' }}>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 anim-in">
        <div>
          <div className="badge-live mb-3">
            <ClipboardText size={9} weight="fill" /> Employee Transport Requests
          </div>
          <h1 className="font-display font-700 text-[1.75rem] leading-tight mb-1"
            style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Transport Request Queue
          </h1>
          <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
            Review employee errand/meeting requests and allocate drivers & vehicles
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
        {kpis.map(({ label, value, Icon, color }, i) => (
          <div key={label} className={`surface-card p-5 flex items-center justify-between anim-in d-${Math.min((i + 1) * 100, 500)}`}>
            <div>
              <p className="text-micro mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              <p className="font-700 text-2xl" style={{ fontFamily: 'IBM Plex Mono', color: i === 0 ? 'var(--text-primary)' : color }}>
                {value}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
              <Icon size={20} weight="duotone" style={{ color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="surface-card overflow-hidden anim-in d-300">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ClipboardText size={15} weight="duotone" style={{ color: '#F97316' }} />
              <span className="font-display font-600 text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                Request Registry
              </span>
            </div>
            <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
              Approve to assign a driver & vehicle, or reject with a reason
            </p>
          </div>
          <span className="font-mono text-[11px] font-600 px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(249,115,22,0.08)', color: '#F97316', border: '1px solid rgba(249,115,22,0.2)', fontFamily: 'IBM Plex Mono' }}>
            {requests.length} requests
          </span>
        </div>

        <div className="p-5">
          {isLoading ? <Spinner /> : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Warning size={28} weight="duotone" style={{ color: '#F87171' }} />
              <p className="text-sm font-600" style={{ color: '#F87171' }}>Failed to load transport requests</p>
            </div>
          ) : (
            <RequestsTable
              requests={requests}
              onApprove={setApproveTarget}
              onReject={setRejectTarget}
            />
          )}
        </div>
      </div>

      <ApproveRequestModal
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        request={approveTarget}
      />

      {rejectTarget && (
        <RejectReasonModal
          title="Reject Transport Request"
          message={`Reject the request from ${rejectTarget.requesterName} (${rejectTarget.origin} → ${rejectTarget.destination})?`}
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
          isLoading={rejectMutation.isPending}
        />
      )}
    </div>
  );
};
