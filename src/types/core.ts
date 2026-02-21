export interface CoreModuleConfig {
  captcha?: {
    enabled: boolean;
    siteKey: string;
    theme?: "light" | "dark";
  };
  security?: {
    enabled: boolean;
    level?: "low" | "medium" | "high";
  };
  logging?: {
    enabled: boolean;
    level?: "debug" | "info" | "warn" | "error";
  };
}
