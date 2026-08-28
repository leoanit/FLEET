import React, { useState } from 'react';
import { UserPlus, IdentificationCard, Buildings, Calendar, CheckCircle, XCircle, Clock, Warning } from '@phosphor-icons/react';
import { useEmployeeAccounts, useApproveEmployeeAccount, useRejectEmployeeAccount } from '../hooks/useEmployeeAccounts';
import { EmployeeAccount, EmployeeAccountStatus } from '../types';
import { RejectReasonModal } from '../../../components/ui/RejectReasonModal';

const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="h-7 w-7 rounded-full border-2 animate-spin"
      style={{ borderColor: 'rgba(249,115,22,0.3)', borderTopColor: '#F97316' }} />
    <p className="text-micro" style={{ color: 'var(--text-tertiary)' }}>Loading employee account requests...</p>
  </div>
);

const statusBadge = (status: EmployeeAccountStatus) => {
  const map: Record<EmployeeAccountStatus, { color: string; Icon: React.ElementType }> = {
    pending: { color: '#FBBF24', Icon: Clock },
    approved: { color: '#34D399', Icon: CheckCircle },
    rejected: { color: '#F87171', Icon: XCircle },
  };
  const { color, Icon } = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-700 uppercase tracking-wider"
      style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
      <Icon size={11} weight="bold" />
      {status}
    </span>
  );
};

export const EmployeeAccountsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | EmployeeAccountStatus>('pending');
  const [rejectTarget, setRejectTarget] = useState<EmployeeAccount | null>(null);

  const { data: accounts = [], isLoading, isError } = useEmployeeAccounts(statusFilter === 'all' ? undefined : statusFilter);
  const approveMutation = useApproveEmployeeAccount();
  const rejectMutation = useRejectEmployeeAccount();

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
    } catch (err) {
      console.error('Failed to approve employee account:', err);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      await rejectMutation.mutateAsync({ id: rejectTarget.id, reason });
      setRejectTarget(null);
    } catch (err) {
      console.error('Failed to reject employee account:', err);
    }
  };

  const tabs: { label: string; value: 'all' | EmployeeAccountStatus }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'All', value: 'all' },
  ];

  return (
    <div style={{ fontFamily: 'DM Sans', color: 'var(--text-primary)' }}>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 anim-in">
        <div>
          <div className="badge-live mb-3">
            <UserPlus size={9} weight="fill" /> CRA Access Requests
          </div>
          <h1 className="font-display font-700 text-[1.75rem] leading-tight mb-1"
            style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Employee Accounts
          </h1>
          <p className="text-micro" style={{ color: 'var(--text-secondary)' }}>
            Review and approve CRA employee access requests before they can log in
          </p>
        </div>
      </div>

      <div className="surface-card overflow-hidden anim-in d-200">
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
          {tabs.map(tab => (
            <button key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-700 uppercase tracking-wider transition-all"
              style={statusFilter === tab.value
                ? { background: 'rgba(249,115,22,0.12)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }
                : { background: 'transparent', color: 'var(--text-tertiary)', border: '1px solid transparent' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {isLoading ? (
            <Spinner />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Warning size={28} weight="duotone" style={{ color: '#F87171' }} />
              <p className="text-sm font-600" style={{ color: '#F87171' }}>Failed to load employee accounts</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-12 text-center text-xs font-600" style={{ color: 'var(--text-tertiary)' }}>
              No {statusFilter === 'all' ? '' : statusFilter} employee account requests
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-600 uppercase tracking-widest"
                    style={{ borderBottom: '1px solid var(--border-0)', color: 'var(--text-tertiary)' }}>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(account => (
                    <tr key={account.id} className="transition-colors"
                      style={{ borderBottom: '1px solid var(--border-0)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-600" style={{ color: 'var(--text-primary)' }}>{account.name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-500" style={{ color: 'var(--text-secondary)' }}>{account.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-500" style={{ color: 'var(--text-secondary)' }}>
                          <Buildings size={13} style={{ color: 'var(--text-tertiary)' }} /> {account.department}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-500" style={{ color: 'var(--text-secondary)' }}>
                          <IdentificationCard size={13} style={{ color: 'var(--text-tertiary)' }} /> {account.employeeId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <Calendar size={13} style={{ color: 'var(--text-tertiary)' }} />
                          {new Date(account.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {statusBadge(account.accountStatus)}
                        {account.accountStatus === 'rejected' && account.rejectionReason && (
                          <p className="text-[10px] mt-1 max-w-[180px]" style={{ color: 'var(--text-tertiary)' }}>{account.rejectionReason}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {account.accountStatus === 'pending' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => handleApprove(account.id)}
                              disabled={approveMutation.isPending}
                              className="flex items-center gap-1 px-2.5 h-7 text-[10px] font-700 uppercase tracking-wide rounded transition-all disabled:opacity-50"
                              style={{ background: '#34D399', color: '#04060F' }}
                              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 12px rgba(52,211,153,0.4)')}
                              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                              <CheckCircle size={11} weight="bold" /> Approve
                            </button>
                            <button onClick={() => setRejectTarget(account)}
                              className="flex items-center gap-1 px-2.5 h-7 text-[10px] font-700 uppercase tracking-wide rounded transition-all"
                              style={{ background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <XCircle size={11} weight="bold" /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {rejectTarget && (
        <RejectReasonModal
          title="Reject Access Request"
          message={`Reject the access request from ${rejectTarget.name} (${rejectTarget.email})?`}
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
          isLoading={rejectMutation.isPending}
        />
      )}
    </div>
  );
};
