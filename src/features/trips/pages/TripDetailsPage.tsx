import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, User, Truck, Calendar, Clock, FileText,
  Pulse, Trophy, TrendUp, Gauge, Star, PencilSimple, Compass,
} from '@phosphor-icons/react';
import { TripTimeline } from '../components/TripTimeline';
import { DispatchFormModal } from '../components/DispatchFormModal';
import { useDispatchDetails, useTripDetails, useUpdateDispatch } from '../hooks/useTrips';
import { useDriverDetails } from '../../drivers/hooks/useDrivers';
import { useVehicleDetails } from '../../vehicles/hooks/useVehicles';

export const TripDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatchId = id || '';

  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: dispatchData, isLoading: isLoadingDispatch, refetch: refetchDispatch } = useDispatchDetails(dispatchId);
  const { data: tripData, isLoading: isLoadingTrip, refetch: refetchTrip } = useTripDetails(dispatchId);
  const updateDispatchMutation = useUpdateDispatch();

  const dispatch = dispatchData || tripData?.dispatch;
  const trip = tripData;

  const driverId = dispatch?.driverId || '';
  const { data: driver } = useDriverDetails(driverId);
  const vehicleId = dispatch?.vehicleId || '';
  const { data: vehicle } = useVehicleDetails(vehicleId);

  const handleEditSubmit = async (input: {
    origin: string;
    destination: string;
    scheduledDate: string;
    notes?: string;
    driverId?: string;
    vehicleId?: string;
  }) => {
    if (!dispatch) return;
    try {
      await updateDispatchMutation.mutateAsync({ id: dispatch.id, data: input });
      setIsFormOpen(false);
      refetchDispatch();
      refetchTrip();
    } catch (err) {
      console.error('Failed to update dispatch parameters:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; pulse?: boolean }> = {
      Pending:       { color: '#94A3B8' },
      Assigned:      { color: '#60A5FA' },
      'In Progress': { color: '#34D399', pulse: true },
      Completed:     { color: '#A78BFA' },
      Cancelled:     { color: '#F87171' },
    };
    const { color, pulse } = map[status] || { color: '#94A3B8' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-700 uppercase tracking-wider ${pulse ? 'animate-pulse' : ''}`}
        style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        {status}
      </span>
    );
  };

  const isLoading = isLoadingDispatch || (isLoadingTrip && !tripData);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="h-8 w-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--border-1)', borderTopColor: '#F97316' }} />
        <p className="text-xs font-600 uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
          Retrieving operational telemetry...
        </p>
      </div>
    );
  }

  if (!dispatch) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="surface-card text-center p-10 max-w-md space-y-4">
          <p className="font-700 text-sm" style={{ color: '#F87171' }}>Logistics record could not be located.</p>
          <button onClick={() => navigate('/trips')}
            className="px-4 py-2 rounded-lg text-xs font-700 transition-all"
            style={{ background: '#F97316', color: '#04060F' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(249,115,22,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
            Return to Dispatch Desk
          </button>
        </div>
      </div>
    );
  }

  const avgKmL = trip && trip.fuelUsed > 0 ? (trip.distance / trip.fuelUsed).toFixed(1) : '0.0';

  const metricCards = [
    {
      label: 'Duration',
      value: trip?.status === 'Completed' ? `${trip.duration} min` : 'Live',
      Icon: Clock, color: '#60A5FA',
    },
    {
      label: 'Distance',
      value: trip?.status === 'Completed' ? `${trip?.distance.toFixed(1)} km` : 'Accumulating',
      Icon: TrendUp, color: '#34D399',
    },
    {
      label: 'Fuel Used',
      value: trip?.status === 'Completed' ? `${trip?.fuelUsed.toFixed(1)} L` : 'Calculating',
      Icon: Gauge, color: '#F87171',
    },
    {
      label: 'Efficiency',
      value: trip?.status === 'Completed' ? `${avgKmL} km/L` : 'Pending',
      Icon: Pulse, color: '#A78BFA',
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5"
        style={{ borderBottom: '1px solid var(--border-0)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            style={{ border: '1px solid var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-1)'; }}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-700" style={{ fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
                {dispatch.referenceNumber}
              </h1>
              {getStatusBadge(dispatch.status)}
            </div>
            <p className="text-[10px] font-600 uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Logistics & route telemetry analysis
            </p>
          </div>
        </div>

        {!['Completed', 'Cancelled'].includes(dispatch.status) && (
          <button onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-700 transition-all"
            style={{ border: '1px solid var(--border-1)', background: 'var(--surface-1)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F97316'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-1)'; }}>
            <PencilSimple size={14} /> Modify Route
          </button>
        )}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT: Route + Telemetry + Timeline */}
        <div className="lg:col-span-2 space-y-6">

          {/* ROUTE SPECS */}
          <div className="surface-card p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <Compass size={14} weight="duotone" style={{ color: '#F97316' }} />
              <span className="text-xs font-700 uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Dispatch & Route Specs
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <MapPin size={15} weight="duotone" style={{ color: '#60A5FA', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <span className="text-[10px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                    Origin Terminal
                  </span>
                  <span className="text-sm font-700 mt-0.5 block" style={{ color: 'var(--text-primary)' }}>
                    {dispatch.origin}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={15} weight="duotone" style={{ color: '#F87171', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <span className="text-[10px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                    Destination Hub
                  </span>
                  <span className="text-sm font-700 mt-0.5 block" style={{ color: 'var(--text-primary)' }}>
                    {dispatch.destination}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4" style={{ borderTop: '1px solid var(--border-0)' }}>
              <div className="flex items-center gap-3">
                <Calendar size={15} weight="duotone" style={{ color: '#F97316', flexShrink: 0 }} />
                <div>
                  <span className="text-[10px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                    Scheduled Date
                  </span>
                  <span className="text-xs font-600 mt-0.5 block" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(dispatch.scheduledDate).toLocaleDateString(undefined, {
                      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={15} weight="duotone" style={{ color: '#A78BFA', flexShrink: 0 }} />
                <div>
                  <span className="text-[10px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                    Registered At
                  </span>
                  <span className="text-xs font-600 mt-0.5 block" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(dispatch.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {dispatch.notes && (
              <div className="pt-4" style={{ borderTop: '1px solid var(--border-0)' }}>
                <span className="flex items-center gap-1.5 text-[10px] font-700 uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-tertiary)' }}>
                  <FileText size={12} style={{ color: '#F97316' }} /> Dispatch Notes
                </span>
                <p className="text-xs leading-relaxed p-3 rounded-lg"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-0)' }}>
                  {dispatch.notes}
                </p>
              </div>
            )}
          </div>

          {/* TELEMETRY METRICS */}
          {trip && (
            <div className="surface-card p-6 space-y-5">
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border-0)' }}>
                <div className="flex items-center gap-2">
                  <Pulse size={14} weight="duotone" style={{ color: '#F97316' }} />
                  <span className="text-xs font-700 uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                    Logistics Telemetry
                  </span>
                </div>
                {trip.status === 'In Progress' && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-700 uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse"
                    style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399' }}>
                    Live Stream
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {metricCards.map(({ label, value, Icon, color }) => (
                  <div key={label} className="p-4 rounded-xl"
                    style={{ background: 'var(--surface-2)', border: `1px solid ${color}20` }}>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center mb-3"
                      style={{ background: `${color}12` }}>
                      <Icon size={16} weight="duotone" style={{ color }} />
                    </div>
                    <span className="text-[9px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                      {label}
                    </span>
                    <span className="font-700 text-base mt-1 block" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {trip.status === 'Completed' && (
                <div className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
                  <Trophy size={18} weight="duotone" style={{ color: '#A78BFA', flexShrink: 0, marginTop: 1 }} />
                  <div className="text-xs">
                    <span className="font-700 block" style={{ color: 'var(--text-primary)' }}>Telemetry Score Confirmed</span>
                    <p className="mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Average fuel efficiency of{' '}
                      <strong style={{ color: '#A78BFA' }}>{avgKmL} km/L</strong> logged over{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>{trip.distance} km</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TIMELINE */}
          <div className="surface-card p-6">
            <TripTimeline dispatch={dispatch} trip={trip} />
          </div>
        </div>

        {/* RIGHT: Driver + Vehicle */}
        <div className="space-y-6">

          {/* DRIVER PROFILE */}
          <div className="surface-card p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <User size={14} weight="duotone" style={{ color: '#F97316' }} />
              <span className="text-xs font-700 uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Allocated Operator
              </span>
            </div>

            {driver ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-700 text-sm flex-shrink-0"
                    style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316' }}>
                    {driver.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-700" style={{ color: 'var(--text-primary)' }}>{driver.name}</h4>
                    <span className="text-[10px] font-600 uppercase block mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      CDL {driver.compliance.licenseClass}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                    <span className="text-[9px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                      License ID
                    </span>
                    <span className="text-xs font-700 mt-0.5 block" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }}>
                      {driver.compliance.licenseNumber}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                    <span className="text-[9px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                      Safety Score
                    </span>
                    <span className="flex items-center gap-1 text-xs font-700 mt-0.5" style={{ color: '#FBBF24' }}>
                      <Star size={12} weight="fill" /> {driver.performance.safetyScore} / 100
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-2" style={{ borderTop: '1px solid var(--border-0)' }}>
                  {[
                    { label: 'Email', value: driver.email },
                    { label: 'Contact', value: driver.phone },
                    { label: 'Licence Expiry', value: new Date(driver.compliance.licenseExpiry).toLocaleDateString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span style={{ color: 'var(--text-tertiary)' }}>{label}:</span>
                      <span className="font-600" style={{ color: 'var(--text-secondary)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : dispatch.driverId ? (
              <p className="text-xs animate-pulse font-600" style={{ color: 'var(--text-tertiary)' }}>
                Querying operator file...
              </p>
            ) : (
              <div className="text-center py-6 text-xs font-600 rounded-xl"
                style={{ border: '1px dashed var(--border-1)', color: 'var(--text-tertiary)' }}>
                Awaiting operator allocation
              </div>
            )}
          </div>

          {/* VEHICLE ASSET */}
          <div className="surface-card p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border-0)' }}>
              <Truck size={14} weight="duotone" style={{ color: '#F97316' }} />
              <span className="text-xs font-700 uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Fleet Vehicle Asset
              </span>
            </div>

            {vehicle ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                    <Truck size={18} weight="duotone" style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-700" style={{ color: 'var(--text-primary)' }}>{vehicle.name}</h4>
                    <span className="text-[10px] font-600 uppercase block mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                    <span className="text-[9px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                      Plate
                    </span>
                    <span className="text-xs font-700 mt-0.5 block" style={{ color: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }}>
                      {vehicle.plateNumber}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)' }}>
                    <span className="text-[9px] font-700 uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                      Type
                    </span>
                    <span className="text-xs font-700 uppercase mt-0.5 block" style={{ color: 'var(--text-secondary)' }}>
                      {vehicle.type}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-2" style={{ borderTop: '1px solid var(--border-0)' }}>
                  {[
                    { label: 'Status', value: vehicle.status.toUpperCase() },
                    { label: 'Fuel Level', value: `${vehicle.telemetry.fuelLevel}%` },
                    { label: 'Odometer', value: `${vehicle.telemetry.odometer.toLocaleString()} km` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span style={{ color: 'var(--text-tertiary)' }}>{label}:</span>
                      <span className="font-600" style={{ color: 'var(--text-secondary)', fontFamily: label === 'Odometer' ? 'IBM Plex Mono' : undefined }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : dispatch.vehicleId ? (
              <p className="text-xs animate-pulse font-600" style={{ color: 'var(--text-tertiary)' }}>
                Querying vehicle records...
              </p>
            ) : (
              <div className="text-center py-6 text-xs font-600 rounded-xl"
                style={{ border: '1px dashed var(--border-1)', color: 'var(--text-tertiary)' }}>
                Awaiting fleet asset allocation
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <DispatchFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleEditSubmit}
        dispatch={dispatch}
        isLoading={updateDispatchMutation.isPending}
      />
    </div>
  );
};
