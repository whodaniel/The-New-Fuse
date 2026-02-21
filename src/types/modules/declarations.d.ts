// Tool modules
declare module "../tools/base" {
  export const Tool: unknown;
}
declare module "../tools/tool_manager" {
  export const ToolManager: unknown;
}
declare module "./visualizer" {
  const Visualizer: unknown;
  export default Visualizer;
}
declare module "./logging_config" {
  export const LogConfig: unknown;
}
declare module "../config/redis_config" {
  export const RedisConfig: unknown;
}
declare module "../utils/exceptions" {
  export const Exceptions: unknown;
}
declare module "../utils/logger" {
  export const Logger: unknown;
}
declare module "./enhanced_communication" {
  export const EnhancedCommunication: unknown;
}
declare module "../notification/NotificationService" {
  export const NotificationService: unknown;
}
declare module "../../shared/utils/MentionParser" {
  export const MentionParser: unknown;
}
declare module "../../user/entities/User" {
  export interface User {
    token?: string;
    id: string;
    [key: string]: unknown;
  }
}
declare module "../config/codebase_reading_config" {
  export const CodebaseReadingConfig: unknown;
}
declare module "../redis/redis.module" {
  export const RedisModule: unknown;
}
