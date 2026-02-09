/**
 * Message Router Interface
 * 
 * Defines the contract for message routing functionality including
 * request routing, load balancing, event subscription, and metrics collection.
 */

import { MCPRequest, MCPResponse, MCPNotification } from './IMCPMessage';
import { RoutingInfo, RoutingMetrics } from '../types/broker';

/**
 * Event callback function type
 */
export type EventCallback = (notification: MCPNotification) => void | Promise<void>;

/**
 * Message Router interface for routing MCP requests and notifications
 */
export interface IMessageRouter {
  /**
   * Start the message router
   */
  start(): Promise<void>;

  /**
   * Stop the message router
   */
  stop(): Promise<void>;

  /**
   * Route a request to an appropriate service
   * @param request The MCP request to route
   * @param routing Optional routing information
   * @returns Promise resolving to the MCP response
   */
  routeRequest(request: MCPRequest, routing?: RoutingInfo): Promise<MCPResponse>;

  /**
   * Broadcast a notification to all services
   * @param notification The notification to broadcast
   */
  broadcastNotification(notification: MCPNotification): Promise<void>;

  /**
   * Route a notification to subscribed services based on pattern matching
   * @param notification The notification to route
   */
  routeNotification(notification: MCPNotification): Promise<void>;

  /**
   * Subscribe a service to events matching a pattern
   * @param serviceId The service ID to subscribe
   * @param pattern The event pattern to match
   * @param callback Optional callback function for event handling
   */
  subscribeToEvents(serviceId: string, pattern: string, callback?: EventCallback): Promise<string>;

  /**
   * Unsubscribe from events
   * @param subscriptionId The subscription ID to remove
   */
  unsubscribeFromEvents(subscriptionId: string): Promise<void>;

  /**
   * Unsubscribe all subscriptions for a service
   * @param serviceId The service ID to unsubscribe
   */
  unsubscribeService(serviceId: string): Promise<void>;

  /**
   * Get routing metrics
   * @returns Current routing metrics
   */
  getRoutingMetrics(): RoutingMetrics;

  /**
   * Reset routing metrics
   */
  resetMetrics(): void;

  /**
   * Get active request count
   * @returns Number of currently active requests
   */
  getActiveRequestCount(): number;
}