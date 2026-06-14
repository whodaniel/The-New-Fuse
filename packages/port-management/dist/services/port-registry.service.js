// packages/port-management/src/services/port-registry.service.ts
import { EventEmitter } from 'events';
import * as net from 'net';
import { execFileSync } from 'node:child_process';
import * as portfinder from 'portfinder';
import { checkPort } from 'node-port-check'; // Import checkPort from node-port-check
const DEFAULT_RUNTIME_PORTS = [
    { port: 3000, serviceName: 'api-gateway/ws-bridge', protected: false }, // Updated for clarity and conflict resolution
    { port: 3001, serviceName: 'api/backend', protected: false },
    { port: 3004, serviceName: 'backend', protected: false },
    { port: 3005, serviceName: 'api-gateway/ws-bridge-alt', protected: false }, // Renamed for clarity
    { port: 3006, serviceName: 'skideancer/ws', protected: false },
    { port: 3007, serviceName: 'skideancer/ide', protected: false },
    { port: 3008, serviceName: 'skideancer websocket', protected: true },
    { port: 5173, serviceName: 'vite', protected: false },
    { port: 5174, serviceName: 'vite-alt', protected: false },
    { port: 5555, serviceName: 'drizzle-studio', protected: true },
    { port: 6379, serviceName: 'redis', protected: true },
    { port: 5432, serviceName: 'postgres', protected: true },
];
function run(command, args) {
    try {
        return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    }
    catch {
        return '';
    }
}
function parsePortList(value) {
    return String(value || '')
        .split(',')
        .map((item) => Number.parseInt(item.trim(), 10))
        .filter(Number.isInteger);
}
export class PortRegistryService extends EventEmitter {
    constructor() {
        super();
        this.registry = new Map();
        this.configurations = new Map();
        this.monitoringInterval = null;
        this.loadConfigurations();
    }
    /**
     * Register a port for a service
     */
    async registerPort(config) {
        const { serviceName, serviceType, environment, host = 'localhost', protocol = 'http', healthCheckUrl, metadata = {} } = config;
        let { port } = config;
        // If no port specified, find an available one
        if (!port) {
            port = await this.findAvailablePort(serviceName, environment);
        }
        const registration = {
            id: `${serviceName}-${environment}-${port}`,
            port,
            serviceName,
            serviceType,
            environment: environment,
            status: 'active',
            host,
            protocol,
            healthCheckUrl,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata
        };
        this.registry.set(registration.id, registration);
        this.emit('portRegistered', registration);
        return registration;
    }
    /**
     * Find an available port for a service
     */
    async findAvailablePort(serviceName, environment) {
        const config = this.getServiceConfiguration(serviceName, environment);
        // Retry finding and reserving a port until successful
        for (let i = 0; i < 10; i++) { // Max 10 retries to prevent infinite loops
            try {
                const potentialPort = await portfinder.getPortPromise({
                    port: config.preferredPort || config.portRangeMin,
                    stopPort: config.portRangeMax,
                });
                const isReserved = await this.reservePort(potentialPort);
                if (isReserved) {
                    return potentialPort;
                }
            }
            catch (err) {
                // If portfinder fails, it's likely no ports are available in the range
                // We'll let the loop continue for other attempts, but eventually throw
            }
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay before retrying
        }
        throw new Error(`No available and reservable ports found for service ${serviceName} in environment ${environment} within range ${config.portRangeMin}-${config.portRangeMax} after multiple attempts.`);
    }
    /**
     * Check if a port is available
     */
    async isPortAvailable(port, host = 'localhost') {
        // Use node-port-check for port availability
        return checkPort(port, host).then(() => true).catch(() => false);
    }
    /**
     * Detect port conflicts
     */
    async detectConflicts() {
        const byPort = new Map();
        for (const registration of this.registry.values()) {
            const registrations = byPort.get(registration.port) || [];
            registrations.push(registration);
            byPort.set(registration.port, registrations);
        }
        return Array.from(byPort.entries())
            .filter(([, registrations]) => registrations.length > 1)
            .map(([port, conflictingServices]) => ({
            port,
            conflictingServices,
            suggestedResolutions: conflictingServices.slice(1).map((registration) => ({
                type: 'reassign',
                targetService: registration.id,
                description: `Reassign ${registration.serviceName} from shared port ${port}`,
            })),
        }));
    }
    getRuntimePortCatalog(extraPorts = []) {
        const byPort = new Map();
        for (const entry of [...DEFAULT_RUNTIME_PORTS, ...extraPorts]) {
            byPort.set(entry.port, entry);
        }
        return Array.from(byPort.values()).sort((a, b) => a.port - b.port);
    }
    inspectRuntimePorts(extraPorts = []) {
        return this.getRuntimePortCatalog(extraPorts).map((entry) => {
            const processes = this.findProcessesOnPort(entry.port);
            return {
                ...entry,
                status: processes.length > 0 ? 'occupied' : 'clear',
                processes,
            };
        });
    }
    detectRuntimeConflicts(options = {}) {
        const allowed = new Set([
            ...parsePortList(process.env.TNF_PORTS_ALLOW_OCCUPIED),
            ...(options.allowOccupiedPorts || []),
        ]);
        const blocked = this.inspectRuntimePorts(options.extraPorts).filter((entry) => {
            if (entry.status !== 'occupied')
                return false;
            if (entry.protected && !options.includeProtected)
                return false;
            return !allowed.has(entry.port);
        });
        return {
            ok: blocked.length === 0,
            blocked,
            allowedOccupiedPorts: Array.from(allowed).sort((a, b) => a - b),
        };
    }
    /**
     * Reassign a port
     */
    async reassignPort(serviceId, newPort) {
        const registration = this.registry.get(serviceId);
        if (!registration) {
            throw new Error(`Service registration ${serviceId} not found`);
        }
        registration.port = newPort;
        registration.updatedAt = new Date();
        this.registry.set(serviceId, registration);
    }
    /**
     * Get service configuration
     */
    getServiceConfiguration(serviceName, environment) {
        const key = `${serviceName}-${environment}`;
        return this.configurations.get(key) || {
            serviceName,
            environment,
            fallbackPorts: [],
            autoAssign: true,
            portRangeMin: 3000,
            portRangeMax: 9999
        };
    }
    /**
     * Load service configurations
     */
    async loadConfigurations() {
        const defaultConfigs = [
            {
                serviceName: 'frontend',
                environment: 'development',
                preferredPort: 3002,
                fallbackPorts: [3010, 3020, 3030],
                autoAssign: true,
                portRangeMin: 3000,
                portRangeMax: 3099
            },
            {
                serviceName: 'api',
                environment: 'development',
                preferredPort: 3001,
                fallbackPorts: [3011, 3021, 3031],
                autoAssign: true,
                portRangeMin: 3001,
                portRangeMax: 3199
            },
            {
                serviceName: 'api-gateway/ws-bridge',
                environment: 'development',
                preferredPort: 3005,
                fallbackPorts: [3015, 3025, 3035],
                autoAssign: true,
                portRangeMin: 3005,
                portRangeMax: 3105
            }
        ];
        for (const config of defaultConfigs) {
            const key = `${config.serviceName}-${config.environment}`;
            this.configurations.set(key, config);
        }
    }
    getAllRegistrations() {
        return Array.from(this.registry.values());
    }
    findByPort(port) {
        return Array.from(this.registry.values()).find(reg => reg.port === port);
    }
    findProcessesOnPort(port) {
        const pids = this.findPidsWithLsof(port);
        const fallbackPids = pids.length > 0 ? [] : this.findPidsWithSs(port);
        return Array.from(new Set([...pids, ...fallbackPids])).map((pid) => ({
            pid,
            command: this.getPidCommand(pid),
        }));
    }
    findPidsWithLsof(port) {
        return run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'])
            .split(/\s+/)
            .map((value) => Number.parseInt(value, 10))
            .filter(Number.isInteger);
    }
    findPidsWithSs(port) {
        const pids = new Set();
        for (const match of run('ss', ['-ltnp', `sport = :${port}`]).matchAll(/pid=(\d+)/g)) {
            pids.add(Number.parseInt(match[1], 10));
        }
        return Array.from(pids);
    }
    getPidCommand(pid) {
        return run('ps', ['-p', String(pid), '-o', 'comm=']).trim() || 'unknown';
    }
    /**
     * Temporarily binds to a port to reserve it.
     * Returns true if the port was successfully reserved, false otherwise.
     */
    async reservePort(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.listen(port, 'localhost', () => {
                server.close(() => {
                    resolve(true);
                });
            });
            server.on('error', () => {
                resolve(false);
            });
        });
    }
    getByService(serviceName, environment) {
        return Array.from(this.registry.values()).filter(reg => reg.serviceName === serviceName &&
            (!environment || reg.environment === environment));
    }
    destroy() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.removeAllListeners();
    }
}
//# sourceMappingURL=port-registry.service.js.map