import {
  WorkspaceApiService,
  type WorkspaceDomain as ApiWorkspaceDomain,
} from '@/api/workspace';

export type WorkspaceDomain = ApiWorkspaceDomain;
export type WorkspaceDomainsMap = Record<string, WorkspaceDomain[]>;

const getApiErrorMessage = (error: string | { message?: string } | undefined): string | undefined =>
  typeof error === 'string' ? error : error?.message;

export class WorkspaceDomainsService {
  private readonly workspaceApi = new WorkspaceApiService();

  async getAllWorkspaceDomains(): Promise<WorkspaceDomainsMap> {
    const workspacesResponse = await this.workspaceApi.getWorkspaces();
    if (!workspacesResponse.success || !workspacesResponse.data) {
      throw new Error(getApiErrorMessage(workspacesResponse.error) || 'Failed to fetch workspaces');
    }

    const workspaceIds = workspacesResponse.data.workspaces.map((workspace) => workspace.id);
    if (workspaceIds.length === 0) return {};

    const responses = await Promise.all(
      workspaceIds.map((workspaceId) => this.workspaceApi.listWorkspaceDomains(workspaceId))
    );

    const map: WorkspaceDomainsMap = {};
    responses.forEach((response, index) => {
      const workspaceId = workspaceIds[index];
      if (!response.success || !response.data) {
        return;
      }
      const entries = response.data.items || [];
      if (entries.length > 0) {
        map[workspaceId] = entries;
      }
    });

    return map;
  }

  async addDomain(workspaceId: string, domain: string): Promise<WorkspaceDomain> {
    const response = await this.workspaceApi.addWorkspaceDomain(workspaceId, { domain });
    if (!response.success || !response.data?.item) {
      throw new Error(getApiErrorMessage(response.error) || 'Failed to add domain');
    }
    return response.data.item;
  }

  async removeDomain(workspaceId: string, domainId: string): Promise<void> {
    const response = await this.workspaceApi.removeWorkspaceDomain(workspaceId, domainId);
    if (!response.success) {
      throw new Error(getApiErrorMessage(response.error) || 'Failed to remove domain');
    }
  }

  async verifyDomain(workspaceId: string, domainId: string): Promise<WorkspaceDomain> {
    const response = await this.workspaceApi.verifyWorkspaceDomain(workspaceId, domainId);
    if (!response.success || !response.data?.item) {
      throw new Error(getApiErrorMessage(response.error) || 'Failed to verify domain');
    }
    return response.data.item;
  }
}

export const workspaceDomainsService = new WorkspaceDomainsService();
