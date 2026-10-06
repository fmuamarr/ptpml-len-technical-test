import React, { useMemo, useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import type { Entity, EntityStatus } from '../../types/entity';
import DynamicIcon from '../Common/DynamicIcon';
import {
  Clock,
  Edit,
  MapPin,
  Trash2,
  Zap,
} from 'lucide-react';

interface DynamicMarkerProps {
  entity: Entity;
  isSelected?: boolean;
  onEdit?: (entity: Entity) => void;
  onDelete?: (entity: Entity) => void;
  onSelect?: (entity: Entity) => void;
}

const getStatusColor = (status: EntityStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return '#10B981'; // emerald-500
    case 'ALERT':
      return '#EF4444'; // red-500
    case 'MAINTENANCE':
      return '#F59E0B'; // amber-500
    case 'INACTIVE':
    default:
      return '#64748B'; // slate-500
  }
};

const getStatusBadgeClass = (status: EntityStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30';
    case 'ALERT':
      return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30 animate-pulse';
    case 'MAINTENANCE':
      return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30';
    case 'INACTIVE':
    default:
      return 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-500/30';
  }
};

export const DynamicMarker: React.FC<DynamicMarkerProps> = ({
  entity,
  isSelected = false,
  onEdit,
  onDelete,
  onSelect,
}) => {
  const markerRef = useRef<L.Marker>(null);

  const statusColor = getStatusColor(entity.status);
  const typeColor = entity.type_detail?.color || '#0284c7';
  const iconName = entity.type_detail?.icon || 'activity';

  // Automatically open popup if marker is selected
  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  const customIcon = useMemo(() => {
    const isAlert = entity.status === 'ALERT';

    const iconHtml = renderToString(
      <div
        style={{
          width: '42px',
          height: '42px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Outer pulse animation for ALERT or ACTIVE */}
        {(isAlert || isSelected) && (
          <span
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '9999px',
              backgroundColor: isAlert ? '#EF4444' : '#0ea5e9',
              opacity: 0.35,
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
        )}

        {/* Status ring */}
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '9999px',
            backgroundColor: '#0f172a',
            border: `2px solid ${statusColor}`,
            boxShadow: `0 2px 8px rgba(15, 23, 42, 0.35), 0 0 0 1px ${statusColor}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10,
            transition: 'transform 0.15s ease',
          }}
        >
          {/* Inner type icon */}
          <DynamicIcon name={iconName} size={18} color={typeColor} />

          {/* Tiny status indicator dot */}
          <span
            style={{
              position: 'absolute',
              bottom: '-1px',
              right: '-1px',
              width: '10px',
              height: '10px',
              borderRadius: '9999px',
              backgroundColor: statusColor,
              border: '2px solid #0f172a',
              boxShadow: `0 0 4px ${statusColor}`,
            }}
          />
        </div>

        {/* Selection pointer caret */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              width: '0',
              height: '0',
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '6px solid #0284c7',
            }}
          />
        )}
      </div>
    );

    return L.divIcon({
      html: iconHtml,
      className: 'custom-tactical-marker',
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -24],
    });
  }, [entity.status, iconName, typeColor, statusColor, isSelected]);

  return (
    <Marker
      position={[entity.latitude, entity.longitude]}
      icon={customIcon}
      ref={markerRef}
      eventHandlers={{
        click: () => {
          onSelect?.(entity);
        },
      }}
    >
      <Popup className="tactical-popup" minWidth={280} maxWidth={320}>
        <div className="p-3.5 text-slate-900 dark:text-slate-100 font-sans">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${typeColor}15`,
                  borderColor: `${typeColor}40`,
                }}
              >
                <DynamicIcon name={iconName} size={15} color={typeColor} />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight text-slate-900 dark:text-white line-clamp-1">
                  {entity.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {entity.type_detail?.name || entity.type}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadgeClass(
                entity.status
              )}`}
            >
              {entity.status}
            </span>
          </div>

          {/* Coordinates & Location */}
          <div className="bg-slate-50 dark:bg-slate-900/80 rounded-lg p-2.5 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1 mb-2.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-sky-600 dark:text-sky-400" /> Lat:
              </span>
              <span className="text-slate-900 dark:text-slate-200 font-medium">
                {entity.latitude.toFixed(6)}°
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-sky-600 dark:text-sky-400" /> Long:
              </span>
              <span className="text-slate-900 dark:text-slate-200 font-medium">
                {entity.longitude.toFixed(6)}°
              </span>
            </div>
          </div>

          {/* Metadata / Attributes Section */}
          {entity.metadata && Object.keys(entity.metadata).length > 0 ? (
            <div className="mb-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1.5">
                <Zap size={11} className="text-amber-600 dark:text-amber-400" /> Unit Attributes
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-lg p-2 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5 max-h-28 overflow-y-auto">
                {Object.entries(entity.metadata).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center text-slate-700 dark:text-slate-300 gap-2"
                  >
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px] truncate">
                      {key}:
                    </span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-medium text-[11px] bg-white dark:bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800/80">
                      {typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-3 text-[11px] text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-900/40 rounded-lg p-2 border border-slate-200 dark:border-slate-800/50">
              No unit attributes recorded
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-3 font-mono">
            <span className="flex items-center gap-1">
              <Clock size={10} /> Updated:
            </span>
            <span>{new Date(entity.updated_at).toLocaleTimeString('en-US')}</span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(entity);
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 text-slate-800 dark:text-sky-400 border border-slate-300 dark:border-sky-500/30 rounded-lg transition-all cursor-pointer"
            >
              <Edit size={13} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(entity);
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-lg transition-all cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default DynamicMarker;
