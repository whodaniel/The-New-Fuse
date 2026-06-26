// packages/port-management/src/services/port-registry.service.ts
import { EventEmitter } from 'events';
import * as net from 'net';
import { checkPort } from 'node-port-check'; // Import checkPort from node-port-check
import { execFileSync } from 'node:child_process';
import * as portfinder from 'portfinder';
// Mock Redis client and lock functions for now
const mockRedisClient = {
    connect: async () => { }, // Mock connect
    disconnect: async () => { }, // Mock disconnect
    setnx: async (key, value) => {
        // Mock setnx (set if not exists)
        const isLocked = process.env[key] === 'locked';
        if (!isLocked) {
            process.env[key] = 'locked';
            return 1; // Successfully acquired lock
        }
        return 0; // Failed to acquire lock
    },
    del: async (key) => {
        // Mock del
        delete process.env[key];
        return 1; // Successfully released lock
    },
};
const DEFAULT_RUNTIME_PORTS = [
    { port: 3001, serviceName: 'api/backend', protected: false },
    { port: 3004, serviceName: 'backend', protected: false },
    { port: 3003, serviceName: 'api-gateway/ws-bridge-secondary', protected: false },
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
        this.temporaryReservations = new Map();
        this.redisClient = mockRedisClient; // Initialize mock client
        this.redisClient.connect().catch(console.error); // Connect mock client
        this.loadConfigurations();
    }
    /**
     * Register a port for a service
     */
    async registerPort(config) {
        const { serviceName, serviceType, environment, host = 'localhost', protocol = 'http', healthCheckUrl, metadata = {}, } = config;
        let { port } = config;
        let preReservedPort = false;
        // If no port specified, find an available one using the new robust method
        if (!port) {
            port = await this.findAvailablePort(serviceName, environment);
            preReservedPort = true; // Flag that this port was temporarily reserved by findAvailablePort
        }
        else {
            // MODIFIED: Directly attempt to temporarily reserve the explicitly provided port
            const reservedServer = await this.reservePortTemporarily(port);
            if (!reservedServer) {
                throw new Error(`Failed to acquire temporary reservation or lock for explicitly provided port ${port}. It might be in use or have been taken concurrently.`);
            }
            preReservedPort = true; // Mark as pre-reserved
            const lockAcquired = await this.acquirePortLock(port);
            if (!lockAcquired) {
                throw new Error(`Failed to acquire a lock for explicitly provided port ${port}. Another process might be holding it.`);
            }
        }
        const registration = {
            id: `${serviceName}-${environment}-${port}`,
            port: port,
            serviceName,
            serviceType,
            environment: environment,
            status: 'active',
            host,
            protocol,
            healthCheckUrl,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata,
        };
        this.registry.set(registration.id, registration);
        this.emit('portRegistered', registration);
        // If the port was pre-reserved by this instance, release the temporary hold
        if (preReservedPort) {
            this.releaseTemporaryReservation(port);
        }
        else {
            // If not pre-reserved, but an explicit port was given and locked, release the lock
            await this.releasePortLock(port);
        }
        return registration;
    }
    // New helper to release temporary reservation
    releaseTemporaryReservation(port) {
        const server = this.temporaryReservations.get(port);
        if (server) {
            server.close(() => {
                this.temporaryReservations.delete(port);
                // console.log(`Temporary reservation for port ${port} released by PortRegistryService.`);
            });
        }
    }
    /**
     * Find an available port for a service
     */
    async findAvailablePort(serviceName, environment) {
        const config = this.getServiceConfiguration(serviceName, environment);
        // Retry finding and reserving a port until successful
        for (let i = 0; i < 20; i++) {
            // Max 20 retries
            try {
                const potentialPort = await portfinder.getPortPromise({
                    port: config.preferredPort || config.portRangeMin,
                    stopPort: config.portRangeMax,
                });
                const reservedServer = await this.reservePortTemporarily(potentialPort);
                // Try to acquire a lock before attempting to bind
                const lockAcquired = await this.acquirePortLock(potentialPort);
                if (lockAcquired) {
                    const reservedServer = await this.reservePortTemporarily(potentialPort);
                    if (reservedServer) {
                        return potentialPort;
                    }
                    else {
                        // If temporary reservation failed, release the lock
                        await this.releasePortLock(potentialPort);
                    }
                }
            }
            catch (err) {
                // Log the error but continue retrying
                console.error(`Error in findAvailablePort for ${serviceName}-${environment}:`, err);
            }
            await new Promise((resolve) => setTimeout(resolve, 50 * (i + 1))); // Exponential backoff before retrying
        }
        throw new Error(`No available and reservable ports found for service ${serviceName} in environment ${environment} within range ${config.portRangeMin}-${config.portRangeMax} after multiple attempts.`);
    }
    /**
     * Check if a port is available
     */
    async isPortAvailable(port, host = 'localhost') {
        // Use node-port-check for port availability
        return checkPort(port, host)
            .then(() => true)
            .catch(() => false);
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
        return (this.configurations.get(key) || {
            serviceName,
            environment,
            fallbackPorts: [],
            autoAssign: true,
            portRangeMin: 3000,
            portRangeMax: 9999,
        });
    }
    /**
     * Load service configurations
     */
    async loadConfigurations() {
        const defaultConfigs = [
            {
                serviceName: 'frontend',
                environment: 'development',
                preferredPort: 3000,
                fallbackPorts: [3010, 3020, 3030],
                autoAssign: true,
                portRangeMin: 3000,
                portRangeMax: 3099,
            },
            {
                serviceName: 'api',
                environment: 'development',
                preferredPort: 3001,
                fallbackPorts: [3011, 3021, 3031],
                autoAssign: true,
                portRangeMin: 3001,
                portRangeMax: 3199,
            },
            {
                serviceName: 'api-gateway/ws-bridge',
                environment: 'development',
                preferredPort: 3005,
                fallbackPorts: [3015, 3025, 3035],
                autoAssign: true,
                portRangeMin: 3005,
                portRangeMax: 3105,
            },
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
        return Array.from(this.registry.values()).find((reg) => reg.port === port);
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
     * Temporarily binds to a port to reserve it. Keeps the server open.
     * Returns the server instance if the port was successfully reserved, null otherwise.
     */
    /**
     * Temporarily binds to a port to reserve it. Keeps the server open.
     * Assumes a lock for this port has already been acquired if this is called after findAvailablePort.
     * Returns the server instance if the port was successfully reserved, null otherwise.
     */
    async reservePortTemporarily(port) {
        return new Promise((resolve) => {
            // No need to acquire lock here, as it should be acquired before calling this function.
            // This function only attempts to bind the port physically.
            const server = net.createServer();
            server.listen(port, 'localhost', () => {
                // Port successfully bound, keep it open temporarily
                this.temporaryReservations.set(port, server);
                resolve(server); // Return the server instance
            });
            server.on('error', (err) => {
                // Port not available or other error
                if (err.code === 'EADDRINUSE') {
                    resolve(null); // Port in use
                }
                else {
                    console.error(`Error attempting to temporarily reserve port ${port}:`, err);
                    resolve(null);
                }
            });
        });
    }
    getByService(serviceName, environment) {
        return Array.from(this.registry.values()).filter((reg) => reg.serviceName === serviceName && (!environment || reg.environment === environment));
    }
    async acquirePortLock(port, timeoutMs = 2000) {
        const lockKey = `port_lock:${port}`;
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            try {
                const acquired = await this.redisClient.setnx(lockKey, 'locked');
                if (acquired === 1) {
                    // console.log(`Acquired lock for port ${port}`);
                    return true;
                }
            }
            catch (err) {
                console.error(`Error acquiring Redis lock for port ${port}:`, err);
                // In case of Redis error, proceed without lock to avoid blocking indefinitely
                return true;
            }
            await new Promise((resolve) => setTimeout(resolve, 100)); // Wait a bit before retrying
        }
        console.warn(`Failed to acquire lock for port ${port} after ${timeoutMs}ms.`);
        return false;
    }
    async releasePortLock(port) {
        const lockKey = `port_lock:${port}`;
        try {
            await this.redisClient.del(lockKey);
            // console.log(`Released lock for port ${port}`);
        }
        catch (err) {
            console.error(`Error releasing Redis lock for port ${port}:`, err);
        }
    }
    destroy() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.removeAllListeners();
        // Disconnect Redis client on destroy
        this.redisClient.disconnect().catch(console.error);
    }
}
//# sourceMappingURL=port-registry.service.js.map