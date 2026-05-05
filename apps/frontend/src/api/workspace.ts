import { config } from '../config';
import type { ApiError, ApiResponse } from '../types/api-response';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  members: number;
  ownerId?: string;
  membershipRole?: WorkspaceAccessRole;
  owner?: {
    email?: string | null;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export type WorkspaceAccessRole = 'owner' | 'admin' | 'member' | 'viewer';
export type WorkspaceManageableRole = Exclude<WorkspaceAccessRole, 'owner'>;

export interface WorkspaceProject {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceSubAccessMember {
  userId: string;
  email: string | null;
  role: WorkspaceAccessRole;
  accessLevel: WorkspaceAccessRole;
  joinedAt: string;
}

export interface WorkspaceAssetSummaryProject {
  projectName: string;
  timelineTrackKeys: string[];
  timelineEventCount: number;
  linkedAssetCount: number;
  latestEvidenceAt: string | null;
}

export interface WorkspaceAssetSummaryAsset {
  ref: string;
  occurrences: number;
  projects: string[];
  lastSeenAt: string | null;
}

export interface WorkspaceAssetSummaryEvent {
  id: string;
  title: string;
  timestamp: string;
  projectName: string;
  linkedAssetCount: number;
}

export interface WorkspaceAssetSummary {
  workspaceId: string;
  ownerId: string;
  scope: 'owner' | 'delegated';
  totalTimelineEvents: number;
  uniqueLinkedAssets: number;
  assetPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  eventPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  appliedFilters: {
    project: string | null;
    timelineTrack: string | null;
    assetSearch: string | null;
  };
  projects: WorkspaceAssetSummaryProject[];
  assets: WorkspaceAssetSummaryAsset[];
  recentEvents: WorkspaceAssetSummaryEvent[];
}

export class WorkspaceApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${config.apiUrl}/workspaces`;
  }

  private toApiError(error: unknown, code: string = 'REQUEST_FAILED'): ApiError {
    if (typeof error === 'string') {
      return { code, message: error };
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const maybeMessage = (error as { message?: unknown }).message;
      if (typeof maybeMessage === 'string' && maybeMessage.length > 0) {
        return { code, message: maybeMessage };
      }
    }

    return { code, message: 'Request failed' };
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return {
          success: false,
          error: this.toApiError(errorData?.message || 'Request failed'),
          message: errorData.message || 'Request failed',
        };
      } catch {
        return {
          success: false,
          error: this.toApiError(response.statusText || 'Request failed'),
          message: response.statusText || 'Request failed',
        };
      }
    }

    try {
      const data = await response.json();
      return {
        success: true,
        data: data as T,
      };
    } catch {
      return {
        success: true,
        data: undefined,
        message: 'Request successful but no data returned',
      };
    }
  }

  async getCurrentWorkspace(): Promise<ApiResponse<Workspace>> {
    try {
      const response = await fetch(`${this.baseUrl}/current`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      return this.handleResponse<Workspace>(response);
    } catch (error) {
      const fallback = await this.getWorkspaces();
      if (fallback.success && fallback.data?.workspaces?.length) {
        return {
          success: true,
          data: fallback.data.workspaces[0],
          message: 'Fell back to first available workspace',
        };
      }
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: 'Failed to fetch current workspace',
      };
    }
  }

  async getWorkspaces(): Promise<ApiResponse<{ workspaces: Workspace[]; total: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      const raw = await this.handleResponse<any>(response);
      if (!raw.success) {
        return raw;
      }

      const payload = raw.data;
      const workspaces: Workspace[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.workspaces)
          ? payload.workspaces
          : [];
      const total =
        typeof payload?.total === 'number'
          ? payload.total
          : Array.isArray(workspaces)
            ? workspaces.length
            : 0;

      return {
        success: true,
        data: { workspaces, total },
      };
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: 'Failed to fetch workspaces',
      };
    }
  }

  async getWorkspace(id: string): Promise<ApiResponse<Workspace>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      return this.handleResponse<Workspace>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to fetch workspace ${id}`,
      };
    }
  }

  async createWorkspace(payload: {
    name: string;
    description?: string;
  }): Promise<ApiResponse<Workspace>> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      return this.handleResponse<Workspace>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: 'Failed to create workspace',
      };
    }
  }

  async getWorkspaceProjects(workspaceId: string): Promise<ApiResponse<WorkspaceProject[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/projects`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      return this.handleResponse<WorkspaceProject[]>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to fetch projects for workspace ${workspaceId}`,
      };
    }
  }

  async getWorkspaceAssets(
    workspaceId: string,
    params?: {
      project?: string;
      timelineTrack?: string;
      assetSearch?: string;
      assetPage?: number;
      assetPageSize?: number;
      eventPage?: number;
      eventPageSize?: number;
      projectLimit?: number;
    }
  ): Promise<ApiResponse<WorkspaceAssetSummary>> {
    try {
      const search = new URLSearchParams();
      if (params?.project) search.set('project', params.project);
      if (params?.timelineTrack) search.set('timelineTrack', params.timelineTrack);
      if (params?.assetSearch) search.set('assetSearch', params.assetSearch);
      if (params?.assetPage) search.set('assetPage', String(params.assetPage));
      if (params?.assetPageSize) search.set('assetPageSize', String(params.assetPageSize));
      if (params?.eventPage) search.set('eventPage', String(params.eventPage));
      if (params?.eventPageSize) search.set('eventPageSize', String(params.eventPageSize));
      if (params?.projectLimit) search.set('projectLimit', String(params.projectLimit));
      const suffix = search.toString() ? `?${search.toString()}` : '';

      const response = await fetch(`${this.baseUrl}/${workspaceId}/assets${suffix}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      return this.handleResponse<WorkspaceAssetSummary>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to fetch assets for workspace ${workspaceId}`,
      };
    }
  }

  async listWorkspaceSubAccess(
    workspaceId: string
  ): Promise<ApiResponse<{ workspaceId: string; members: WorkspaceSubAccessMember[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/sub-access`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      return this.handleResponse<{ workspaceId: string; members: WorkspaceSubAccessMember[] }>(
        response
      );
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to fetch delegated access for workspace ${workspaceId}`,
      };
    }
  }

  async grantWorkspaceSubAccess(
    workspaceId: string,
    payload: { email?: string; userId?: string; role?: WorkspaceManageableRole }
  ): Promise<ApiResponse<{ message: string; accessLevel: WorkspaceAccessRole }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/sub-access`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      return this.handleResponse<{ message: string; accessLevel: WorkspaceAccessRole }>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to grant delegated access for workspace ${workspaceId}`,
      };
    }
  }

  async updateWorkspaceSubAccess(
    workspaceId: string,
    memberUserId: string,
    payload: { role: WorkspaceManageableRole }
  ): Promise<ApiResponse<{ message: string; accessLevel: WorkspaceAccessRole }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/sub-access/${memberUserId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      return this.handleResponse<{ message: string; accessLevel: WorkspaceAccessRole }>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to update delegated access for workspace ${workspaceId}`,
      };
    }
  }

  async revokeWorkspaceSubAccess(
    workspaceId: string,
    memberUserId: string
  ): Promise<ApiResponse<{ message: string; memberId: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/sub-access/${memberUserId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      return this.handleResponse<{ message: string; memberId: string }>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to revoke delegated access for workspace ${workspaceId}`,
      };
    }
  }
}
