import {
  WorkspaceData,
  WorkspaceSettings,
  WorkspaceStats,
  WorkspaceThread,
} from '@/types/workspace';
import { request, uploadFile, userFromStorage } from '@/utils/request';

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

  static async updateSettings(
    slug: string,
    settings: Partial<WorkspaceSettings>
  ): Promise<WorkspaceSettings> {
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

  static async submitMessageFeedback(slug: string, chatId: string, score: number): Promise<void> {
    return request(`/api/workspaces/${slug}/messages/${chatId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    });
  }

  static async getMessageTTS(slug: string, chatId: string): Promise<ArrayBuffer> {
    const headers: HeadersInit = {
      Accept: 'audio/mp3',
    };
    const user = userFromStorage();
    if (user?.uid) {
      headers.Authorization = `Bearer ${user.uid}`;
    }
    const response = await fetch(`/api/workspaces/${slug}/messages/${chatId}/tts`, { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch message TTS');
    }
    return response.arrayBuffer();
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
    return uploadFile(`/api/workspaces/${slug}/files`, file, onProgress);
  }
}

export default Workspace;
