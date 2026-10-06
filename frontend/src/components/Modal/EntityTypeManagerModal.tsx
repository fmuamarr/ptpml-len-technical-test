import React, { useState } from "react";
import type {
  EntityType,
  EntityTypePayloadDTO,
  EntityTypeUpdateDTO,
} from "../../types/entity";
import DynamicIcon from "../Common/DynamicIcon";
import EntityTypeFormModal from "./EntityTypeFormModal";
import {
  AlertTriangle,
  Edit,
  Layers,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

export interface EntityTypeManagerModalProps {
  isOpen: boolean;
  entityTypes: EntityType[];
  isLoading?: boolean;
  onClose: () => void;
  onCreateType: (dto: EntityTypePayloadDTO) => Promise<void>;
  onUpdateType: (code: string, dto: EntityTypeUpdateDTO) => Promise<void>;
  onDeleteType: (code: string) => Promise<void>;
  isMutating?: boolean;
}

export const EntityTypeManagerModal: React.FC<EntityTypeManagerModalProps> = ({
  isOpen,
  entityTypes,
  isLoading = false,
  onClose,
  onCreateType,
  onUpdateType,
  onDeleteType,
  isMutating = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingType, setEditingType] = useState<EntityType | null>(null);
  const [formServerError, setFormServerError] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingType, setDeletingType] = useState<EntityType | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredTypes = entityTypes.filter(
    (t) =>
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.icon.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleOpenCreate = () => {
    setFormMode("create");
    setEditingType(null);
    setFormServerError(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (type: EntityType) => {
    setFormMode("edit");
    setEditingType(type);
    setFormServerError(null);
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (
    dto: EntityTypePayloadDTO | EntityTypeUpdateDTO,
  ) => {
    try {
      if (formMode === "create") {
        await onCreateType(dto as EntityTypePayloadDTO);
      } else if (formMode === "edit" && editingType) {
        await onUpdateType(editingType.code, dto as EntityTypeUpdateDTO);
      }
      setFormModalOpen(false);
      setEditingType(null);
      setFormServerError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormServerError(err.message);
      } else {
        setFormServerError("Failed to save entity type.");
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingType) return;
    try {
      setDeleteError(null);
      await onDeleteType(deletingType.code);
      setDeletingType(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete entity type.";
      setDeleteError(message);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-sky-500/10 border border-slate-300 dark:border-sky-500/30 flex items-center justify-center text-slate-800 dark:text-sky-400 shadow-xs">
                <Layers size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Entity Types
                  </h3>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-sky-400 border border-slate-300 dark:border-slate-700">
                    {entityTypes.length} types
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure categories, tactical symbols, and map color themes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Type</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search entity types by code, name, or icon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-950/80 text-slate-900 dark:text-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-900 dark:focus:border-sky-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Body: List / Grid of Entity Types */}
          <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
            {isLoading ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-slate-900 dark:border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Loading master entity types...
                </p>
              </div>
            ) : filteredTypes.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Layers size={22} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-300">
                    No entity types found
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {searchQuery
                      ? "No matches for your search term."
                      : "No master entity types registered yet."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg cursor-pointer"
                >
                  <Plus size={14} /> Add First Type
                </button>
              </div>
            ) : (
              filteredTypes.map((type) => (
                <div
                  key={type.code}
                  className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-3 group shadow-xs"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs"
                      style={{
                        backgroundColor: `${type.color}18`,
                        borderColor: `${type.color}44`,
                      }}
                    >
                      <DynamicIcon
                        name={type.icon}
                        size={20}
                        color={type.color}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {type.name}
                        </h4>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border shrink-0"
                          style={{
                            backgroundColor: `${type.color}15`,
                            borderColor: `${type.color}50`,
                            color: type.color,
                          }}
                        >
                          {type.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block border border-slate-300 dark:border-slate-700"
                            style={{ backgroundColor: type.color }}
                          />
                          <span>{type.color}</span>
                        </span>
                        <span>&bull;</span>
                        <span>icon: {type.icon}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(type)}
                      title={`Edit ${type.name}`}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeletingType(type);
                      }}
                      title={`Delete ${type.name}`}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <span>
              Total Types:{" "}
              <strong className="text-slate-900 dark:text-white">{entityTypes.length}</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Child Modal: Create / Edit Entity Type */}
      <EntityTypeFormModal
        isOpen={formModalOpen}
        mode={formMode}
        initialData={editingType}
        isLoading={isMutating}
        serverError={formServerError}
        onClose={() => {
          setFormModalOpen(false);
          setEditingType(null);
          setFormServerError(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Modal */}
      {deletingType && (
        <div className="fixed inset-0 z-[2300] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-500/40 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Entity Type?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Are you sure you want to remove entity type{" "}
                <strong className="text-slate-900 dark:text-slate-200">
                  &quot;{deletingType.name}&quot; ({deletingType.code})
                </strong>
                ?
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-400/90 mt-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 p-2 rounded-lg text-left">
                <strong>Note:</strong> Deletion will be rejected if any tracked
                entities currently reference this type code.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-500/50 rounded-xl text-red-700 dark:text-red-300 text-xs">
                <p className="font-semibold text-red-800 dark:text-red-200">Cannot Delete</p>
                <p className="mt-0.5 text-red-700 dark:text-red-300/90 leading-relaxed">
                  {deleteError}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingType(null);
                  setDeleteError(null);
                }}
                disabled={isMutating}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isMutating}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isMutating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EntityTypeManagerModal;
