export interface AgentConfig {
  apiKey: string;
  tools?: any[];
  memory?: any;
}

export interface AgentResponse {
  result: string;
  visualization: {
    nodes: any[];
    edges: any[];
  };
}
