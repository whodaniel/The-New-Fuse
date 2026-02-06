import axios from 'axios';

const EDGE_URL = import.meta.env.VITE_EDGE_URL || 'https://fuse-edge-worker.yourname.workers.dev';

export interface AgentState {
  agentId: string;
  state: any;
}

export class EdgeService {
  private static instance: EdgeService;

  private constructor() {}

  public static getInstance(): EdgeService {
    if (!EdgeService.instance) {
      EdgeService.instance = new EdgeService();
    }
    return EdgeService.instance;
  }

  /**
   * Check if the Edge Worker is alive
   */
  async getHealth(): Promise<string> {
    try {
      const response = await axios.get(EDGE_URL);
      return response.data;
    } catch (e) {
      return 'Edge Offline';
    }
  }

  /**
   * Get agent state from Edge KV
   */
  async getAgentState(agentId: string): Promise<AgentState | null> {
    try {
      const response = await axios.get(`${EDGE_URL}/state/${agentId}`);
      return response.data;
    } catch (e) {
      console.error('Failed to fetch edge state', e);
      return null;
    }
  }

  /**
   * Save agent state to Edge KV
   */
  async saveAgentState(agentId: string, state: any): Promise<boolean> {
    try {
      await axios.post(`${EDGE_URL}/state/${agentId}`, state);
      return true;
    } catch (e) {
      console.error('Failed to save edge state', e);
      return false;
    }
  }

  /**
   * Connect to a Stateful Agent (Durable Object) via WebSocket
   */
  connectToAgent(agentName: string, onMessage: (data: any) => void): WebSocket {
    // Replace https/http with wss/ws
    const wsUrl = EDGE_URL.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsUrl}/agent/${agentName}`);

    ws.onopen = () => console.log(`Connected to Agent: ${agentName}`);
    ws.onmessage = (event) => onMessage(JSON.parse(event.data));
    ws.onerror = (e) => console.error('Agent WS Error', e);
    ws.onclose = () => console.log(`Disconnected from Agent: ${agentName}`);

    return ws;
  }

  /**
   * Broadcast a message to all clients connected to an Agent
   */
  async broadcastToAgent(agentName: string, message: any): Promise<boolean> {
    try {
      await axios.post(`${EDGE_URL}/agent/${agentName}/broadcast`, message);
      return true;
    } catch (e) {
      console.error('Broadcast Failed', e);
      return false;
    }
  }

  /**
   * Run AI Inference at the Edge
   */
  async runInference(prompt: string): Promise<any> {
    try {
      const response = await axios.post(`${EDGE_URL}/ai/inference`, { prompt });
      return response.data;
    } catch (e) {
      console.error('Edge Inference Failed', e);
      throw e;
    }
  }

  /**
   * Capture a screenshot using Cloudflare Browser Rendering
   */
  getScreenshotUrl(url: string): string {
    return `${EDGE_URL}/browser/screenshot?url=${encodeURIComponent(url)}`;
  }

  /**
   * Scrape a URL using Cloudflare Browser Rendering
   */
  async scrapeUrl(url: string): Promise<any> {
    try {
      const response = await axios.get(`${EDGE_URL}/browser/scrape`, {
        params: { url }
      });
      return response.data;
    } catch (e) {
      console.error('Edge Scraping Failed', e);
      throw e;
    }
  }
}

export const edgeService = EdgeService.getInstance();
