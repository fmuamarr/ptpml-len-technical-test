import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import type { Entity, EntityType } from "../../types/entity";
import DynamicMarker from "./DynamicMarker";
import DynamicIcon from "../Common/DynamicIcon";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Crosshair,
  Layers,
  MapPin,
  Maximize2,
  X,
} from "lucide-react";

// Vite Leaflet default icon fix
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER: [number, number] = [-6.917464, 107.619123]; // Bandung, Indonesia
const DEFAULT_ZOOM = 13;

export type TileStyle = "dark" | "satellite" | "street";

interface TileConfig {
  base: string;
  reference?: string;
  roads?: string;
  attribution: string;
  label: string;
  maxZoom: number;
}

const TILE_LAYERS: Record<TileStyle, TileConfig> = {
  dark: {
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    reference:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    label: "Dark Tactical",
    maxZoom: 16,
  },
  satellite: {
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    reference:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    roads:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP",
    label: "Satellite",
    maxZoom: 19,
  },
  street: {
    base: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    label: "Street View",
    maxZoom: 19,
  },
};

interface FlyToControllerProps {
  target: [number, number] | null;
}

const FlyToController: React.FC<FlyToControllerProps> = ({ target }) => {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo(target, 15, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [target, map]);

  return null;
};

const ResizeHandler: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
};

interface MapEventsProps {
  isPicking: boolean;
  onPick: (lat: number, lng: number) => void;
}

const MapEventsHandler: React.FC<MapEventsProps> = ({ isPicking, onPick }) => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (isPicking) {
      container.style.cursor = "crosshair";
    } else {
      container.style.cursor = "";
    }
  }, [isPicking, map]);

  useMapEvents({
    click(e) {
      if (isPicking) {
        onPick(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
};

// Tactical picked point icon
const pickedPointIcon = L.divIcon({
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <span style="position: absolute; inset: -4px; border-radius: 9999px; background-color: #06b6d4; opacity: 0.5; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
      <div style="width: 24px; height: 24px; border-radius: 9999px; background: #0891b2; border: 2px solid #ffffff; box-shadow: 0 0 15px #06b6d4; display: flex; align-items: center; justify-content: center;">
        <div style="width: 6px; height: 6px; border-radius: 9999px; background: #ffffff;"></div>
      </div>
    </div>
  `,
  className: "picked-coordinate-pin",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export interface MapViewProps {
  entities: Entity[];
  entityTypes?: EntityType[];
  selectedEntityId?: string | null;
  flyToTarget?: [number, number] | null;
  isPickingLocation?: boolean;
  pickedLocation?: [number, number] | null;
  onLocationPicked?: (lat: number, lng: number) => void;
  onCancelPickLocation?: () => void;
  onSelectEntity?: (entity: Entity) => void;
  onEditEntity?: (entity: Entity) => void;
  onDeleteEntity?: (entity: Entity) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  entities,
  entityTypes = [],
  selectedEntityId,
  flyToTarget,
  isPickingLocation = false,
  pickedLocation,
  onLocationPicked,
  onCancelPickLocation,
  onSelectEntity,
  onEditEntity,
  onDeleteEntity,
}) => {
  const [tileStyle, setTileStyle] = useState<TileStyle>("street");
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(true);

  const handleResetView = () => {
    if (mapInstance) {
      mapInstance.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, {
        duration: 1,
      });
    }
  };

  const handleFitAll = () => {
    if (mapInstance && entities.length > 0) {
      const bounds = L.latLngBounds(
        entities.map((e) => [e.latitude, e.longitude] as [number, number]),
      );
      mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  };

  const currentConfig = TILE_LAYERS[tileStyle];

  return (
    <div className="relative w-full h-full bg-slate-100 dark:bg-slate-950 overflow-hidden select-none transition-colors">
      {/* Pick Location Mode Banner (Industrial Alert) */}
      {isPickingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] max-w-md w-[92%] bg-slate-900/95 dark:bg-slate-900/95 text-white border border-slate-700 rounded-lg px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <Crosshair
              className="text-amber-400 shrink-0 animate-spin"
              size={20}
            />
            <div>
              <p className="font-bold text-white tracking-wide">Coordinate Selection Active</p>
              <p className="text-slate-300 text-[11px]">
                Click anywhere on the map grid to acquire target Latitude & Longitude
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelPickLocation}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-2.5 py-1 text-xs rounded border border-slate-600 transition-colors cursor-pointer shrink-0 font-semibold"
          >
            <X size={14} />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Map Control Buttons (Top Right Overlay) */}
      <div className="absolute top-4 right-4 z-[990] flex flex-col gap-2">
        {/* Layer Switcher */}
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-300 dark:border-slate-700/80 rounded-lg p-1 shadow-sm flex items-center gap-1">
          {(Object.keys(TILE_LAYERS) as TileStyle[]).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setTileStyle(style)}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                tileStyle === style
                  ? "bg-slate-900 dark:bg-sky-500 text-white shadow-xs"
                  : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {TILE_LAYERS[style].label}
            </button>
          ))}
        </div>

        {/* Industrial Tactical Actions */}
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-300 dark:border-slate-700/80 rounded-lg p-1 shadow-sm flex flex-col gap-1 self-end">
          <button
            type="button"
            onClick={handleResetView}
            title="Recenter to Bandung Operations Area"
            className="p-2 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <Compass size={18} />
          </button>
          <button
            type="button"
            onClick={handleFitAll}
            title="Fit All Tracked Units"
            className="p-2 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <Maximize2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => setIsLegendOpen((prev) => !prev)}
            title="Toggle Map Legend"
            className={`p-2 rounded transition-colors cursor-pointer ${
              isLegendOpen
                ? "text-blue-900 dark:text-sky-400 bg-blue-50 dark:bg-sky-950/60"
                : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Layers size={18} />
          </button>
        </div>
      </div>

      {/* Floating Tactical Map Legend */}
      <div className="absolute top-20 left-4 z-[990] max-w-xs transition-all duration-300">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-300 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden">
          {/* Legend Header */}
          <button
            type="button"
            onClick={() => setIsLegendOpen((prev) => !prev)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-slate-800 dark:text-sky-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-200 tracking-wide uppercase">
                Map Legend
              </span>
            </div>
            {isLegendOpen ? (
              <ChevronUp size={14} className="text-slate-500 dark:text-slate-400" />
            ) : (
              <ChevronDown size={14} className="text-slate-500 dark:text-slate-400" />
            )}
          </button>

          {/* Legend Body */}
          {isLegendOpen && (
            <div className="p-3 space-y-3 text-xs max-h-[60vh] overflow-y-auto">
              {/* Entity Types Section */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Entity Types
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {entityTypes.length > 0 ? (
                    entityTypes.map((type) => (
                      <div
                        key={type.code}
                        className="flex items-center gap-2 px-2 py-1 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800"
                      >
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: `${type.color}15`,
                            borderColor: `${type.color}50`,
                          }}
                        >
                          <DynamicIcon
                            name={type.icon}
                            size={12}
                            color={type.color}
                          />
                        </div>
                        <span className="text-[11px] text-slate-900 dark:text-slate-200 truncate font-semibold">
                          {type.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono ml-auto font-bold">
                          {type.code}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">
                      Loading entity categories...
                    </p>
                  )}
                </div>
              </div>

              {/* Status Indicators Section */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Operational Status
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-medium">
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-xs" />
                    <span>Active</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                    <span>Alert</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shadow-xs" />
                    <span>Maintenance</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <span>Inactive</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Overlay Badge (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-[990] pointer-events-none">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-300 dark:border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-400 shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
          <span>
            <strong className="text-slate-900 dark:text-white font-bold">{entities.length}</strong> Units Mapped
          </span>
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full z-0"
        ref={setMapInstance}
        zoomControl={true}
      >
        {/* Base Layer */}
        <TileLayer
          key={`${tileStyle}-base`}
          url={currentConfig.base}
          attribution={currentConfig.attribution}
          maxZoom={currentConfig.maxZoom}
        />

        {/* Labels & Places Overlay (Shows Area Names, Districts, and Cities) */}
        {currentConfig.reference && (
          <TileLayer
            key={`${tileStyle}-ref`}
            url={currentConfig.reference}
            attribution=""
            maxZoom={currentConfig.maxZoom}
          />
        )}

        {/* Roads Overlay (For Satellite view) */}
        {currentConfig.roads && (
          <TileLayer
            key={`${tileStyle}-roads`}
            url={currentConfig.roads}
            attribution=""
            maxZoom={currentConfig.maxZoom}
          />
        )}

        <FlyToController target={flyToTarget || null} />
        <ResizeHandler />

        <MapEventsHandler
          isPicking={isPickingLocation}
          onPick={(lat, lng) => onLocationPicked?.(lat, lng)}
        />

        {/* Temporary Marker for Picked Location in Form */}
        {pickedLocation && (
          <Marker position={pickedLocation} icon={pickedPointIcon}>
            <Popup className="tactical-popup">
              <div className="p-2 text-xs font-mono text-cyan-300">
                <p className="font-bold text-white flex items-center gap-1">
                  <MapPin size={12} className="text-cyan-400" /> Selected
                  Coordinates
                </p>
                <p className="mt-1">
                  {pickedLocation[0].toFixed(6)}, {pickedLocation[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Entity Dynamic Markers */}
        {entities.map((entity) => (
          <DynamicMarker
            key={entity.id}
            entity={entity}
            isSelected={selectedEntityId === entity.id}
            onSelect={onSelectEntity}
            onEdit={onEditEntity}
            onDelete={onDeleteEntity}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
