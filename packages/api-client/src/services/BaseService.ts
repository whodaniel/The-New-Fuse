import { ApiClient } from '../client/ApiClient.js';

/**
 * Base service class for API services
 */
export abstract class BaseService {
  protected apiClient: ApiClient;
  protected basePath: string;

  /**
   * Create a new base service
   * @param apiClient API client
   * @param basePath Base path for API requests
   */
  constructor(apiClient: ApiClient, basePath: string) {
    this.apiClient = apiClient;
    this.basePath = basePath;
  }

  /**
   * Get the full path for a resource
   * @param path Path to the resource
   * @returns Full path including the base path
   */
  protected getPath(path: string = ''): string {
    return `${this.basePath}${path}`;
  }
}
