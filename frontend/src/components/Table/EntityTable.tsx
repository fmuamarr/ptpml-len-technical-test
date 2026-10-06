import React, { useState, useEffect } from "react";
import type {
  Entity,
  EntityType,
  EntityStatus,
  FilterParams,
} from "../../types/entity";
import DynamicIcon from "../Common/DynamicIcon";
import {
  ChevronRight,
  Compass,
  Edit,
  Filter,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

export interface EntityTableProps {
  entities: Entity[];
  entityTypes: EntityType[];
  isLoading?: boolean;
  selectedEntityId?: string | null;
  filter: FilterParams;
  onFilterChange: (newFilter: FilterParams) => void;
  onFlyTo: (entity: Entity) => void;
  onSelectEntity: (entity: Entity) => void;
  onEditEntity: (entity: Entity) => void;
  onDeleteEntity: (entity: Entity) => void;
  onCreateEntity: () => void;
  onCloseDrawer?: () => void;
  onManageTypes?: () => void;
}

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All Statuses", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Alert", value: "ALERT" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Inactive", value: "INACTIVE" },
];

export const EntityTable: React.FC<EntityTableProps> = ({
  entities,
  entityTypes,
  isLoading = false,
  selectedEntityId,
  filter,
  onFilterChange,
  onFlyTo,
  onSelectEntity,
  onEditEntity,
  onDeleteEntity,
  onCreateEntity,
  onCloseDrawer,
  onManageTypes,
}) => {
  const [searchInput, setSearchInput] = useState(filter.search || "");

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filter.search || "") !== searchInput) {
        onFilterChange({ ...filter, search: searchInput });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filter, onFilterChange]);

  const hasActiveFilters = Boolean(
    (filter.type && filter.type !== "ALL") ||
    (filter.status && filter.status !== "ALL") ||
    (filter.search && filter.search.trim() !== ""),
  );

  const handleResetFilters = () => {
    setSearchInput("");
    onFilterChange({ type: "ALL", status: "ALL", search: "" });
  };

  const getStatusBadge = (status: EntityStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            ACTIVE
          </span>
        );
      case "ALERT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400" />
            ALERT
          </span>
        );
      case "MAINTENANCE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
            MAINTENANCE
          </span>
        );
      case "INACTIVE":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400" />
            INACTIVE
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 select-none transition-colors">
      {/* Top Controls & Industrial Filter Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-extrabold tracking-wider uppercase text-slate-900 dark:text-slate-200">
              Entity Management
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-sky-400 border border-slate-300 dark:border-slate-700 shadow-xs">
              {entities.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onCreateEntity}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Entity</span>
            </button>
            {onCloseDrawer && (
              <button
                type="button"
                onClick={onCloseDrawer}
                title="Minimize sidebar to view full map"
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer group shadow-xs"
              >
                <span className="text-[11px] font-semibold hidden sm:inline">
                  Minimize
                </span>
                <ChevronRight
                  size={14}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            type="text"
            placeholder="Search tracked units by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-white dark:bg-slate-950/70 text-slate-900 dark:text-slate-200 text-xs pl-9 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-900 dark:focus:border-sky-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs font-sans"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Type Dropdown */}
          <div className="relative flex items-center gap-1">
            <select
              value={filter.type || "ALL"}
              onChange={(e) =>
                onFilterChange({ ...filter, type: e.target.value })
              }
              className="w-full min-w-0 bg-white dark:bg-slate-950/70 text-slate-900 dark:text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-900 dark:focus:border-sky-500 cursor-pointer shadow-xs"
            >
              <option value="ALL">All Types</option>
              {entityTypes.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
            {onManageTypes && (
              <button
                type="button"
                onClick={onManageTypes}
                title="Manage Master Entity Types"
                className="p-1.5 text-slate-600 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 bg-white dark:bg-slate-950/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <Layers size={13} />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={filter.status || "ALL"}
              onChange={(e) =>
                onFilterChange({ ...filter, status: e.target.value })
              }
              className="w-full bg-white dark:bg-slate-950/70 text-slate-900 dark:text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-900 dark:focus:border-sky-500 cursor-pointer shadow-xs"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filter indicator if applied */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
            <span className="flex items-center gap-1 font-medium">
              <Filter size={12} className="text-blue-600 dark:text-sky-400" />{" "}
              Active Filters
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-blue-600 dark:text-sky-400 hover:text-blue-800 dark:hover:text-sky-300 font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw size={11} /> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Entity List / Table Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-slate-900 dark:border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Loading entities data...
            </p>
          </div>
        ) : entities.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
              <Search size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-300">
                No entities found
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your search query or filter options."
                  : "No entities registered in the database yet."}
              </p>
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-sky-400 bg-blue-50 dark:bg-sky-950/50 hover:bg-blue-100 dark:hover:bg-sky-900/50 border border-blue-200 dark:border-sky-700/50 rounded-lg cursor-pointer"
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={onCreateEntity}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg cursor-pointer shadow-xs"
              >
                <Plus size={14} /> Add First Entity
              </button>
            )}
          </div>
        ) : (
          entities.map((entity) => {
            const isSelected = selectedEntityId === entity.id;
            const typeColor = entity.type_detail?.color || "#0F172A";
            const iconName = entity.type_detail?.icon || "activity";

            return (
              <div
                key={entity.id}
                onClick={() => onSelectEntity(entity)}
                className={`p-3.5 transition-all cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                  isSelected
                    ? "bg-blue-50/70 dark:bg-sky-950/40 border-l-4 border-l-blue-600 dark:border-l-sky-500 pl-3 shadow-inner"
                    : "bg-white dark:bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Left: Icon & Details */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 shadow-xs"
                      style={{
                        backgroundColor: `${typeColor}15`,
                        borderColor: `${typeColor}50`,
                      }}
                    >
                      <DynamicIcon
                        name={iconName}
                        size={16}
                        color={typeColor}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-900 dark:group-hover:text-white truncate">
                        {entity.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {entity.type_detail?.name || entity.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status badge */}
                  <div className="shrink-0">
                    {getStatusBadge(entity.status)}
                  </div>
                </div>

                {/* Coordinates */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span className="truncate">
                    {entity.latitude.toFixed(5)}°, {entity.longitude.toFixed(5)}
                    °
                  </span>

                  {entity.metadata &&
                    Object.keys(entity.metadata).length > 0 && (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 font-bold shrink-0">
                        {Object.keys(entity.metadata).length} params
                      </span>
                    )}
                </div>

                {/* Telemetry Limiter / Delimited Key-Value Tags */}
                {entity.metadata && Object.keys(entity.metadata).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(entity.metadata)
                      .slice(0, 3)
                      .map(([key, val]) => (
                        <span
                          key={key}
                          className="inline-flex items-center text-[10px] font-mono bg-slate-50 dark:bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {key}:
                          </span>
                          <span className="text-slate-900 dark:text-emerald-400 font-bold ml-1">
                            {typeof val === "object"
                              ? JSON.stringify(val)
                              : String(val)}
                          </span>
                        </span>
                      ))}
                    {Object.keys(entity.metadata).length > 3 && (
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-1.5 py-0.5 rounded">
                        +{Object.keys(entity.metadata).length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons Toolbar */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-1 opacity-90 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFlyTo(entity);
                    }}
                    title="Center map to unit coordinates"
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-sky-400 rounded border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
                  >
                    <Compass size={13} />
                    <span>Fly To</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEntity(entity);
                      }}
                      title="Edit entity"
                      className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded transition-colors cursor-pointer"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEntity(entity);
                      }}
                      title="Delete entity"
                      className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EntityTable;
