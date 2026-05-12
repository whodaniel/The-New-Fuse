import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedSocket } from '../types/index.js';

/**
 * Load balancer configuration for WebSocket servers
 * Implements sticky sessions and health checks
 */
@Injectable()
export class WebSocketLoadBalancer {
  private readonly logger = new Logger(WebSocketLoadBalancer.name);
  private serverHealth: Map<string, boolean> = new Map();
  private userToServer: Map<string, string> = new Map();

  /**
   * Get server ID for sticky session
   */
  public getServerForUser(userId: string): string | undefined {
    return this.userToServer.get(userId);
  }

  /**
   * Assign user to server
   */
  public assignUserToServer(userId: string, serverId: string): void {
    this.userToServer.set(userId, serverId);
    this.logger.debug(`User ${userId} assigned to server ${serverId}`);
  }

  /**
   * Remove user from server mapping
   */
  public removeUserFromServer(userId: string): void {
    const serverId = this.userToServer.get(userId);
    this.userToServer.delete(userId);
    if (serverId) {
      this.logger.debug(`User ${userId} removed from server ${serverId}`);
    }
  }

  /**
   * Mark server as healthy
   */
  public markServerHealthy(serverId: string): void {
    this.serverHealth.set(serverId, true);
    this.logger.log(`Server ${serverId} marked as healthy`);
  }

  /**
   * Mark server as unhealthy
   */
  public markServerUnhealthy(serverId: string): void {
    this.serverHealth.set(serverId, false);
    this.logger.warn(`Server ${serverId} marked as unhealthy`);
  }

  /**
   * Check if server is healthy
   */
  public isServerHealthy(serverId: string): boolean {
    return this.serverHealth.get(serverId) ?? false;
  }

  /**
   * Get all healthy servers
   */
  public getHealthyServers(): string[] {
    const healthy: string[] = [];
    for (const [serverId, isHealthy] of this.serverHealth.entries()) {
      if (isHealthy) {
        healthy.push(serverId);
      }
    }
    return healthy;
  }

  /**
   * Generate sticky session configuration for nginx
   */
  public generateNginxConfig(): string {
    return `
# WebSocket Load Balancer Configuration for Nginx
upstream websocket_backend {
    # Use IP hash for sticky sessions
    ip_hash;

    # Health checks
    least_conn;

    # Backend servers
    server backend1.example.com:3000 max_fails=3 fail_timeout=30s;
    server backend2.example.com:3000 max_fails=3 fail_timeout=30s;
    server backend3.example.com:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name ws.example.com;

    location /socket.io/ {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;

        # Buffering
        proxy_buffering off;

        # Sticky session cookie
        proxy_cookie_path / "/; HTTPOnly; Secure; SameSite=Strict";
    }
}
`;
  }

  /**
   * Generate HAProxy configuration
   */
  public generateHAProxyConfig(): string {
    return `
# WebSocket Load Balancer Configuration for HAProxy
global
    log /dev/log local0
    log /dev/log local1 notice
    maxconn 4096

defaults
    log global
    mode http
    option httplog
    option dontlognull
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend websocket_front
    bind *:80
    default_backend websocket_back

backend websocket_back
    balance source  # Sticky sessions based on source IP
    option httpchk GET /health

    # Enable WebSocket support
    option http-server-close
    option forwardfor

    # Backend servers with health checks
    server ws1 backend1.example.com:3000 check inter 2000 rise 2 fall 3
    server ws2 backend2.example.com:3000 check inter 2000 rise 2 fall 3
    server ws3 backend3.example.com:3000 check inter 2000 rise 2 fall 3

    # Sticky sessions using cookies
    cookie SERVERID insert indirect nocache
`;
  }

  /**
   * Get load balancer statistics
   */
  public getStats() {
    return {
      totalServers: this.serverHealth.size,
      healthyServers: this.getHealthyServers().length,
      activeUsers: this.userToServer.size,
      serverHealth: Object.fromEntries(this.serverHealth),
    };
  }
}
