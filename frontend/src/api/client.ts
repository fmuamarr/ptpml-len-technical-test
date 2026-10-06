import axios, { AxiosError } from 'axios';
import type {
  ApiResponse,
  Entity,
  EntityPayloadDTO,
  EntityType,
  EntityTypePayloadDTO,
  EntityTypeUpdateDTO,
  FilterParams,
  HealthResponse,
} from '../types/entity';

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

export const queryKeys = {
  health: ['health'] as const,
  entityTypes: ['entity-types'] as const,
  entities: (filter?: FilterParams) => ['entities', filter] as const,
  entity: (id: string) => ['entity', id] as const,
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.data) {
      const data = error.response.data as ApiResponse<unknown>;
      if (data.error) return data.error;
      if (data.message) return data.message;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected system error occurred.';
}

export async function checkHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<ApiResponse<HealthResponse>>('/health');
  return response.data.data;
}

export async function getEntityTypes(): Promise<EntityType[]> {
  const response = await apiClient.get<ApiResponse<EntityType[]>>(
    '/api/v1/entity-types'
  );
  return response.data.data;
}

export async function getEntities(
  filter?: FilterParams
): Promise<Entity[]> {
  const params: Record<string, string> = {};
  if (filter?.type && filter.type !== 'ALL') {
    params.type = filter.type;
  }
  if (filter?.status && filter.status !== 'ALL') {
    params.status = filter.status;
  }
  if (filter?.search && filter.search.trim() !== '') {
    params.search = filter.search.trim();
  }

  const response = await apiClient.get<ApiResponse<Entity[]>>('/api/v1/entities', {
    params,
  });
  return response.data.data ?? [];
}

export async function getEntityById(id: string): Promise<Entity> {
  const response = await apiClient.get<ApiResponse<Entity>>(
    `/api/v1/entities/${id}`
  );
  return response.data.data;
}

export async function createEntity(
  payload: EntityPayloadDTO
): Promise<Entity> {
  const response = await apiClient.post<ApiResponse<Entity>>(
    '/api/v1/entities',
    payload
  );
  return response.data.data;
}

export async function updateEntity(
  id: string,
  payload: EntityPayloadDTO
): Promise<Entity> {
  const response = await apiClient.put<ApiResponse<Entity>>(
    `/api/v1/entities/${id}`,
    payload
  );
  return response.data.data;
}

export async function deleteEntity(id: string): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(`/api/v1/entities/${id}`);
}

export async function createEntityType(
  payload: EntityTypePayloadDTO
): Promise<EntityType> {
  const response = await apiClient.post<ApiResponse<EntityType>>(
    '/api/v1/entity-types',
    payload
  );
  return response.data.data;
}

export async function updateEntityType(
  code: string,
  payload: EntityTypeUpdateDTO
): Promise<EntityType> {
  const response = await apiClient.put<ApiResponse<EntityType>>(
    `/api/v1/entity-types/${code}`,
    payload
  );
  return response.data.data;
}

export async function deleteEntityType(code: string): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(`/api/v1/entity-types/${code}`);
}
