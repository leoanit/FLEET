import React, { useState } from 'react';
import { Vehicle } from '../types';
import { useGPSStore } from '../../../services/websocket';
import { Truck, MapPin, Gauge, GasPump, PencilSimple, Trash, ArrowRight } from '@phosphor-icons/react';
import { getKenyanTown } from '../../../utils/location';
import { Pagination } from '../../../components/ui/Pagination';

const PAGE_SIZE = 9;

interface VehicleListProps {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onEdit, onDelete, onSelect }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const livePositions = useGPSStore((state) => state.positions);

  const filteredVehicles = vehicles.filter((v) => {
    if (filterStatus === 'all') return true;
    return v.status === filterStatus;
  });

  const totalPages = Math.ceil(filteredVehicles.length / PAGE_SIZE);
  const pageVehicles = filteredVehicles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      active: '#34D399', idle: '#FBBF24', maintenance: '#F87171', offline: '#94A3B8',
    };
    const color = colorMap[status] || '#94A3B8';
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-600 uppercase tracking-wider"
        style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 pb-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
        {['all', 'active', 'idle', 'maintenance', 'offline'].map((status) => (
          <button key={status} onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
            className="rounded-lg px-4 py-1.5 text-xs font-600 uppercase tracking-wider transition-all"
            style={filterStatus === status
              ? { background: '#F97316', color: '#04060F' }
              : { background: 'var(--surface-2)', border: '1px solid var(--border-1)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => filterStatus !== status && (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => filterStatus !== status && (e.currentTarget.style.color = 'var(--text-secondary)')}>
            {status}
          </button>
        ))}
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl p-12 text-center"
          style={{ border: '1px dashed var(--border-1)', background: 'var(--surface-1)' }}>
          <Truck size={40} weight="duotone" style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
          <p className="text-sm font-600" style={{ color: 'var(--text-secondary)' }}>No vehicles in selected filter</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Try resetting the status filter above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pageVehicles.map((vehicle) => {
            const hasLiveUpdate = !!livePositions[vehicle.id];
            const liveSpeed = hasLiveUpdate ? livePositions[vehicle.id].speed : vehicle.telemetry.speed;
            const liveLat = hasLiveUpdate ? livePositions[vehicle.id].latitude : vehicle.telemetry.latitude;
            const liveLng = hasLiveUpdate ? livePositions[vehicle.id].longitude : vehicle.telemetry.longitude;
            const liveFuel = hasLiveUpdate ? livePositions[vehicle.id].fuelLevel : vehicle.telemetry.fuelLevel;
            const liveStatus = hasLiveUpdate ? livePositions[vehicle.id].status : vehicle.status;
            const liveLocationName = hasLiveUpdate ? livePositions[vehicle.id].locationName : vehicle.telemetry.locationName;
            const fuelColor = liveFuel < 20 ? '#F87171' : '#34D399';

            return (
              <div key={vehicle.id} className="surface-card p-5 transition-all duration-200"
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-0)')}>

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-600 text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {vehicle.name}
                    </h4>
                    <p className="text-xs mt-1 font-600" style={{ color: 'var(--text-tertiary)', fontFamily: 'IBM Plex Mono' }}>
                      {vehicle.plateNumber}
                    </p>
                  </div>
                  {getStatusBadge(liveStatus)}
                </div>

                <div className="space-y-3 py-4" style={{ borderTop: '1px solid var(--border-0)', borderBottom: '1px solid var(--border-0)' }}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <Gauge size={14} style={{ color: 'var(--text-tertiary)' }} /> Speed
                    </span>
                    <span className="font-700" style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono' }}>
                      {liveSpeed} <span className="text-[10px] font-400" style={{ color: 'var(--text-tertiary)' }}>kph</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <MapPin size={14} style={{ color: 'var(--text-tertiary)' }} /> GPS Location
                    </span>
                    <span className="font-700" style={{ color: hasLiveUpdate ? '#F97316' : 'var(--text-secondary)' }}>
                      {liveLocationName || getKenyanTown(liveLat, liveLng)}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <GasPump size={14} style={{ color: 'var(--text-tertiary)' }} /> Fuel Level
                      </span>
                      <span className="font-700" style={{ color: fuelColor, fontFamily: 'IBM Plex Mono' }}>
                        {Math.round(liveFuel)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                      <div className={`h-full rounded-full transition-all duration-1000 ${liveFuel < 20 ? 'animate-pulse' : ''}`}
                        style={{ width: `${liveFuel}%`, background: fuelColor }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(vehicle)} title="Edit vehicle"
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--text-tertiary)', border: '1px solid transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#F97316'; e.currentTarget.style.background = 'rgba(249,115,22,0.08)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = 'transparent'; }}>
                      <PencilSimple size={15} />
                    </button>
                    <button onClick={() => onDelete(vehicle.id)} title="Decommission"
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--text-tertiary)', border: '1px solid transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = 'transparent'; }}>
                      <Trash size={15} />
                    </button>
                  </div>
                  <button onClick={() => onSelect(vehicle.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-600 transition-all"
                    style={{ border: '1px solid var(--border-1)', color: 'var(--text-secondary)', background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    Details <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredVehicles.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
