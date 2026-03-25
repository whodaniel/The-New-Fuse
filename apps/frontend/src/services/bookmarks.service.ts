import {
  WorkspaceApiService,
  type WorkspaceBookmark as ApiWorkspaceBookmark,
} from '@/api/workspace';

export interface BookmarkItem extends ApiWorkspaceBookmark {
  note?: string;
}

export type BookmarkWorkspaceMap = Record<string, BookmarkItem[]>;

const getApiErrorMessage = (error: string | { message?: string } | undefined): string | undefined =>
  typeof error === 'string' ? error : error?.message;

export class BookmarksService {
  private readonly workspaceApi = new WorkspaceApiService();

  async getAllWorkspaceBookmarks(): Promise<BookmarkWorkspaceMap> {
    const workspacesResponse = await this.workspaceApi.getWorkspaces();
    if (!workspacesResponse.success || !workspacesResponse.data) {
      throw new Error(getApiErrorMessage(workspacesResponse.error) || 'Failed to fetch workspaces');
    }

    const workspaceIds = workspacesResponse.data.workspaces.map((workspace) => workspace.id);
    if (workspaceIds.length === 0) return {};

    const responses = await Promise.all(
      workspaceIds.map((workspaceId) => this.workspaceApi.listWorkspaceBookmarks(workspaceId))
    );

    const map: BookmarkWorkspaceMap = {};
    responses.forEach((response, index) => {
      const workspaceId = workspaceIds[index];
      if (!response.success || !response.data) {
        return;
      }
      const entries = (response.data.items || []).map((item) => ({
        ...item,
        note: item.note || undefined,
      }));
      if (entries.length > 0) {
        map[workspaceId] = entries;
      }
    });

    return map;
  }

  async addWorkspaceBookmark(
    workspaceId: string,
    payload: { title: string; url: string; tags?: string[]; note?: string }
  ): Promise<BookmarkItem> {
    const response = await this.workspaceApi.addWorkspaceBookmark(workspaceId, payload);
    if (!response.success || !response.data?.item) {
      throw new Error(getApiErrorMessage(response.error) || 'Failed to add bookmark');
    }

    return {
      ...response.data.item,
      note: response.data.item.note || undefined,
    };
  }

  async updateWorkspaceBookmark(
    workspaceId: string,
    bookmarkId: string,
    payload: { title?: string; url?: string; tags?: string[]; note?: string }
  ): Promise<BookmarkItem> {
    const response = await this.workspaceApi.updateWorkspaceBookmark(workspaceId, bookmarkId, payload);
    if (!response.success || !response.data?.item) {
      throw new Error(getApiErrorMessage(response.error) || 'Failed to update bookmark');
    }

    return {
      ...response.data.item,
      note: response.data.item.note || undefined,
    };
  }

  async removeWorkspaceBookmark(workspaceId: string, bookmarkId: string): Promise<void> {
    const response = await this.workspaceApi.removeWorkspaceBookmark(workspaceId, bookmarkId);
    if (!response.success) {
      throw new Error(getApiErrorMessage(response.error) || 'Failed to remove bookmark');
    }
  }
}

export const bookmarksService = new BookmarksService();
