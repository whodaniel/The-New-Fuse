import { config } from '../config';
import type { ApiError, ApiResponse } from '../types/api-response';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  members: number;
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

export interface WorkspaceHostMariaTaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceHostMariaSyncResponse {
  workspaceId: string;
  ownerEmail: string;
  project: WorkspaceProject;
  tasks: {
    total: number;
    created: number;
    updated: number;
    items: WorkspaceHostMariaTaskItem[];
  };
  unifiedLedger: {
    created: number;
    updated: number;
  };
  telemetry: {
    configPath: string;
    reportPath: string;
    archivePath: string;
    targetCount: number;
    targets: string[];
    latestReportStatus: string;
  };
}

export interface WorkspaceSubAccessMember {
  userId: string;
  email: string | null;
  role: WorkspaceAccessRole;
  accessLevel: WorkspaceAccessRole;
  joinedAt: string;
}

export type WorkspaceDomainStatus = 'pending' | 'verified' | 'error';

export interface WorkspaceDomain {
  id: string;
  workspaceId: string;
  domain: string;
  status: WorkspaceDomainStatus;
  verificationMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceBookmark {
  id: string;
  workspaceId: string;
  title: string;
  url: string;
  tags: string[];
  note?: string | null;
  createdAt: string;
  updatedAt: string;
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

  async syncWorkspaceHostMariaOps(
    workspaceId: string
  ): Promise<ApiResponse<WorkspaceHostMariaSyncResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/hostmaria/sync`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      return this.handleResponse<WorkspaceHostMariaSyncResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to sync HostMaria operations for workspace ${workspaceId}`,
      };
    }
  }

  async listWorkspaceDomains(
    workspaceId: string
  ): Promise<ApiResponse<{ workspaceId: string; items: WorkspaceDomain[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/domains`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      return this.handleResponse<{ workspaceId: string; items: WorkspaceDomain[] }>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to fetch domains for workspace ${workspaceId}`,
      };
    }
  }

  async addWorkspaceDomain(
    workspaceId: string,
    payload: { domain: string }
  ): Promise<ApiResponse<{ workspaceId: string; item: WorkspaceDomain }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/domains`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      return this.handleResponse<{ workspaceId: string; item: WorkspaceDomain }>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to add domain for workspace ${workspaceId}`,
      };
    }
  }

  async removeWorkspaceDomain(
    workspaceId: string,
    domainId: string
  ): Promise<ApiResponse<{ workspaceId: string; domainId: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/domains/${domainId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      return this.handleResponse<{ workspaceId: string; domainId: string }>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to remove domain for workspace ${workspaceId}`,
      };
    }
  }

  async verifyWorkspaceDomain(
    workspaceId: string,
    domainId: string
  ): Promise<ApiResponse<{ workspaceId: string; item: WorkspaceDomain }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/domains/${domainId}/verify`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      return this.handleResponse<{ workspaceId: string; item: WorkspaceDomain }>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to verify domain for workspace ${workspaceId}`,
      };
    }
  }

  async listWorkspaceBookmarks(
    workspaceId: string
  ): Promise<ApiResponse<{ workspaceId: string; items: WorkspaceBookmark[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/bookmarks`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      return this.handleResponse<{ workspaceId: string; items: WorkspaceBookmark[] }>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to fetch bookmarks for workspace ${workspaceId}`,
      };
    }
  }

  async addWorkspaceBookmark(
    workspaceId: string,
    payload: { title: string; url: string; tags?: string[]; note?: string }
  ): Promise<ApiResponse<{ workspaceId: string; item: WorkspaceBookmark }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/bookmarks`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      return this.handleResponse<{ workspaceId: string; item: WorkspaceBookmark }>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to add bookmark for workspace ${workspaceId}`,
      };
    }
  }

  async updateWorkspaceBookmark(
    workspaceId: string,
    bookmarkId: string,
    payload: { title?: string; url?: string; tags?: string[]; note?: string }
  ): Promise<ApiResponse<{ workspaceId: string; item: WorkspaceBookmark }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/bookmarks/${bookmarkId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      return this.handleResponse<{ workspaceId: string; item: WorkspaceBookmark }>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to update bookmark for workspace ${workspaceId}`,
      };
    }
  }

  async removeWorkspaceBookmark(
    workspaceId: string,
    bookmarkId: string
  ): Promise<ApiResponse<{ workspaceId: string; bookmarkId: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      return this.handleResponse<{ workspaceId: string; bookmarkId: string }>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to remove bookmark for workspace ${workspaceId}`,
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
