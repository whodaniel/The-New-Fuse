import { EventEmitter } from "@/utils/EventEmitter";
export declare class APIIntegration extends EventEmitter {
  private config;
  private endpoints;
  constructor(config: APIConfig);
  registerEndpoint(endpoint: APIEndpoint): Promise<void>;
  makeRequest(endpointId: string, data?: unknown): Promise<unknown>;
  private executeRequest;
  getEndpoint(id: string): APIEndpoint | undefined;
  getAllEndpoints(): APIEndpoint[];
}
