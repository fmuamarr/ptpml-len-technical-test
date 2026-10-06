import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  Entity,
  EntityType,
  EntityPayloadDTO,
  EntityStatus,
} from '../../types/entity';
import DynamicIcon from '../Common/DynamicIcon';
import {
  AlertCircle,
  Crosshair,
  Loader2,
  Plus,
  Save,
  Sliders,
  Trash2,
  X,
} from 'lucide-react';

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Entity name is required')
    .max(100, 'Name must be at most 100 characters'),
  type: z.string().min(1, 'Entity type is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'ALERT'] as const, {
    message: 'Operational status is required',
  }),
  latitude: z
    .number({ message: 'Latitude must be a valid number' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number({ message: 'Longitude must be a valid number' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
});

type FormValues = z.infer<typeof formSchema>;

interface AttributeEntry {
  id: string;
  key: string;
  value: string;
}

export interface EntityModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: Entity | null;
  entityTypes: EntityType[];
  isLoading?: boolean;
  pickedCoordinates?: [number, number] | null;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (dto: EntityPayloadDTO) => Promise<void>;
  onStartPickLocation: () => void;
  onManageTypes?: () => void;
}

// Helper to convert Record to AttributeEntries
const recordToEntries = (obj: Record<string, unknown> | null): AttributeEntry[] => {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([key, val], idx) => ({
    id: `${Date.now()}-${idx}-${key}`,
    key,
    value: typeof val === 'object' ? JSON.stringify(val) : String(val),
  }));
};

const EntityModalContent: React.FC<EntityModalProps> = ({
  mode,
  initialData,
  entityTypes,
  isLoading = false,
  pickedCoordinates,
  serverError,
  onClose,
  onSubmit,
  onStartPickLocation,
  onManageTypes,
}) => {
  const [attributeEntries, setAttributeEntries] = useState<AttributeEntry[]>(() => {
    if (mode === 'edit' && initialData) {
      return recordToEntries(initialData.metadata);
    }
    return [];
  });

  const defaultValues: FormValues = {
    name: mode === 'edit' && initialData ? initialData.name : '',
    type: mode === 'edit' && initialData ? initialData.type : (entityTypes[0]?.code ?? 'VEHICLE'),
    status: mode === 'edit' && initialData ? ((initialData.status as EntityStatus) || 'ACTIVE') : 'ACTIVE',
    latitude: pickedCoordinates ? pickedCoordinates[0] : (mode === 'edit' && initialData ? initialData.latitude : -6.917464),
    longitude: pickedCoordinates ? pickedCoordinates[1] : (mode === 'edit' && initialData ? initialData.longitude : 107.619123),
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const selectedType = useWatch({ control, name: 'type' });
  const typeObj = entityTypes.find((t) => t.code === selectedType);

  // Sync picked coordinates from map
  useEffect(() => {
    if (pickedCoordinates) {
      setValue('latitude', Number(pickedCoordinates[0].toFixed(6)));
      setValue('longitude', Number(pickedCoordinates[1].toFixed(6)));
    }
  }, [pickedCoordinates, setValue]);

  // Attribute Row handlers
  const handleAddEntry = (keyName = '', defaultValue = '') => {
    setAttributeEntries((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, key: keyName, value: defaultValue },
    ]);
  };

  const handleUpdateEntry = (id: string, field: 'key' | 'value', val: string) => {
    setAttributeEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveEntry = (id: string) => {
    setAttributeEntries((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFormSubmit = async (values: FormValues) => {
    // Build metadata payload from attribute entries
    let metadata: Record<string, unknown> | null = null;
    if (attributeEntries.length > 0) {
      const obj: Record<string, unknown> = {};
      for (const item of attributeEntries) {
        const trimmedKey = item.key.trim();
        if (!trimmedKey) continue;
        const trimmedVal = item.value.trim();

        // Convert common data types automatically for the backend
        if (trimmedVal === 'true') {
          obj[trimmedKey] = true;
        } else if (trimmedVal === 'false') {
          obj[trimmedKey] = false;
        } else if (trimmedVal === 'null') {
          obj[trimmedKey] = null;
        } else if (!isNaN(Number(trimmedVal)) && trimmedVal !== '') {
          obj[trimmedKey] = Number(trimmedVal);
        } else {
          obj[trimmedKey] = trimmedVal;
        }
      }
      if (Object.keys(obj).length > 0) {
        metadata = obj;
      }
    }

    const payload: EntityPayloadDTO = {
      name: values.name.trim(),
      type: values.type,
      status: values.status,
      latitude: values.latitude,
      longitude: values.longitude,
      metadata,
    };

    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: `${typeObj?.color || '#0284c7'}15`,
                borderColor: `${typeObj?.color || '#0284c7'}40`,
              }}
            >
              <DynamicIcon
                name={typeObj?.icon || 'activity'}
                size={18}
                color={typeObj?.color || '#0284c7'}
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {mode === 'create' ? 'Create New Entity' : 'Edit Entity Details'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure geospatial coordinates and operational attributes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="p-6 overflow-y-auto space-y-4 text-xs font-sans flex-1"
        >
          {/* Server Error Banner */}
          {serverError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-500/50 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200">Error Occurred</p>
                <p className="mt-0.5 text-red-700 dark:text-red-300/90 leading-relaxed">
                  {serverError}
                </p>
              </div>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 dark:text-slate-300 font-semibold">
              Entity Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Tactical Patrol 01 / Recon Drone"
              {...register('name')}
              className="w-full bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-500 focus:border-slate-900 dark:focus:border-sky-500 transition-colors placeholder:text-slate-400"
            />
            {errors.name && (
              <p className="text-red-600 dark:text-red-400 text-[11px] font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Type & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Type */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                  Entity Type <span className="text-red-500">*</span>
                </label>
                {onManageTypes && (
                  <button
                    type="button"
                    onClick={onManageTypes}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold transition-colors cursor-pointer"
                  >
                    Manage Types
                  </button>
                )}
              </div>
              <select
                {...register('type')}
                className="w-full bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-500 focus:border-slate-900 dark:focus:border-sky-500 transition-colors cursor-pointer"
              >
                {entityTypes.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-red-600 dark:text-red-400 text-[11px] font-medium">
                  {errors.type.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                Operational Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register('status')}
                className="w-full bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-500 focus:border-slate-900 dark:focus:border-sky-500 transition-colors cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE (Operational)</option>
                <option value="ALERT">ALERT (Critical / Emergency)</option>
                <option value="MAINTENANCE">MAINTENANCE (Servicing)</option>
                <option value="INACTIVE">INACTIVE (Offline)</option>
              </select>
              {errors.status && (
                <p className="text-red-600 dark:text-red-400 text-[11px] font-medium">
                  {errors.status.message}
                </p>
              )}
            </div>
          </div>

          {/* Coordinates Header & Pick from Map Button */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">
                Geospatial Coordinates <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={onStartPickLocation}
                className="flex items-center gap-1.5 text-xs text-sky-700 dark:text-cyan-400 hover:text-sky-800 dark:hover:text-cyan-300 bg-sky-50 dark:bg-cyan-950/50 hover:bg-sky-100 dark:hover:bg-cyan-900/50 border border-sky-300 dark:border-cyan-500/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-medium"
              >
                <Crosshair size={13} />
                <span>Pick from Map</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Latitude */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Latitude (-90 to 90)
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="-6.917464"
                  {...register('latitude', { valueAsNumber: true })}
                  className="w-full bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white font-mono px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-500 focus:border-slate-900 dark:focus:border-sky-500 transition-colors"
                />
                {errors.latitude && (
                  <p className="text-red-600 dark:text-red-400 text-[11px] font-medium">
                    {errors.latitude.message}
                  </p>
                )}
              </div>

              {/* Longitude */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Longitude (-180 to 180)
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="107.619123"
                  {...register('longitude', { valueAsNumber: true })}
                  className="w-full bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white font-mono px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-500 focus:border-slate-900 dark:focus:border-sky-500 transition-colors"
                />
                {errors.longitude && (
                  <p className="text-red-600 dark:text-red-400 text-[11px] font-medium">
                    {errors.longitude.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* User-Friendly Unit Attributes (Key-Value Builder without any JSON jargon) */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                  <Sliders size={14} className="text-amber-600 dark:text-amber-400" />
                  <span>Unit Attributes & Parameters</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Custom specifications for this unit (optional)
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddEntry()}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-sky-400 dark:hover:text-sky-300 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Attribute</span>
              </button>
            </div>

            {/* Rows container */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 max-h-48 overflow-y-auto">
              {attributeEntries.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-xs italic">
                  No attributes added yet. Click &quot;+ Add Attribute&quot; to specify parameters if needed.
                </div>
              ) : (
                attributeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-2 bg-white dark:bg-slate-900/90 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-xs"
                  >
                    {/* Key */}
                    <input
                      type="text"
                      placeholder="Attribute Name (e.g. Speed, Fuel)"
                      value={entry.key}
                      onChange={(e) =>
                        handleUpdateEntry(entry.id, 'key', e.target.value)
                      }
                      className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-[11px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-900 dark:focus:border-sky-500"
                    />

                    {/* Delimiter colon badge */}
                    <span className="text-slate-400 dark:text-slate-500 font-bold px-1 select-none">
                      :
                    </span>

                    {/* Value */}
                    <input
                      type="text"
                      placeholder="Value (e.g. 60, Full, Online)"
                      value={entry.value}
                      onChange={(e) =>
                        handleUpdateEntry(entry.id, 'value', e.target.value)
                      }
                      className="flex-1 bg-slate-50 dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-900 dark:focus:border-sky-500"
                    />

                    {/* Delete row */}
                    <button
                      type="button"
                      onClick={() => handleRemoveEntry(entry.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
                      title="Remove Attribute"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{mode === 'create' ? 'Create Entity' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EntityModal: React.FC<EntityModalProps> = (props) => {
  if (!props.isOpen) return null;

  return (
    <EntityModalContent
      key={
        props.mode === 'edit' && props.initialData
          ? props.initialData.id
          : 'create-new'
      }
      {...props}
    />
  );
};

export default EntityModal;
