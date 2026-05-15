import { config } from '../config';
import type { ApiError, ApiResponse } from '../types/api-response';

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : value == null ? '' : String(value);

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

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

export interface WorkspaceDomain {
  id: string;
  workspaceId: string;
  domain: string;
  status: string;
  verificationToken?: string | null;
  verificationMethod?: string | null;
  dnsTarget?: string | null;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string | null;
}

export interface WorkspaceHostMariaTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
}

export interface WorkspaceHostMariaSyncResponse {
  workspaceId: string;
  ownerEmail: string;
  project: {
    id: string;
    name: string;
    description?: string | null;
    updatedAt?: string | null;
  };
  tasks: {
    created: number;
    updated: number;
    total: number;
    items: WorkspaceHostMariaTask[];
  };
  ledger: {
    created: number;
    updated: number;
  };
  telemetry: {
    configPath?: string | null;
    reportPath?: string | null;
    archivePath?: string | null;
    targets: string[];
    latestReportStatus: string;
    latestArchiveAt?: string | null;
  };
}

const normalizeWorkspaceBookmark = (
  value: unknown,
  fallbackWorkspaceId: string
): WorkspaceBookmark | null => {
  const row = asRecord(value);
  if (!row) return null;

  const id = asString(row.id).trim();
  const title = asString(row.title).trim();
  const url = asString(row.url).trim();
  if (!id || !title || !url) return null;

  const createdAt = asString(row.createdAt || row.created_at || new Date().toISOString());
  const updatedAt = asString(row.updatedAt || row.updated_at || createdAt);
  const workspaceId = asString(row.workspaceId || row.workspace_id || fallbackWorkspaceId).trim();
  const tags = Array.isArray(row.tags)
    ? row.tags.map((entry) => asString(entry).trim()).filter((entry) => entry.length > 0)
    : [];
  const noteRaw = row.note;
  const note =
    typeof noteRaw === 'string' && noteRaw.trim().length > 0
      ? noteRaw
      : noteRaw == null
        ? null
        : asString(noteRaw);

  return {
    id,
    workspaceId: workspaceId || fallbackWorkspaceId,
    title,
    url,
    tags,
    note,
    createdAt,
    updatedAt,
  };
};

const normalizeWorkspaceDomain = (
  value: unknown,
  fallbackWorkspaceId: string
): WorkspaceDomain | null => {
  const row = asRecord(value);
  if (!row) return null;

  const id = asString(row.id).trim();
  const domain = asString(row.domain).trim().toLowerCase();
  if (!id || !domain) return null;

  const createdAt = asString(row.createdAt || row.created_at || new Date().toISOString());
  const updatedAt = asString(row.updatedAt || row.updated_at || createdAt);
  const workspaceId = asString(row.workspaceId || row.workspace_id || fallbackWorkspaceId).trim();

  return {
    id,
    workspaceId: workspaceId || fallbackWorkspaceId,
    domain,
    status: asString(row.status || 'pending') || 'pending',
    verificationToken: row.verificationToken ? asString(row.verificationToken) : null,
    verificationMethod: row.verificationMethod ? asString(row.verificationMethod) : null,
    dnsTarget: row.dnsTarget ? asString(row.dnsTarget) : null,
    createdAt,
    updatedAt,
    verifiedAt: row.verifiedAt ? asString(row.verifiedAt) : null,
  };
};

const normalizeWorkspaceHostMariaTask = (value: unknown): WorkspaceHostMariaTask | null => {
  const row = asRecord(value);
  if (!row) return null;

  const id = asString(row.id).trim();
  const title = asString(row.title).trim();
  if (!id || !title) return null;

  const descriptionRaw = row.description;
  const description =
    typeof descriptionRaw === 'string' && descriptionRaw.trim().length > 0
      ? descriptionRaw
      : descriptionRaw == null
        ? null
        : asString(descriptionRaw);

  return {
    id,
    title,
    description,
    status: asString(row.status || 'PENDING') || 'PENDING',
    priority: asString(row.priority || 'MEDIUM') || 'MEDIUM',
  };
};

const normalizeWorkspaceHostMariaSync = (
  value: unknown,
  fallbackWorkspaceId: string
): WorkspaceHostMariaSyncResponse | null => {
  const row = asRecord(value);
  if (!row) return null;

  const projectRow = asRecord(row.project);
  const tasksRow = asRecord(row.tasks);
  const ledgerRow = asRecord(row.ledger);
  const telemetryRow = asRecord(row.telemetry);

  const projectId = asString(projectRow?.id).trim();
  const projectName = asString(projectRow?.name).trim();
  if (!projectId || !projectName) return null;

  const taskItems = Array.isArray(tasksRow?.items)
    ? tasksRow.items
        .map((entry) => normalizeWorkspaceHostMariaTask(entry))
        .filter((entry): entry is WorkspaceHostMariaTask => Boolean(entry))
    : [];

  const targets = Array.isArray(telemetryRow?.targets)
    ? telemetryRow.targets
        .map((entry) => asString(entry).trim())
        .filter((entry) => entry.length > 0)
    : [];
  const latestReportRow = asRecord(telemetryRow?.latestReport);
  const latestArchiveRow = asRecord(telemetryRow?.latestArchive);

  return {
    workspaceId: asString(row.workspaceId || fallbackWorkspaceId).trim() || fallbackWorkspaceId,
    ownerEmail: asString(row.ownerEmail || row.owner_email).trim(),
    project: {
      id: projectId,
      name: projectName,
      description: projectRow?.description ? asString(projectRow.description) : null,
      updatedAt: projectRow?.updatedAt ? asString(projectRow.updatedAt) : null,
    },
    tasks: {
      created: asNumber(tasksRow?.created),
      updated: asNumber(tasksRow?.updated),
      total: asNumber(tasksRow?.total, taskItems.length),
      items: taskItems,
    },
    ledger: {
      created: asNumber(ledgerRow?.created),
      updated: asNumber(ledgerRow?.updated),
    },
    telemetry: {
      configPath: telemetryRow?.configPath ? asString(telemetryRow.configPath) : null,
      reportPath: telemetryRow?.reportPath ? asString(telemetryRow.reportPath) : null,
      archivePath: telemetryRow?.archivePath ? asString(telemetryRow.archivePath) : null,
      targets,
      latestReportStatus:
        asString(telemetryRow?.latestReportStatus || latestReportRow?.status || 'unknown') ||
        'unknown',
      latestArchiveAt: telemetryRow?.latestArchiveAt
        ? asString(telemetryRow.latestArchiveAt)
        : latestArchiveRow?.archivedAt
          ? asString(latestArchiveRow.archivedAt)
          : null,
    },
  };
};

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

  async listWorkspaceBookmarks(
    workspaceId: string
  ): Promise<ApiResponse<{ items: WorkspaceBookmark[]; total: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/bookmarks`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      const raw = await this.handleResponse<any>(response);
      if (!raw.success) return raw;

      const payload = raw.data;
      const payloadObject = asRecord(payload);
      const candidates = Array.isArray(payload)
        ? payload
        : Array.isArray(payloadObject?.items)
          ? payloadObject.items
          : Array.isArray(payloadObject?.bookmarks)
            ? payloadObject.bookmarks
            : [];

      const items = candidates
        .map((entry) => normalizeWorkspaceBookmark(entry, workspaceId))
        .filter((entry): entry is WorkspaceBookmark => Boolean(entry));

      const total =
        typeof payloadObject?.total === 'number'
          ? payloadObject.total
          : typeof payloadObject?.count === 'number'
            ? payloadObject.count
            : items.length;

      return {
        success: true,
        data: { items, total },
      };
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
  ): Promise<ApiResponse<{ item: WorkspaceBookmark }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/bookmarks`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const raw = await this.handleResponse<any>(response);
      if (!raw.success) return raw;

      const payloadObject = asRecord(raw.data);
      const normalized = normalizeWorkspaceBookmark(payloadObject?.item || raw.data, workspaceId);
      if (!normalized) {
        return {
          success: false,
          error: this.toApiError('Invalid bookmark response', 'INVALID_RESPONSE'),
          message: 'Invalid bookmark response',
        };
      }

      return {
        success: true,
        data: { item: normalized },
      };
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
  ): Promise<ApiResponse<{ item: WorkspaceBookmark }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/bookmarks/${bookmarkId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const raw = await this.handleResponse<any>(response);
      if (!raw.success) return raw;

      const payloadObject = asRecord(raw.data);
      const normalized = normalizeWorkspaceBookmark(payloadObject?.item || raw.data, workspaceId);
      if (!normalized) {
        return {
          success: false,
          error: this.toApiError('Invalid bookmark response', 'INVALID_RESPONSE'),
          message: 'Invalid bookmark response',
        };
      }

      return {
        success: true,
        data: { item: normalized },
      };
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to update bookmark ${bookmarkId}`,
      };
    }
  }

  async removeWorkspaceBookmark(
    workspaceId: string,
    bookmarkId: string
  ): Promise<ApiResponse<{ message: string; deletedId: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      const raw = await this.handleResponse<any>(response);
      if (!raw.success) return raw;

      const payloadObject = asRecord(raw.data);
      return {
        success: true,
        data: {
          message: asString(payloadObject?.message || raw.message || 'Bookmark removed'),
          deletedId: asString(payloadObject?.deletedId || bookmarkId),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to remove bookmark ${bookmarkId}`,
      };
    }
  }

  async listWorkspaceDomains(
    workspaceId: string
  ): Promise<ApiResponse<{ items: WorkspaceDomain[]; total: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/domains`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      const raw = await this.handleResponse<any>(response);
      if (!raw.success) return raw;

      const payload = raw.data;
      const payloadObject = asRecord(payload);
      const candidates = Array.isArray(payload)
        ? payload
        : Array.isArray(payloadObject?.items)
          ? payloadObject.items
          : Array.isArray(payloadObject?.domains)
            ? payloadObject.domains
            : [];

      const items = candidates
        .map((entry) => normalizeWorkspaceDomain(entry, workspaceId))
        .filter((entry): entry is WorkspaceDomain => Boolean(entry));

      const total =
        typeof payloadObject?.total === 'number'
          ? payloadObject.total
          : typeof payloadObject?.count === 'number'
            ? payloadObject.count
            : items.length;

      return {
        success: true,
        data: { items, total },
      };
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
  ): Promise<ApiResponse<{ item: WorkspaceDomain }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/domains`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const raw = await this.handleResponse<any>(response);
      if (!raw.success) return raw;

      const payloadObject = asRecord(raw.data);
      const normalized = normalizeWorkspaceDomain(payloadObject?.item || raw.data, workspaceId);
      if (!normalized) {
        return {
          success: false,
          error: this.toApiError('Invalid domain response', 'INVALID_RESPONSE'),
          message: 'Invalid domain response',
        };
      }

      return {
        success: true,
        data: { item: normalized },
      };
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
  ): Promise<ApiResponse<{ message: string; deletedId: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/domains/${domainId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      const raw = await this.handleResponse<any>(response);
      if (!raw.success) return raw;

      const payloadObject = asRecord(raw.data);
      return {
        success: true,
        data: {
          message: asString(payloadObject?.message || raw.message || 'Domain removed'),
          deletedId: asString(payloadObject?.deletedId || domainId),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to remove domain ${domainId}`,
      };
    }
  }

  async verifyWorkspaceDomain(
    workspaceId: string,
    domainId: string
  ): Promise<ApiResponse<{ item: WorkspaceDomain }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${workspaceId}/domains/${domainId}/verify`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      const raw = await this.handleResponse<any>(response);
      if (!raw.success) return raw;

      const payloadObject = asRecord(raw.data);
      const normalized = normalizeWorkspaceDomain(payloadObject?.item || raw.data, workspaceId);
      if (!normalized) {
        return {
          success: false,
          error: this.toApiError('Invalid domain response', 'INVALID_RESPONSE'),
          message: 'Invalid domain response',
        };
      }

      return {
        success: true,
        data: { item: normalized },
      };
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to verify domain ${domainId}`,
      };
    }
  }

  async syncWorkspaceHostMariaOps(
    workspaceId: string
  ): Promise<ApiResponse<WorkspaceHostMariaSyncResponse>> {
    const candidates = [
      `${this.baseUrl}/${workspaceId}/hostmaria/sync`,
      `${this.baseUrl}/${workspaceId}/hostmaria-sync`,
      `${this.baseUrl}/${workspaceId}/hostmaria/ops/sync`,
    ];

    for (let index = 0; index < candidates.length; index += 1) {
      const endpoint = candidates[index];
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          credentials: 'include',
        });

        const raw = await this.handleResponse<any>(response);
        if (!raw.success) {
          const notFound =
            typeof raw.error === 'object' &&
            raw.error !== null &&
            'code' in raw.error &&
            (raw.error as { code?: string }).code === 'NOT_FOUND';
          const message =
            typeof raw.error === 'string'
              ? raw.error
              : raw.error?.message || raw.message || 'HostMaria sync failed';

          if ((response.status === 404 || notFound) && index < candidates.length - 1) {
            continue;
          }

          return {
            success: false,
            error: this.toApiError(message, (raw.error as ApiError | undefined)?.code || 'SYNC_FAILED'),
            message,
          };
        }

        const payloadObject = asRecord(raw.data);
        const normalized = normalizeWorkspaceHostMariaSync(
          payloadObject?.data || raw.data,
          workspaceId
        );
        if (!normalized) {
          return {
            success: false,
            error: this.toApiError('Invalid HostMaria sync response', 'INVALID_RESPONSE'),
            message: 'Invalid HostMaria sync response',
          };
        }

        return {
          success: true,
          data: normalized,
        };
      } catch (error) {
        if (index < candidates.length - 1) {
          continue;
        }
        return {
          success: false,
          error: this.toApiError(error, 'NETWORK_ERROR'),
          message: `Failed to sync HostMaria operations for workspace ${workspaceId}`,
        };
      }
    }

    return {
      success: false,
      error: this.toApiError('HostMaria sync endpoint unavailable', 'NOT_FOUND'),
      message: 'HostMaria sync endpoint unavailable',
    };
  }
}
