declare module "@core/types" {
  export interface ModuleConfig {
    enabled: boolean;
    options?: Record<string, unknown>;
  }

  export interface BaseModule {
    initialize(): Promise<void>;
    destroy(): Promise<void>;
  }
}
