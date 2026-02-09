import { request } from '@/utils/request';
import { WorkspaceData, WorkspaceThread, WorkspaceStats, WorkspaceSettings } from '@/types/workspace';

class Workspace {
  static async create(data: Partial<WorkspaceData>): Promise<WorkspaceData> {
    return request('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async get(slug: string): Promise<WorkspaceData> {
    return request(`/api/workspaces/${slug}`);
  }

  static async update(slug: string, data: Partial<WorkspaceData>): Promise<WorkspaceData> {
    return request(`/api/workspaces/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async delete(slug: string): Promise<void> {
    return request(`/api/workspaces/${slug}`, {
      method: 'DELETE',
    });
  }

  static async getThreads(slug: string): Promise<WorkspaceThread[]> {
    return request(`/api/workspaces/${slug}/threads`);
  }

  static async getStats(slug: string): Promise<WorkspaceStats> {
    return request(`/api/workspaces/${slug}/stats`);
  }

  static async getSettings(slug: string): Promise<WorkspaceSettings> {
    return request(`/api/workspaces/${slug}/settings`);
  }

  static async updateSettings(slug: string, settings: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
    return request(`/api/workspaces/${slug}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  static async deleteUserMessage(
    slug: string,
    threadSlug: string | null,
    chatId: string
  ): Promise<void> {
    return request(`/api/workspaces/${slug}/threads/${threadSlug}/messages/${chatId}`, {
      method: 'DELETE',
    });
  }

  static async deleteAssistantMessage(
    slug: string,
    threadSlug: string | null,
    chatId: string
  ): Promise<void> {
    return request(`/api/workspaces/${slug}/threads/${threadSlug}/messages/${chatId}/assistant`, {
      method: 'DELETE',
    });
  }

  static async updateChatResponse(
    slug: string,
    threadSlug: string | null,
    chatId: string,
    content: string
  ): Promise<void> {
    return request(`/api/workspaces/${slug}/threads/${threadSlug}/messages/${chatId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  static async submitMessageFeedback(
    slug: string,
    chatId: string,
    score: number
  ): Promise<void> {
    return request(`/api/workspaces/${slug}/messages/${chatId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    });
  }

  static async getMessageTTS(slug: string, chatId: string): Promise<ArrayBuffer> {
    return request(`/api/workspaces/${slug}/messages/${chatId}/tts`, {
      headers: {
        'Accept': 'audio/mp3',
      },
      responseType: 'arraybuffer',
    });
  }

  static async forkThread(
    slug: string,
    threadSlug: string | null,
    chatId: string
  ): Promise<string> {
    const response = await request(`/api/workspaces/${slug}/threads/${threadSlug}/fork`, {
      method: 'POST',
      body: JSON.stringify({ chatId }),
    });
    return response.threadSlug;
  }

  static async uploadFile(
    slug: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return request(`/api/workspaces/${slug}/files`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
      onProgress,
    });
  }
}

export default Workspace;