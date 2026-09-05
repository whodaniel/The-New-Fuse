export enum A2APriority {
  CRITICAL = 0,
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
  BATCH = 4,
}
export enum A2AMessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  EVENT = 'event',
}
export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}
export enum AgentType {
  CUSTOM = 'custom',
}
export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
}
export class A2AError extends Error {}
export class A2AConnectionError extends A2AError {}
export class A2ATimeoutError extends A2AError {}
export class A2AValidationError extends A2AError {}
export class A2AService {}
export class A2ACoreModule {}
export class A2AController {}
export class A2ARedisAdapter {}
export class A2AWebSocketAdapter {}
export class FederatedIdentityService {}
export class PointerResolverService {}
export class A2ASignatureWrapper {}
export const FEDERATED_BASE58_ALPHABET = '';
export const encodeFederatedBase58 = (s: string) => s;
export const uuidv4 = () => '00000000-0000-4000-8000-000000000000';
