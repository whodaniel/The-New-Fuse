import { config } from '../config';

interface Workspace {
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

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Request failed',
          message: errorData.message || 'Request failed'
        };
      } catch (e) {
        return {
          success: false,
          error: response.statusText || 'Request failed',
          message: response.statusText || 'Request failed'
        };
      }
    }

    try {
      const data = await response.json();
      return {
        success: true,
        data: data as T
      };
    } catch (e) {
      return {
        success: true,
        data: undefined,
        message: 'Request successful but no data returned'
      };
    }
  }

  async getCurrentWorkspace(): Promise<ApiResponse<Workspace>> {
    try {
      const response = await fetch(`${this.baseUrl}/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include'
      });
      return this.handleResponse<Workspace>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to fetch current workspace'
      };
    }
  }

  async getWorkspaces(): Promise<ApiResponse<{ workspaces: Workspace[]; total: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include'
      });
      return this.handleResponse<{ workspaces: Workspace[]; total: number }>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to fetch workspaces'
      };
    }
  }

  async getWorkspace(id: string): Promise<ApiResponse<Workspace>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include'
      });
      return this.handleResponse<Workspace>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: `Failed to fetch workspace ${id}`
      };
    }
  }
}
