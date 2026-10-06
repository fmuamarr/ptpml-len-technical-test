import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Entity,
  EntityPayloadDTO,
  EntityTypePayloadDTO,
  EntityTypeUpdateDTO,
  FilterParams,
} from './types/entity';
import {
  checkHealth,
  getEntityTypes,
  getEntities,
  createEntity,
  updateEntity,
  deleteEntity,
  createEntityType,
  updateEntityType,
  deleteEntityType,
  getErrorMessage,
  queryKeys,
} from './api/client';
import Header from './components/Header/Header';
import MapView from './components/Map/MapView';
import EntityTable from './components/Table/EntityTable';
import EntityModal from './components/Modal/EntityModal';
import DeleteConfirmModal from './components/Modal/DeleteConfirmModal';
import EntityTypeManagerModal from './components/Modal/EntityTypeManagerModal';
import { CheckCircle2, AlertTriangle, X, ChevronLeft } from 'lucide-react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function App() {
  const queryClient = useQueryClient();

  // State: Sidebar Drawer Visibility
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // State: Filter & Search
  const [filter, setFilter] = useState<FilterParams>({
    type: 'ALL',
    status: 'ALL',
    search: '',
  });

  // State: Selection & Map Navigation
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null);

  // State: Pick Location Workflow
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedCoordinates, setPickedCoordinates] = useState<
    [number, number] | null
  >(null);

  // State: Entity Modal (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [modalServerError, setModalServerError] = useState<string | null>(null);

  // State: Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null);

  // State: Master Entity Type Manager Modal
  const [isEntityTypeModalOpen, setIsEntityTypeModalOpen] = useState(false);

  // State: Toast Alerts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ── Queries ──────────────────────────────────────────────────────────────
  const {
    data: healthData,
    isLoading: isCheckingHealth,
    isError: isHealthError,
  } = useQuery({
    queryKey: queryKeys.health,
    queryFn: checkHealth,
    refetchInterval: 15000,
    retry: 1,
  });

  const isServerHealthy = !isHealthError && healthData?.status === 'ok';

  const { data: entityTypes = [] } = useQuery({
    queryKey: queryKeys.entityTypes,
    queryFn: getEntityTypes,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: entities = [],
    isLoading: isLoadingEntities,
    isFetching: isFetchingEntities,
  } = useQuery({
    queryKey: queryKeys.entities(filter),
    queryFn: () => getEntities(filter),
  });

  // Calculate quick stats from unfiltered or overall entities
  const stats = useMemo(() => {
    const total = entities.length;
    let active = 0;
    let alert = 0;
    let maintenance = 0;

    for (const e of entities) {
      if (e.status === 'ACTIVE') active++;
      else if (e.status === 'ALERT') alert++;
      else if (e.status === 'MAINTENANCE') maintenance++;
    }

    return { total, active, alert, maintenance };
  }, [entities]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (dto: EntityPayloadDTO) => createEntity(dto),
    onSuccess: (newEntity) => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      setIsModalOpen(false);
      setModalServerError(null);
      setPickedCoordinates(null);
      setSelectedEntityId(newEntity.id);
      setFlyToTarget([newEntity.latitude, newEntity.longitude]);
      addToast('success', `Entity "${newEntity.name}" was successfully created.`);
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      setModalServerError(msg);
      addToast('error', `Failed to create entity: ${msg}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: EntityPayloadDTO }) =>
      updateEntity(id, dto),
    onSuccess: (updatedEntity) => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      setIsModalOpen(false);
      setModalServerError(null);
      setPickedCoordinates(null);
      setSelectedEntityId(updatedEntity.id);
      addToast('success', `Entity "${updatedEntity.name}" was successfully updated.`);
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      setModalServerError(msg);
      addToast('error', `Failed to update entity: ${msg}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      setIsDeleteModalOpen(false);
      const name = entityToDelete?.name || 'Entity';
      setEntityToDelete(null);
      if (selectedEntityId === entityToDelete?.id) {
        setSelectedEntityId(null);
      }
      addToast('success', `Entity "${name}" was successfully deleted.`);
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      addToast('error', `Failed to delete entity: ${msg}`);
    },
  });

  // ── Entity Type Mutations ──────────────────────────────────────────────────
  const createEntityTypeMutation = useMutation({
    mutationFn: (dto: EntityTypePayloadDTO) => createEntityType(dto),
    onSuccess: (newType) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entityTypes });
      addToast(
        'success',
        `Master entity type "${newType.name}" (${newType.code}) created successfully.`
      );
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      addToast('error', `Failed to create entity type: ${msg}`);
      throw err;
    },
  });

  const updateEntityTypeMutation = useMutation({
    mutationFn: ({ code, dto }: { code: string; dto: EntityTypeUpdateDTO }) =>
      updateEntityType(code, dto),
    onSuccess: (updatedType) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entityTypes });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      addToast(
        'success',
        `Master entity type "${updatedType.name}" (${updatedType.code}) updated successfully.`
      );
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      addToast('error', `Failed to update entity type: ${msg}`);
      throw err;
    },
  });

  const deleteEntityTypeMutation = useMutation({
    mutationFn: (code: string) => deleteEntityType(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entityTypes });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      addToast('success', 'Master entity type deleted successfully.');
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      addToast('error', `Failed to delete entity type: ${msg}`);
      throw err;
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingEntity(null);
    setPickedCoordinates(null);
    setModalServerError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entity: Entity) => {
    setModalMode('edit');
    setEditingEntity(entity);
    setPickedCoordinates([entity.latitude, entity.longitude]);
    setModalServerError(null);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (entity: Entity) => {
    setEntityToDelete(entity);
    setIsDeleteModalOpen(true);
  };

  const handleModalSubmit = async (dto: EntityPayloadDTO) => {
    if (modalMode === 'create') {
      await createMutation.mutateAsync(dto);
    } else if (modalMode === 'edit' && editingEntity) {
      await updateMutation.mutateAsync({ id: editingEntity.id, dto });
    }
  };

  const handleStartPickLocation = () => {
    // Hide modal temporarily while picking coordinate on map
    setIsModalOpen(false);
    setIsPickingLocation(true);
  };

  const handleLocationPicked = (lat: number, lng: number) => {
    setPickedCoordinates([lat, lng]);
    setIsPickingLocation(false);
    // Reopen modal with newly selected coordinates
    setIsModalOpen(true);
  };

  const handleCancelPickLocation = () => {
    setIsPickingLocation(false);
    // Reopen modal
    setIsModalOpen(true);
  };

  const handleFlyToEntity = (entity: Entity) => {
    setSelectedEntityId(entity.id);
    setFlyToTarget([entity.latitude, entity.longitude]);
  };

  const handleSelectEntity = (entity: Entity) => {
    setSelectedEntityId(entity.id);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors">
      {/* Top Header */}
      <Header
        stats={stats}
        isServerHealthy={isServerHealthy}
        isCheckingHealth={isCheckingHealth}
        isRefreshing={isFetchingEntities}
        onRefresh={handleRefresh}
        onCreateClick={handleOpenCreateModal}
        isDrawerOpen={isDrawerOpen}
        onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
        onOpenEntityTypes={() => setIsEntityTypeModalOpen(true)}
        entityTypesCount={entityTypes.length}
      />

      {/* Main Split Screen Body */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 relative overflow-hidden">
        {/* Left Pane: Leaflet Map */}
        <section className="flex-1 h-full min-h-[360px] relative order-2 lg:order-1">
          <MapView
            entities={entities}
            entityTypes={entityTypes}
            selectedEntityId={selectedEntityId}
            flyToTarget={flyToTarget}
            isPickingLocation={isPickingLocation}
            pickedLocation={pickedCoordinates}
            onLocationPicked={handleLocationPicked}
            onCancelPickLocation={handleCancelPickLocation}
            onSelectEntity={handleSelectEntity}
            onEditEntity={handleOpenEditModal}
            onDeleteEntity={handleOpenDeleteModal}
          />

          {/* Docked Pull-Tab on Right Edge when Drawer is Minimized */}
          {!isDrawerOpen && (
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              title="Open Entity Management Panel"
              className="absolute top-1/2 -translate-y-1/2 right-0 z-[990] flex items-center gap-1.5 pl-2.5 pr-2 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-y border-l border-slate-300 dark:border-slate-700/80 hover:border-slate-500 rounded-l-lg shadow-md transition-all cursor-pointer group hover:pr-3"
            >
              <ChevronLeft
                size={16}
                className="text-slate-700 dark:text-sky-400 group-hover:-translate-x-0.5 transition-transform"
              />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 [writing-mode:vertical-rl] rotate-180 font-mono">
                Entities ({entities.length})
              </span>
            </button>
          )}
        </section>

        {/* Right Pane: Collapsible Drawer for Filter Panel & Data Table */}
        <aside
          className={`transition-all duration-300 ease-in-out shrink-0 flex flex-col z-20 order-1 lg:order-2 ${
            isDrawerOpen
              ? 'w-full lg:w-[460px] xl:w-[500px] h-[45vh] lg:h-full border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800'
              : 'w-0 h-0 lg:w-0 overflow-hidden border-none pointer-events-none'
          }`}
          aria-label="Entity Management Drawer"
        >
          <div className="w-full lg:w-[460px] xl:w-[500px] h-full flex flex-col min-w-[320px]">
            <EntityTable
              entities={entities}
              entityTypes={entityTypes}
              isLoading={isLoadingEntities}
              selectedEntityId={selectedEntityId}
              filter={filter}
              onFilterChange={setFilter}
              onFlyTo={handleFlyToEntity}
              onSelectEntity={handleSelectEntity}
              onEditEntity={handleOpenEditModal}
              onDeleteEntity={handleOpenDeleteModal}
              onCreateEntity={handleOpenCreateModal}
              onCloseDrawer={() => setIsDrawerOpen(false)}
              onManageTypes={() => setIsEntityTypeModalOpen(true)}
            />
          </div>
        </aside>
      </main>

      {/* Entity Modal (Create / Edit) */}
      <EntityModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialData={editingEntity}
        entityTypes={entityTypes}
        isLoading={createMutation.isPending || updateMutation.isPending}
        pickedCoordinates={pickedCoordinates}
        serverError={modalServerError}
        onClose={() => {
          setIsModalOpen(false);
          setModalServerError(null);
        }}
        onSubmit={handleModalSubmit}
        onStartPickLocation={handleStartPickLocation}
        onManageTypes={() => setIsEntityTypeModalOpen(true)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        entityName={entityToDelete?.name || ''}
        isLoading={deleteMutation.isPending}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEntityToDelete(null);
        }}
        onConfirm={async () => {
          if (entityToDelete) {
            await deleteMutation.mutateAsync(entityToDelete.id);
          }
        }}
      />

      {/* Master Entity Type Manager Modal */}
      <EntityTypeManagerModal
        isOpen={isEntityTypeModalOpen}
        entityTypes={entityTypes}
        isLoading={false}
        isMutating={
          createEntityTypeMutation.isPending ||
          updateEntityTypeMutation.isPending ||
          deleteEntityTypeMutation.isPending
        }
        onClose={() => setIsEntityTypeModalOpen(false)}
        onCreateType={async (dto) => {
          await createEntityTypeMutation.mutateAsync(dto);
        }}
        onUpdateType={async (code, dto) => {
          await updateEntityTypeMutation.mutateAsync({ code, dto });
        }}
        onDeleteType={async (code) => {
          await deleteEntityTypeMutation.mutateAsync(code);
        }}
      />

      {/* Toast Notifications Stack */}
      <aside aria-label="Notifications" className="fixed bottom-5 right-5 z-[3000] flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-lg border shadow-lg flex items-start gap-2.5 transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-500/40 text-slate-900 dark:text-emerald-200'
                : 'bg-white dark:bg-slate-900 border-red-300 dark:border-red-500/40 text-slate-900 dark:text-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">
                {toast.type === 'success' ? 'Operational Notice' : 'System Alert'}
              </p>
              <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </aside>
    </div>
  );
}
