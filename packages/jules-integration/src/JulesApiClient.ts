import axios, { AxiosInstance } from 'axios';
import { JulesSessionStatus } from './types';

const JULES_API_URL = process.env.JULES_API_URL || 'https://jules.googleapis.com/v1alpha';

/**
 * A client for interacting with the Jules REST API.
 */
export class JulesApiClient {
  private apiClient: AxiosInstance;

  /**
   * @param apiKey The API key for authenticating with the Jules API.
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Jules API key is required');
    }
    this.apiClient = axios.create({
      baseURL: JULES_API_URL,
      headers: {
        'X-Goog-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Creates a new Jules session.
   * @param params The parameters for creating the session.
   * @returns The newly created session ID.
   */
  async createSession(params: {
    repo: string;
    task: string;
    requirePlanApproval?: boolean;
    webhookUrl: string;
  }): Promise<{ sessionId: string }> {
    const response = await this.apiClient.post('/sessions', params);

    // The API returns the session name in the format "sessions/{sessionId}"
    const sessionName = response.data.name;
    if (typeof sessionName !== 'string' || !sessionName.startsWith('sessions/')) {
      throw new Error(`Invalid session name format from Jules API: ${sessionName}`);
    }

    const sessionId = sessionName.split('/')[1];
    return { sessionId };
  }

  /**
   * Retrieves the status of a Jules session.
   * @param sessionId The ID of the session to check.
   * @returns The status of the session.
   */
  async getSessionStatus(sessionId: string): Promise<JulesSessionStatus> {
    const response = await this.apiClient.get(`/sessions/${sessionId}`);
    return response.data;
  }

  /**
   * Approves a Jules session to proceed.
   * @param sessionId The ID of the session to approve.
   */
  async approveSession(sessionId: string): Promise<void> {
    await this.apiClient.post(`/sessions/${sessionId}:approve`, {});
  }

  /**
   * Cancels an ongoing Jules session.
   * @param sessionId The ID of the session to cancel.
   */
  async cancelSession(sessionId: string): Promise<void> {
    // Note: The cancel endpoint is assumed based on common Google API patterns.
    // This may need to be adjusted if the actual endpoint differs.
    await this.apiClient.post(`/sessions/${sessionId}:cancel`, {});
  }
}
