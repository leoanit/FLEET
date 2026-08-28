import React from 'react';
import { Dispatch, Trip } from '../types';
import { Calendar, Compass, Play, Flag, FileText, MapPin } from '@phosphor-icons/react';

interface TripTimelineProps {
  dispatch: Dispatch;
  trip?: Trip | null;
}

export const TripTimeline: React.FC<TripTimelineProps> = ({ dispatch, trip }) => {
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const baseStepsBefore = [
    {
      title: 'Dispatch Order Logged',
      description: `Logistics ledger order registered by dispatcher. Reference sequence ${dispatch.referenceNumber}.`,
      time: formatTime(dispatch.createdAt),
      Icon: FileText,
      active: true,
      nodeColor: '#60A5FA',
    },
    {
      title: 'Scheduled Departure Target',
      description: `Target departure scheduled for route origin at ${dispatch.origin}.`,
      time: formatDateOnly(dispatch.scheduledDate),
      Icon: Calendar,
      active: true,
      nodeColor: '#60A5FA',
    },
    {
      title: 'Active Departure Clearance',
      description: trip
        ? `Asset cleared origin check-in. Operator ${dispatch.driverName || 'Unassigned'} is now in active transit.`
        : 'Awaiting departure trigger. Logistics operator and fleet vehicle must confirm departure clearance.',
      time: trip ? formatTime(trip.startTime) : '',
      Icon: Play,
      active: !!trip,
      nodeColor: trip ? '#34D399' : undefined,
    },
  ];

  const checkpointSteps = (trip?.checkpoints || []).map(cp => ({
    title: `Checkpoint Check-In: ${cp.locationName}`,
    description: `Reported by operator. Odometer: ${cp.odometer?.toLocaleString() || 'N/A'} km | Fuel level: ${cp.fuelLevel || 'N/A'}%`,
    time: formatTime(cp.timestamp),
    Icon: MapPin,
    active: true,
    nodeColor: '#F97316',
  }));

  const baseStepsAfter = [
    {
      title: 'Destination Arrival & Complete',
      description: trip?.endTime
        ? `Delivered check-in at destination hub ${dispatch.destination}. Fleet vehicle and driver released to idle status.`
        : 'Transit route actively being tracked. Arrival logs will generate automatically upon completing the trip.',
      time: trip ? formatTime(trip.endTime) : '',
      Icon: Flag,
      active: !!trip?.endTime,
      nodeColor: trip?.endTime ? '#A78BFA' : undefined,
    },
  ];

  const steps = [...baseStepsBefore, ...checkpointSteps, ...baseStepsAfter];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border-0)' }}>
        <Compass size={16} weight="duotone" style={{ color: '#F97316' }} />
        <span className="font-display font-600 text-sm uppercase tracking-wider"
          style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
          Chronological Lifecycle Timeline
        </span>
      </div>

      <div className="relative pl-6 space-y-6">
        <div className="absolute left-3 top-2 bottom-2 w-px" style={{ background: 'var(--border-0)' }} />
        {steps.map((step, idx) => {
          const { Icon } = step;
          const nodeColor = step.nodeColor || 'var(--text-tertiary)';
          return (
            <div key={idx} className="relative">
              <span className="absolute -left-6 top-1 h-6 w-6 rounded-full flex items-center justify-center z-10"
                style={{
                  background: step.active ? `${nodeColor}15` : 'var(--surface-2)',
                  border: `2px solid ${step.active ? nodeColor : 'var(--border-0)'}`,
                  color: step.active ? nodeColor : 'var(--text-tertiary)',
                }}>
                <Icon size={11} weight="bold" />
              </span>

              <div className="p-4 rounded-xl transition-all duration-200"
                style={{
                  background: step.active ? 'var(--surface-1)' : 'transparent',
                  border: '1px solid var(--border-0)',
                  opacity: step.active ? 1 : 0.5,
                }}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-1.5">
                  <h4 className="text-[11px] font-700 uppercase tracking-wider"
                    style={{ color: step.active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {step.title}
                  </h4>
                  {step.time && (
                    <span className="font-mono text-[10px] font-600 px-2 py-0.5 rounded"
                      style={{ background: 'rgba(249,115,22,0.08)', color: '#F97316', border: '1px solid rgba(249,115,22,0.2)', fontFamily: 'IBM Plex Mono' }}>
                      {step.time}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
