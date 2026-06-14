"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WebSocketLoadBalancer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketLoadBalancer = void 0;
const common_1 = require("@nestjs/common");
let WebSocketLoadBalancer = WebSocketLoadBalancer_1 = class WebSocketLoadBalancer {
    logger = new common_1.Logger(WebSocketLoadBalancer_1.name);
    serverHealth = new Map();
    userToServer = new Map();
    getServerForUser(userId) {
        return this.userToServer.get(userId);
    }
    assignUserToServer(userId, serverId) {
        this.userToServer.set(userId, serverId);
        this.logger.debug(`User ${userId} assigned to server ${serverId}`);
    }
    removeUserFromServer(userId) {
        const serverId = this.userToServer.get(userId);
        this.userToServer.delete(userId);
        if (serverId) {
            this.logger.debug(`User ${userId} removed from server ${serverId}`);
        }
    }
    markServerHealthy(serverId) {
        this.serverHealth.set(serverId, true);
        this.logger.log(`Server ${serverId} marked as healthy`);
    }
    markServerUnhealthy(serverId) {
        this.serverHealth.set(serverId, false);
        this.logger.warn(`Server ${serverId} marked as unhealthy`);
    }
    isServerHealthy(serverId) {
        return this.serverHealth.get(serverId) ?? false;
    }
    getHealthyServers() {
        const healthy = [];
        for (const [serverId, isHealthy] of this.serverHealth.entries()) {
            if (isHealthy) {
                healthy.push(serverId);
            }
        }
        return healthy;
    }
    generateNginxConfig() {
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
    generateHAProxyConfig() {
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
    getStats() {
        return {
            totalServers: this.serverHealth.size,
            healthyServers: this.getHealthyServers().length,
            activeUsers: this.userToServer.size,
            serverHealth: Object.fromEntries(this.serverHealth),
        };
    }
};
exports.WebSocketLoadBalancer = WebSocketLoadBalancer;
exports.WebSocketLoadBalancer = WebSocketLoadBalancer = WebSocketLoadBalancer_1 = __decorate([
    (0, common_1.Injectable)()
], WebSocketLoadBalancer);
