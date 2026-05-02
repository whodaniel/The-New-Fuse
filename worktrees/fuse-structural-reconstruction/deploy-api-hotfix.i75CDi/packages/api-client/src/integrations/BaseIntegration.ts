import { Integration, IntegrationType, IntegrationConfig } from "./types";

/**
 * Base integration class that implements common functionality
 */
export abstract class BaseIntegration implements Integration {
  public id: string;
  public name: string;
  public type: IntegrationType;
  public description?: string;
  public config: IntegrationConfig;
  public capabilities: {
    actions: string[];
    triggers?: string[];
    [key: string]: any;
  };
  public isConnected: boolean = false;
  public isEnabled: boolean = true;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(
    id: string,
    name: string,
    type: IntegrationType,
    config: IntegrationConfig,
    description?: string,
    capabilities?: Partial<{
      actions: string[];
      triggers?: string[];
      [key: string]: any;
    }>,
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.description = description;
    this.config = config;
    this.capabilities = {
      actions: [],
      triggers: [],
      ...capabilities,
    };
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Connect to the integration
   */
  abstract connect(): Promise<boolean>;

  /**
   * Disconnect from the integration
   */
  abstract disconnect(): Promise<boolean>;

  /**
   * Execute an action
   */
  abstract execute(action: string, params?: Record<string, any>): Promise<any>;

  /**
   * Get metadata
   */
  abstract getMetadata(): Promise<Record<string, any>>;

  /**
   * Update the last modified timestamp
   */
  protected updateTimestamp(): void {
    this.updatedAt = new Date();
  }
}

export { IntegrationType } from "./types";
