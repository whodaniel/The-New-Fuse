import { config } from '../config';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  members: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class WorkspaceApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${config.apiUrl}/workspaces`;
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
          error: errorData.message || 'Request failed',
          message: errorData.message || 'Request failed',
        };
      } catch {
        return {
          success: false,
          error: response.statusText || 'Request failed',
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
        error: error instanceof Error ? error.message : 'Network error',
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
        error: error instanceof Error ? error.message : 'Network error',
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
        error: error instanceof Error ? error.message : 'Network error',
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
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to create workspace',
      };
    }
  }
}
