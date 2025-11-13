"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadBalancer = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../services/LoggingService");
const MetricsService_1 = require("../monitoring/MetricsService");
let LoadBalancer = class LoadBalancer {
    logger;
    metricsService;
    services = new Map();
    rules = new Map();
    requests = [];
    circuitBreakers = new Map();
    sessionAffinityMap = new Map();
    roundRobinCounters = new Map();
    isInitialized = false;
    healthCheckInterval;
    constructor(logger, metricsService) {
        this.logger = logger;
        this.metricsService = metricsService;
    }
    async initialize() {
        try {
            this.logger.log('Initializing Load Balancer...', 'LoadBalancer');
            // Create default rule
            await this.createRule('default-http', 'Default HTTP Load Balancing', '*', 'round_robin', {
                sticky_sessions: false,
                failover_enabled: true,
                circuit_breaker: {
                    enabled: true,
                    failure_threshold: 5,
                    recovery_timeout_ms: 30000,
                    half_open_max_calls: 3
                },
                rate_limiting: {
                    enabled: false,
                    requests_per_minute: 1000,
                    burst_size: 100
                },
                retry_policy: {
                    enabled: true,
                    max_retries: 3,
                    retry_delay_ms: 1000,
                    retry_on_status_codes: [502, 503, 504]
                }
            });
            this.startHealthChecks();
            this.startMetricsCollection();
            this.startCleanupTasks();
            this.isInitialized = true;
            this.logger.log('Load Balancer initialized successfully', 'LoadBalancer');
            await this.metricsService.recordMetric('load_balancer_initialized', 1, 'counter', { labels: { component: 'load_balancer' } });
        }
        catch (error) {
            this.logger.error('Failed to initialize Load Balancer', error instanceof Error ? error : new Error(String(error)), 'LoadBalancer');
            throw error;
        }
    }
    async registerService(serviceName, host, port, options = {}) {
        try {
            const service = {
                id: `${serviceName}_${host}_${port}_${Date.now()},
        name: serviceName,`,
                url: `${options.protocol || 'http'}://${host}:${port}`,
                host,
                port,
                protocol: options.protocol || 'http',
                status: 'unknown',
                weight: options.weight || 1,
                priority: options.priority || 1,
                metadata: {
                    version: '1.0.0',
                    region: 'default',
                    zone: 'default',
                    capacity: 100,
                    tags: [],
                    ...options.metadata
                },
                health_check: {
                    enabled: true,
                    endpoint: '/health',
                    interval_ms: 30000,
                    timeout_ms: 5000,
                    healthy_threshold: 2,
                    unhealthy_threshold: 3,
                    ...options.health_check
                },
                metrics: {
                    active_connections: 0,
                    total_requests: 0,
                    failed_requests: 0,
                    avg_response_time_ms: 0,
                    cpu_usage: 0,
                    memory_usage: 0
                },
                registered_at: new Date(),
                last_health_check: new Date(),
                consecutive_failures: 0,
                consecutive_successes: 0
            };
            const serviceInstances = this.services.get(serviceName) || [];
            serviceInstances.push(service);
            this.services.set(serviceName, serviceInstances);
            // Initialize circuit breaker
            this.circuitBreakers.set(service.id, {
                service_id: service.id,
                state: 'closed',
                failure_count: 0,
                half_open_calls: 0
            });
            this.logger.log(Service, registered, $, { serviceName }, at, $, { service, : .url }, 'LoadBalancer');
            await this.metricsService.recordMetric('service_registered', 1, 'counter', {
                labels: {
                    service_name: serviceName,
                    protocol: service.protocol
                }
            });
            return service;
        }
        catch (error) {
            this.logger.error('Failed to register service', error instanceof Error ? error : new Error(String(error)), 'LoadBalancer');
            throw error;
        }
    }
    async unregisterService(serviceName, serviceId) {
        try {
            const serviceInstances = this.services.get(serviceName) || [];
            const filteredInstances = serviceInstances.filter(s => s.id !== serviceId);
            if (filteredInstances.length === serviceInstances.length) {
                return false; // Service not found
            }
            this.services.set(serviceName, filteredInstances);
            this.circuitBreakers.delete(serviceId);
            await this.metricsService.recordMetric('service_unregistered', 1, 'counter', {
                labels: {
                    service_name: serviceName
                }
            });
            return true;
        }
        catch (error) {
            this.logger.error('Failed to unregister service', error instanceof Error ? error : new Error(String(error)), 'LoadBalancer');
            return false;
        }
    }
    async createRule(name, description, servicePattern, algorithm, options = {}) {
        `
    const rule: LoadBalancingRule = {`;
        id: rule_$;
        {
            Date.now();
        }
        `_${Math.random().toString(36).substr(2, 9)},
      name,
      service_pattern: servicePattern,
      algorithm,
      sticky_sessions: options.sticky_sessions || false,
      session_affinity_cookie: options.session_affinity_cookie,
      failover_enabled: options.failover_enabled || true,
      circuit_breaker: {
        enabled: true,
        failure_threshold: 5,
        recovery_timeout_ms: 30000,
        half_open_max_calls: 3,
        ...options.circuit_breaker
      },
      rate_limiting: {
        enabled: false,
        requests_per_minute: 1000,
        burst_size: 100,
        ...options.rate_limiting
      },
      retry_policy: {
        enabled: true,
        max_retries: 3,
        retry_delay_ms: 1000,
        retry_on_status_codes: [502, 503, 504],
        ...options.retry_policy
      },
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    this.rules.set(rule.id, rule);

    await this.metricsService.recordMetric('load_balancing_rule_created', 1, 'counter', { 
      labels: { 
        algorithm: algorithm
      } 
    });

    return rule;
  }

  async routeRequest(
    serviceName: string,
    request: Omit<LoadBalancerRequest, 'id' | 'requested_at' | 'service_name'>
  ): Promise<{ service: ServiceInstance; request_id: string } | null> {
    try {
      const lbRequest: LoadBalancerRequest = {`;
        id: req_$;
        {
            Date.now();
        }
        _$;
        {
            Math.random().toString(36).substr(2, 9);
        }
        `,
        service_name: serviceName,
        requested_at: new Date(),
        ...request
      };

      this.requests.push(lbRequest);

      // Get applicable rule
      const rule = this.getApplicableRule(serviceName);
      if (!rule) {
        throw new Error(No load balancing rule found for service: ${serviceName}`;
        ;
    }
    // Check rate limiting
    if(rule, rate_limiting, enabled) { }
};
exports.LoadBalancer = LoadBalancer;
exports.LoadBalancer = LoadBalancer = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        MetricsService_1.MetricsService])
], LoadBalancer);
 && !this.checkRateLimit(request.client_ip, rule);
{
    throw new Error('Rate limit exceeded');
}
// Get healthy services
const healthyServices = this.getHealthyServices(serviceName);
if (healthyServices.length === 0) {
    throw new Error(No, healthy, instances, available);
    for (service; ; )
        : $;
    {
        serviceName;
    }
    ;
}
// Select service instance based on algorithm
const selectedService = this.selectServiceInstance(healthyServices, rule, lbRequest);
if (!selectedService) {
    throw new Error('Failed to select service instance');
}
// Check circuit breaker
if (!this.isCircuitBreakerAllowing(selectedService.id)) {
    throw new Error('Circuit breaker is open');
}
lbRequest.routed_to = selectedService.id;
// Update service metrics
selectedService.metrics.active_connections++;
selectedService.metrics.total_requests++;
selectedService.metrics.last_request_at = new Date();
await this.metricsService.recordMetric('request_routed', 1, 'counter', {
    labels: {
        service_name: serviceName,
        algorithm: rule.algorithm,
        target_service: selectedService.id
    }
});
return {
    service: selectedService,
    request_id: lbRequest.id
};
try { }
catch (error) {
    this.logger.error('Failed to route request', error instanceof Error ? error : new Error(String(error)), 'LoadBalancer');
    return null;
}
async;
recordRequestResult(requestId, string, statusCode, number, responseTimeMs, number, error ?  : string);
Promise < void  > {
    try: {
        const: request = this.requests.find(r => r.id === requestId),
        if(, request) { }
    } || !request.routed_to, return: ,
    request, : .status_code = statusCode,
    request, : .response_time_ms = responseTimeMs,
    request, : .error_message = error,
    const: service = this.findServiceById(request.routed_to),
    if(, service) { }, return: ,
    // Update service metrics
    service, : .metrics.active_connections = Math.max(0, service.metrics.active_connections - 1),
    if(statusCode) { }
} >= 400;
{
    service.metrics.failed_requests++;
    this.recordCircuitBreakerFailure(service.id);
}
{
    this.recordCircuitBreakerSuccess(service.id);
}
// Update average response time
const totalRequests = service.metrics.total_requests;
service.metrics.avg_response_time_ms =
    (service.metrics.avg_response_time_ms * (totalRequests - 1) + responseTimeMs) / totalRequests;
await this.metricsService.recordMetric('request_completed', 1, 'counter', {
    labels: {
        service_name: request.service_name,
        status_code: statusCode.toString(),
        success: (statusCode < 400).toString()
    }
});
try { }
catch (error) {
    this.logger.error('Failed to record request result', error instanceof Error ? error : new Error(String(error)), 'LoadBalancer');
}
async;
getServiceInstances(serviceName, string);
Promise < ServiceInstance[] > {
    return: this.services.get(serviceName) || []
};
async;
getLoadBalancerMetrics();
Promise < LoadBalancerMetrics > {
    const: allServices = Array.from(this.services.values()).flat(),
    const: allRequests = this.requests,
    const: totalRequests = allRequests.length,
    const: successfulRequests = allRequests.filter(r => r.status_code && r.status_code < 400).length,
    const: failedRequests = totalRequests - successfulRequests,
    const: completedRequests = allRequests.filter(r => r.response_time_ms),
    const: avgResponseTime = completedRequests.length > 0 ?
        completedRequests.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / completedRequests.length : 0,
    // Calculate RPS for last minute
    const: oneMinuteAgo = new Date(Date.now() - 60000),
    const: recentRequests = allRequests.filter(r => r.requested_at > oneMinuteAgo).length,
    const: requestsPerSecond = recentRequests / 60,
    const: healthyServices = allServices.filter(s => s.status === 'healthy').length,
    const: unhealthyServices = allServices.filter(s => s.status === 'unhealthy').length,
    const: openCircuitBreakers = Array.from(this.circuitBreakers.values()).filter(cb => cb.state === 'open').length,
    // Load distribution by service
    const: loadDistribution
};
{ }
;
allServices.forEach(service => {
    const serviceName = service.name;
    loadDistribution[serviceName] = (loadDistribution[serviceName] || 0) + service.metrics.total_requests;
});
// Error rates by service
const errorRates = {};
allServices.forEach(service => {
    const serviceName = service.name;
    const total = service.metrics.total_requests;
    const failed = service.metrics.failed_requests;
    errorRates[serviceName] = total > 0 ? failed / total : 0;
});
// Top errors
const errorCounts = {};
allRequests.filter(r => r.error_message).forEach(r => {
    const error = r.error_message;
    errorCounts[error] = (errorCounts[error] || 0) + 1;
});
const topErrors = Object.entries(errorCounts)
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
return {
    total_requests: totalRequests,
    successful_requests: successfulRequests,
    failed_requests: failedRequests,
    average_response_time_ms: avgResponseTime,
    requests_per_second: requestsPerSecond,
    active_services: allServices.length,
    healthy_services: healthyServices,
    unhealthy_services: unhealthyServices,
    circuit_breakers_open: openCircuitBreakers,
    load_distribution: loadDistribution,
    error_rates: errorRates,
    top_errors: topErrors,
    last_updated: new Date()
};
async;
getHealthStatus();
Promise < {
    status: 'healthy' | 'degraded' | 'unhealthy',
    details: (Record)
} > {
    try: {
        const: metrics = await this.getLoadBalancerMetrics(),
        const: errorRate = metrics.total_requests > 0 ? metrics.failed_requests / metrics.total_requests : 0,
        const: healthyServiceRatio = metrics.active_services > 0 ? metrics.healthy_services / metrics.active_services : 0,
        const: status = errorRate > 0.1 || healthyServiceRatio < 0.5 || metrics.circuit_breakers_open > 5 ? 'unhealthy' :
            errorRate > 0.05 || healthyServiceRatio < 0.8 || metrics.circuit_breakers_open > 2 ? 'degraded' : 'healthy',
        return: {
            status,
            details: {
                total_services: metrics.active_services,
                healthy_services: metrics.healthy_services,
                error_rate: errorRate,
                avg_response_time_ms: metrics.average_response_time_ms,
                requests_per_second: metrics.requests_per_second,
                circuit_breakers_open: metrics.circuit_breakers_open,
                initialized: this.isInitialized
            }
        }
    }, catch(error) {
        return {
            status: 'unhealthy',
            details: { error: error instanceof Error ? error.message : String(error) }
        };
    }
};
getApplicableRule(serviceName, string);
LoadBalancingRule | null;
{
    for (const rule of this.rules.values()) {
        if (rule.is_active && this.matchesPattern(serviceName, rule.service_pattern)) {
            return rule;
        }
    }
    return null;
}
matchesPattern(serviceName, string, pattern, string);
boolean;
{
    if (pattern === '*')
        return true;
    if (pattern === serviceName)
        return true;
    // Simple wildcard matching - in a real implementation use proper regex
    return pattern.includes('*') && serviceName.includes(pattern.replace('*', ''));
}
getHealthyServices(serviceName, string);
ServiceInstance[];
{
    const services = this.services.get(serviceName) || [];
    return services.filter(s => s.status === 'healthy');
}
selectServiceInstance(services, ServiceInstance[], rule, LoadBalancingRule, request, LoadBalancerRequest);
ServiceInstance | null;
{
    switch (rule.algorithm) {
        case 'round_robin':
            return this.selectRoundRobin(services, request.service_name);
        case 'weighted_round_robin':
            return this.selectWeightedRoundRobin(services);
        case 'least_connections':
            return this.selectLeastConnections(services);
        case 'ip_hash':
            return this.selectIpHash(services, request.client_ip);
        case 'random':
            return this.selectRandom(services);
        case 'least_response_time':
            return this.selectLeastResponseTime(services);
        default:
            return this.selectRoundRobin(services, request.service_name);
    }
}
selectRoundRobin(services, ServiceInstance[], serviceName, string);
ServiceInstance | null;
{
    if (services.length === 0)
        return null;
    const counter = this.roundRobinCounters.get(serviceName) || 0;
    const selected = services[counter % services.length];
    this.roundRobinCounters.set(serviceName, counter + 1);
    return selected;
}
selectWeightedRoundRobin(services, ServiceInstance[]);
ServiceInstance | null;
{
    if (services.length === 0)
        return null;
    const totalWeight = services.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    for (const service of services) {
        random -= service.weight;
        if (random <= 0) {
            return service;
        }
    }
    return services[0];
}
selectLeastConnections(services, ServiceInstance[]);
ServiceInstance | null;
{
    if (services.length === 0)
        return null;
    return services.reduce((min, current) => current.metrics.active_connections < min.metrics.active_connections ? current : min);
}
selectIpHash(services, ServiceInstance[], clientIp, string);
ServiceInstance | null;
{
    if (services.length === 0)
        return null;
    const hash = this.hashString(clientIp);
    return services[hash % services.length];
}
selectRandom(services, ServiceInstance[]);
ServiceInstance | null;
{
    if (services.length === 0)
        return null;
    return services[Math.floor(Math.random() * services.length)];
}
selectLeastResponseTime(services, ServiceInstance[]);
ServiceInstance | null;
{
    if (services.length === 0)
        return null;
    return services.reduce((min, current) => current.metrics.avg_response_time_ms < min.metrics.avg_response_time_ms ? current : min);
}
hashString(str, string);
number;
{
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}
findServiceById(serviceId, string);
ServiceInstance | null;
{
    for (const serviceInstances of this.services.values()) {
        const service = serviceInstances.find(s => s.id === serviceId);
        if (service)
            return service;
    }
    return null;
}
checkRateLimit(clientIp, string, rule, LoadBalancingRule);
boolean;
{
    // Simple rate limiting implementation
    // In a real implementation, use a proper rate limiting algorithm
    return true;
}
isCircuitBreakerAllowing(serviceId, string);
boolean;
{
    const circuitBreaker = this.circuitBreakers.get(serviceId);
    if (!circuitBreaker)
        return true;
    const now = new Date();
    switch (circuitBreaker.state) {
        case 'closed':
            return true;
        case 'open':
            if (circuitBreaker.next_retry_time && now >= circuitBreaker.next_retry_time) {
                circuitBreaker.state = 'half_open';
                circuitBreaker.half_open_calls = 0;
                return true;
            }
            return false;
        case 'half_open':
            return circuitBreaker.half_open_calls < 3; // Allow limited calls
    }
}
recordCircuitBreakerFailure(serviceId, string);
void {
    const: circuitBreaker = this.circuitBreakers.get(serviceId),
    if(, circuitBreaker) { }, return: ,
    circuitBreaker, : .failure_count++,
    circuitBreaker, : .last_failure_time = new Date(),
    if(circuitBreaker) { }, : .state === 'half_open'
};
{
    circuitBreaker.state = 'open';
    circuitBreaker.next_retry_time = new Date(Date.now() + 30000); // 30 seconds
}
if (circuitBreaker.state === 'closed' && circuitBreaker.failure_count >= 5) {
    circuitBreaker.state = 'open';
    circuitBreaker.next_retry_time = new Date(Date.now() + 30000);
}
recordCircuitBreakerSuccess(serviceId, string);
void {
    const: circuitBreaker = this.circuitBreakers.get(serviceId),
    if(, circuitBreaker) { }, return: ,
    if(circuitBreaker) { }, : .state === 'half_open'
};
{
    circuitBreaker.half_open_calls++;
    if (circuitBreaker.half_open_calls >= 3) {
        circuitBreaker.state = 'closed';
        circuitBreaker.failure_count = 0;
    }
}
if (circuitBreaker.state === 'closed') {
    circuitBreaker.failure_count = Math.max(0, circuitBreaker.failure_count - 1);
}
async;
performHealthCheck(service, ServiceInstance);
Promise < boolean > {
    try: {
        if(, service) { }, : .health_check.enabled, return: true,
        // Mock health check - in a real implementation, make actual HTTP requests
        const: isHealthy = Math.random() > 0.1, // 90% success rate for demo
        if(isHealthy) {
            service.consecutive_successes++;
            service.consecutive_failures = 0;
            if (service.status !== 'healthy' &&
                service.consecutive_successes >= service.health_check.healthy_threshold) {
                service.status = 'healthy';
                `
          this.logger.log(Service ${service.name}`($, { service, : .id });
                is;
                now;
                healthy, 'LoadBalancer';
                ;
            }
        }, else: {
            service, : .consecutive_failures++,
            service, : .consecutive_successes = 0,
            if(service) { }, : .status !== 'unhealthy' && `
            service.consecutive_failures >= service.health_check.unhealthy_threshold) {`,
            service, : .status = 'unhealthy',
            this: .logger.warn(Service, $, { service, : .name } ` (${service.id}) is now unhealthy, 'LoadBalancer');
        }
      }

      service.last_health_check = new Date();
      return isHealthy;

    } catch (error) {
      service.consecutive_failures++;
      service.consecutive_successes = 0;
      service.status = 'unhealthy';`, service.last_health_check = new Date())
        } `
      
      this.logger.error(Health check failed for service ${service.id}`, error, instanceof: Error ? error : new Error(String(error)), 'LoadBalancer': ,
        return: false
    }
};
startHealthChecks();
void {
    this: .healthCheckInterval = setInterval(async () => {
        const allServices = Array.from(this.services.values()).flat();
        for (const service of allServices) {
            if (service.health_check.enabled) {
                await this.performHealthCheck(service);
            }
        }
    }, 30000)
};
startMetricsCollection();
void {
    setInterval(async) { }
}();
{
    const metrics = await this.getLoadBalancerMetrics();
    await this.metricsService.recordMetric('lb_total_requests', metrics.total_requests, 'gauge', { labels: {} });
    await this.metricsService.recordMetric('lb_healthy_services', metrics.healthy_services, 'gauge', { labels: {} });
    await this.metricsService.recordMetric('lb_requests_per_second', metrics.requests_per_second, 'gauge', { labels: {} });
    await this.metricsService.recordMetric('lb_avg_response_time', metrics.average_response_time_ms, 'gauge', { labels: {} });
}
30000;
; // Every 30 seconds
startCleanupTasks();
void {
    setInterval() { }
}();
{
    // Clean up old requests (keep last 24 hours)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.requests = this.requests.filter(r => r.requested_at > cutoffTime);
}
60 * 60 * 1000;
; // Every hour
exports.default = LoadBalancer;
//# sourceMappingURL=LoadBalancer.js.map