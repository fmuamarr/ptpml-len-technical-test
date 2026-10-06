import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type {
  EntityType,
  EntityTypePayloadDTO,
  EntityTypeUpdateDTO,
} from "../../types/entity";
import DynamicIcon from "../Common/DynamicIcon";
import { CURATED_ICONS } from "../Common/iconList";
import {
  AlertCircle,
  Check,
  Hash,
  Loader2,
  Palette,
  Save,
  Search,
  Tag,
  X,
} from "lucide-react";

const formSchema = z.object({
  code: z
    .string()
    .min(1, "Type code is required")
    .max(50, "Code must be at most 50 characters")
    .regex(
      /^[A-Z0-9_]+$/,
      "Code must be UPPERCASE alphanumeric with optional underscores",
    ),
  name: z
    .string()
    .min(1, "Type name is required")
    .max(100, "Name must be at most 100 characters"),
  icon: z.string().min(1, "Icon identifier is required").max(50),
  color: z
    .string()
    .min(1, "Color code is required")
    .max(20)
    .regex(
      /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
      "Color must be a valid hex code (e.g. #3B82F6)",
    ),
});

type FormValues = z.infer<typeof formSchema>;

const PRESET_COLORS = [
  { name: "Sky Blue", hex: "#0EA5E9" },
  { name: "Tactical Blue", hex: "#3B82F6" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Orange", hex: "#F97316" },
  { name: "Danger Red", hex: "#EF4444" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Slate Gray", hex: "#64748B" },
  { name: "Deep Navy", hex: "#1E3A5F" },
];

export interface EntityTypeFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: EntityType | null;
  isLoading?: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (dto: EntityTypePayloadDTO | EntityTypeUpdateDTO) => Promise<void>;
}

const EntityTypeFormContent: React.FC<EntityTypeFormModalProps> = ({
  mode,
  initialData,
  isLoading = false,
  serverError,
  onClose,
  onSubmit,
}) => {
  const [iconSearch, setIconSearch] = useState("");

  const defaultValues: FormValues = {
    code: initialData?.code || "",
    name: initialData?.name || "",
    icon: initialData?.icon || "plane",
    color: initialData?.color || "#3B82F6",
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

  const selectedCode = useWatch({ control, name: "code" }) || "";
  const selectedName = useWatch({ control, name: "name" }) || "";
  const selectedIcon = useWatch({ control, name: "icon" }) || "activity";
  const selectedColor = useWatch({ control, name: "color" }) || "#3B82F6";

  const filteredIcons = CURATED_ICONS.filter(
    (item) =>
      item.id.toLowerCase().includes(iconSearch.toLowerCase()) ||
      item.name.toLowerCase().includes(iconSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(iconSearch.toLowerCase()),
  );

  const handleFormSubmit = async (values: FormValues) => {
    if (mode === "create") {
      const payload: EntityTypePayloadDTO = {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        icon: values.icon.trim(),
        color: values.color.trim(),
      };
      await onSubmit(payload);
    } else {
      const updatePayload: EntityTypeUpdateDTO = {
        name: values.name.trim(),
        icon: values.icon.trim(),
        color: values.color.trim(),
      };
      await onSubmit(updatePayload);
    }
  };

  return (
    <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm"
              style={{
                backgroundColor: `${selectedColor}18`,
                borderColor: `${selectedColor}44`,
              }}
            >
              <DynamicIcon
                name={selectedIcon}
                size={20}
                color={selectedColor}
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {mode === "create"
                  ? "Add Data Entity Type"
                  : `Edit Entity Type (${initialData?.code})`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure master symbol, label, and display color accent
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
          {/* Server Error Alert */}
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

          {/* Code & Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Code Field */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <Hash size={13} className="text-sky-600 dark:text-sky-400" />
                <span>Type Code</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={mode === "edit"}
                placeholder="e.g., DRONE, RADAR"
                {...register("code")}
                onChange={(e) => {
                  const upper = e.target.value
                    .toUpperCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^A-Z0-9_]/g, "");
                  setValue("code", upper, { shouldValidate: true });
                }}
                className={`w-full bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-500 focus:border-slate-900 dark:focus:border-sky-500 transition-colors placeholder:text-slate-400 uppercase ${
                  mode === "edit"
                    ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-950"
                    : ""
                }`}
              />
              {errors.code && (
                <p className="text-red-600 dark:text-red-400 text-[11px] font-medium">
                  {errors.code.message}
                </p>
              )}
              {mode === "create" && (
                <p className="text-[10px] text-slate-500 font-mono">
                  UPPERCASE identifier (immutable after creation)
                </p>
              )}
            </div>

            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <Tag size={13} className="text-sky-600 dark:text-sky-400" />
                <span>Display Name</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Surveillance Drone"
                {...register("name")}
                className="w-full bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-sky-500 focus:border-slate-900 dark:focus:border-sky-500 transition-colors placeholder:text-slate-400"
              />
              {errors.name && (
                <p className="text-red-600 dark:text-red-400 text-[11px] font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <Palette size={14} className="text-amber-600 dark:text-amber-400" />
                <span>Badge & Marker Color Accent</span>
              </label>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800 font-medium">
                {selectedColor}
              </span>
            </div>

            {/* Preset Color Swatches */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {PRESET_COLORS.map((c) => {
                const isSelected =
                  selectedColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() =>
                      setValue("color", c.hex, { shouldValidate: true })
                    }
                    className={`h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                      isSelected
                        ? "ring-2 ring-slate-900 dark:ring-white scale-110 shadow-md"
                        : "hover:scale-105 border-slate-300 dark:border-slate-700/60"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && (
                      <Check size={14} className="text-white drop-shadow" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={
                  selectedColor.startsWith("#") ? selectedColor : "#3B82F6"
                }
                onChange={(e) =>
                  setValue("color", e.target.value.toUpperCase(), {
                    shouldValidate: true,
                  })
                }
                className="w-8 h-8 rounded-lg bg-transparent border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5"
              />
              <input
                type="text"
                placeholder="#3B82F6"
                {...register("color")}
                className="w-32 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-900 dark:focus:border-sky-500 uppercase"
              />
              <span className="text-[11px] text-slate-500">
                Custom HEX code
              </span>
            </div>
            {errors.color && (
              <p className="text-red-600 dark:text-red-400 text-[11px] font-medium">
                {errors.color.message}
              </p>
            )}
          </div>

          {/* Icon Picker Grid */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <DynamicIcon
                  name={selectedIcon}
                  size={14}
                  color={selectedColor}
                />
                <span>Select Tactical Icon</span>
                <span className="text-red-500">*</span>
              </label>
              <span className="font-mono text-[11px] text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800/60 font-medium">
                {selectedIcon}
              </span>
            </div>

            {/* Search Box for Icons */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search icons (e.g. drone, car, tower, radar)..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/70 text-slate-900 dark:text-slate-200 text-[11px] pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-900 dark:focus:border-sky-500 placeholder:text-slate-400"
              />
            </div>

            {/* Icon Tiles Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-44 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              {filteredIcons.map((item) => {
                const isSelected =
                  selectedIcon.toLowerCase() === item.id.toLowerCase();
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setValue("icon", item.id, { shouldValidate: true })
                    }
                    className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer border text-center ${
                      isSelected
                        ? "bg-white dark:bg-sky-950/80 border-slate-900 dark:border-sky-500 text-slate-900 dark:text-white shadow-xs font-semibold"
                        : "bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                  >
                    <DynamicIcon
                      name={item.id}
                      size={18}
                      color={isSelected ? selectedColor : undefined}
                    />
                    <span className="text-[10px] font-mono truncate w-full">
                      {item.id}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.icon && (
              <p className="text-red-600 dark:text-red-400 text-[11px] font-medium">
                {errors.icon.message}
              </p>
            )}
          </div>

          {/* Live Preview Card */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Live Preview Appearance
            </p>
            <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              {/* Marker preview */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border shadow-sm transition-all"
                  style={{
                    backgroundColor: `${selectedColor}22`,
                    borderColor: selectedColor,
                    boxShadow: `0 0 10px ${selectedColor}40`,
                  }}
                >
                  <DynamicIcon
                    name={selectedIcon}
                    size={20}
                    color={selectedColor}
                  />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-xs">
                    {selectedName || "Untitled Entity Type"}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    Code: {selectedCode || "CODE"} &bull; Icon: {selectedIcon}
                  </p>
                </div>
              </div>

              {/* Badge Preview */}
              <div
                className="px-2.5 py-1 rounded-md border text-[11px] font-mono font-bold tracking-wider shrink-0"
                style={{
                  backgroundColor: `${selectedColor}15`,
                  borderColor: `${selectedColor}50`,
                  color: selectedColor,
                }}
              >
                {selectedCode || "CODE"}
              </div>
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
                  <span>
                    {mode === "create" ? "Create Entity Type" : "Save Changes"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EntityTypeFormModal: React.FC<EntityTypeFormModalProps> = (
  props,
) => {
  if (!props.isOpen) return null;

  return (
    <EntityTypeFormContent
      key={
        props.mode === "edit" && props.initialData
          ? props.initialData.code
          : "create-type"
      }
      {...props}
    />
  );
};

export default EntityTypeFormModal;
