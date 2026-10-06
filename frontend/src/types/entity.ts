export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'ALERT';

export interface EntityType {
  code: string;
  name: string;
  icon: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export interface EntityTypePayloadDTO {
  code: string;
  name: string;
  icon: string;
  color: string;
}

export interface EntityTypeUpdateDTO {
  name: string;
  icon: string;
  color: string;
}

export interface Entity {
  id: string;
  name: string;
  type: string;
  status: EntityStatus;
  latitude: number;
  longitude: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  type_detail?: EntityType;
}

export interface EntityPayloadDTO {
  name: string;
  type: string;
  status: EntityStatus;
  latitude: number;
  longitude: number;
  metadata?: Record<string, unknown> | null;
}

export interface FilterParams {
  type?: string;
  status?: string;
  search?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export interface HealthResponse {
  status: string;
}
