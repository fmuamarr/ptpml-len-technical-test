import React from "react";
import {
  Layers,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Radio,
  RefreshCw,
  ShieldAlert,
  Sun,
  Wrench,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { API_BASE_URL } from "../../api/client";

export interface HeaderProps {
  stats: {
    total: number;
    active: number;
    alert: number;
    maintenance: number;
  };
  isServerHealthy: boolean;
  isCheckingHealth: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onCreateClick?: () => void;
  isDrawerOpen?: boolean;
  onToggleDrawer?: () => void;
  onOpenEntityTypes?: () => void;
  entityTypesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  isServerHealthy,
  isCheckingHealth,
  isRefreshing,
  onRefresh,
  isDrawerOpen,
  onToggleDrawer,
  onOpenEntityTypes,
  entityTypesCount,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 select-none transition-colors">
      {/* Left: Industrial Branding & Identification */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 flex items-center justify-center text-white dark:text-sky-400 shadow-sm">
          <Radio size={19} className="animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-wide">
              Geospatial Entities
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            PT PML &bull; PT Len Innovation Technology &bull; Technical Test -
            Fadillah Muamar
          </p>
        </div>
      </div>

      {/* Center: Live Telemetry Quick Stats (Precision Industrial Meters) */}
      <div className="hidden lg:flex items-center gap-2 xl:gap-3 bg-slate-50 dark:bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Total */}
        <div className="flex items-center gap-1.5 px-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Total:
          </span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {stats.total}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Active Units */}
        <div className="flex items-center gap-1.5 px-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600 shadow-xs" />
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Active:
          </span>
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
            {stats.active}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Alert Units */}
        <div className="flex items-center gap-1.5 px-2 text-xs">
          <ShieldAlert size={14} className="text-red-600 dark:text-red-400" />
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Alert:
          </span>
          <span className="font-mono font-bold text-red-700 dark:text-red-400">
            {stats.alert}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Maintenance Units */}
        <div className="flex items-center gap-1.5 px-2 text-xs">
          <Wrench size={13} className="text-amber-600 dark:text-amber-400" />
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Maint:
          </span>
          <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
            {stats.maintenance}
          </span>
        </div>
      </div>

      {/* Right: Operational Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Server Status Pill */}
        <div
          title={
            isServerHealthy
              ? `Backend API online${API_BASE_URL ? ` (${API_BASE_URL})` : ""}`
              : "Backend API offline or unreachable"
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-colors ${
            isServerHealthy
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
              : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-500/30"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isServerHealthy
                ? "bg-emerald-600 dark:bg-emerald-400 animate-pulse"
                : "bg-red-600 dark:bg-red-400"
            }`}
          />
          <span className="hidden sm:inline font-semibold">
            {isCheckingHealth
              ? "PINGING..."
              : isServerHealthy
                ? "ONLINE"
                : "OFFLINE"}
          </span>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Operations Data"
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
        >
          <RefreshCw
            size={16}
            className={
              isRefreshing ? "animate-spin text-blue-600 dark:text-sky-400" : ""
            }
          />
        </button>

        {/* Master Entity Types Button */}
        {onOpenEntityTypes && (
          <button
            type="button"
            onClick={onOpenEntityTypes}
            title="Manage Master Entity Types"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
          >
            <Layers size={15} className="text-slate-700 dark:text-amber-400" />
            <span className="text-xs font-semibold hidden sm:inline">
              Entity Types
            </span>
            {entityTypesCount !== undefined && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-sky-400 rounded border border-slate-300 dark:border-slate-700 font-bold">
                {entityTypesCount}
              </span>
            )}
          </button>
        )}

        {/* Dual Theme Toggle (L / Night Ops) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={
            theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"
          }
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
        >
          {theme === "light" ? (
            <Moon size={15} className="text-slate-700" />
          ) : (
            <Sun size={15} className="text-amber-400" />
          )}
          <span className="text-xs font-semibold hidden md:inline">
            {theme === "light" ? "Dark" : "Light"}
          </span>
        </button>

        {/* Drawer Toggle Button */}
        {onToggleDrawer && (
          <button
            type="button"
            onClick={onToggleDrawer}
            title={
              isDrawerOpen
                ? "Minimize sidebar (view full map)"
                : "Open entity management sidebar"
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer shadow-xs ${
              isDrawerOpen
                ? "text-blue-900 dark:text-sky-400 bg-blue-50 dark:bg-sky-950/60 border-blue-300 dark:border-sky-600/40"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-800"
            }`}
          >
            {isDrawerOpen ? (
              <>
                <PanelRightClose size={16} />
                <span className="text-xs font-semibold hidden xl:inline">
                  Minimize
                </span>
              </>
            ) : (
              <>
                <PanelRightOpen size={16} />
                <span className="text-xs font-semibold hidden xl:inline">
                  Entities
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
