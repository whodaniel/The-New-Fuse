#!/usr/bin/env node

/**
 * Infrastructure Scalability Validator
 * Comprehensive validation of infrastructure scalability, auto-scaling, and resource management
 * Designed to ensure platform can handle millions of concurrent users
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class InfrastructureScalabilityValidator {
    constructor() {
        this.config = null;
        this.validationResults = [];
        this.metrics = {
            startTime: null,
            endTime: null,
            infrastructure: {},
            scalability: {},
            performance: {}
        };
        this.outputDir = 'test-results/infrastructure-validation';
        this.criticalIssues = [];
        this.warnings = [];
    }

    async initialize() {
        console.log('🏗️  Initializing Infrastructure Scalability Validator...');
        
        await this.loadConfiguration();
        await this.setupValidationEnvironment();
        await this.detectInfrastructureType();
        
        this.metrics.startTime = new Date();
        console.log('✅ Infrastructure validator initialized');
    }

    async loadConfiguration() {
        try {
            // Load deployment configuration
            const deploymentConfigPath = path.join(process.cwd(), 'config/deployment-config.ts');
            const deploymentConfig = await this.loadTypeScriptConfig(deploymentConfigPath);
            
            this.config = {
                deployment: deploymentConfig,
                validation: {
                    targetUsers: 1000000, // 1 million users
                    expectedThroughput: 100000, // 100k requests/second
                    maxResponseTime: 200, // 200ms
                    availabilityTarget: 99.99, // 99.99% uptime
                    scalingThresholds: {
                        cpu: 70, // Scale at 70% CPU
                        memory: 80, // Scale at 80% memory
                        connections: 10000 // Scale at 10k connections per instance
                    }
                }
            };
            
            console.log('📋 Configuration loaded successfully');
        } catch (error) {
            console.warn('⚠️  Could not load deployment config, using defaults');
            this.config = { validation: {} };
        }
    }

    async loadTypeScriptConfig(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            // Simple TypeScript config parsing (would use proper parser in production)
            const configMatch = content.match(/export\s+const\s+\w+\s*=\s*({[\s\S]*?});/);
            if (configMatch) {
                // This is a simplified approach - in production, use proper TS parser
                return JSON.parse(configMatch[1].replace(/(\w+):/g, '"$1":'));
            }
        } catch (error) {
            console.warn(`Could not parse TypeScript config: ${error.message}`);
        }
        return {};
    }

    async setupValidationEnvironment() {
        await fs.mkdir(this.outputDir, { recursive: true });
        console.log(`📁 Validation environment setup at ${this.outputDir}`);
    }

    async detectInfrastructureType() {
        console.log('🔍 Detecting infrastructure type...');
        
        const infraTypes = {
            kubernetes: await this.checkKubernetes(),
            docker: await this.checkDocker(),
            aws: await this.checkAWS(),
            gcp: await this.checkGCP(),
            azure: await this.checkAzure(),
            nginx: await this.checkNginx(),
            redis: await this.checkRedis(),
            postgresql: await this.checkPostgreSQL()
        };
        
        this.metrics.infrastructure.types = infraTypes;
        
        const detectedTypes = Object.entries(infraTypes)
            .filter(([_, detected]) => detected)
            .map(([type, _]) => type);
        
        console.log(`📊 Detected infrastructure: ${detectedTypes.join(', ')}`);
        return detectedTypes;
    }

    async checkKubernetes() {
        try {
            await execAsync('kubectl version --client');
            const { stdout } = await execAsync('kubectl cluster-info');
            return stdout.includes('Kubernetes');
        } catch (error) {
            return false;
        }
    }

    async checkDocker() {
        try {
            await execAsync('docker --version');
            return true;
        } catch (error) {
            return false;
        }
    }

    async checkAWS() {
        try {
            await execAsync('aws --version');
            return true;
        } catch (error) {
            return false;
        }
    }

    async checkGCP() {
        try {
            await execAsync('gcloud --version');
            return true;
        } catch (error) {
            return false;
        }
    }

    async checkAzure() {
        try {
            await execAsync('az --version');
            return true;
        } catch (error) {
            return false;
        }
    }

    async checkNginx() {
        try {
            const { stdout } = await execAsync('nginx -v 2>&1');
            return stdout.includes('nginx');
        } catch (error) {
            return false;
        }
    }

    async checkRedis() {
        try {
            await execAsync('redis-cli --version');
            return true;
        } catch (error) {
            return false;
        }
    }

    async checkPostgreSQL() {
        try {
            await execAsync('psql --version');
            return true;
        } catch (error) {
            return false;
        }
    }

    async validateInfrastructureScalability() {
        console.log('🚀 Validating Infrastructure Scalability...');
        
        const validations = [
            this.validateContainerOrchestration(),
            this.validateLoadBalancing(),
            this.validateAutoScaling(),
            this.validateResourceLimits(),
            this.validateNetworkCapacity(),
            this.validateStorageScalability(),
            this.validateCacheScalability(),
            this.validateDatabaseScalability(),
            this.validateMonitoringCapability(),
            this.validateSecurityScalability()
        ];
        
        const results = await Promise.allSettled(validations);
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                this.validationResults.push(result.value);
            } else {
                console.error(`❌ Validation ${index + 1} failed:`, result.reason);
                this.criticalIssues.push({
                    category: 'infrastructure',
                    issue: `Validation ${index + 1} failed`,
                    error: result.reason.message,
                    severity: 'critical'
                });
            }
        });
        
        console.log('✅ Infrastructure scalability validation completed');
    }

    async validateContainerOrchestration() {
        console.log('  🐳 Validating container orchestration...');
        
        const validation = {
            name: 'Container Orchestration',
            category: 'infrastructure',
            status: 'unknown',
            score: 0,
            details: {},
            recommendations: []
        };
        
        if (this.metrics.infrastructure.types.kubernetes) {
            try {
                // Check Kubernetes cluster capacity
                const { stdout: nodesOutput } = await execAsync('kubectl get nodes -o json');
                const nodes = JSON.parse(nodesOutput);
                
                const nodeCount = nodes.items.length;
                const totalCPU = nodes.items.reduce((sum, node) => {
                    const cpu = node.status.capacity?.cpu || '0';
                    return sum + parseInt(cpu.replace(/[^\d]/g, ''));
                }, 0);
                
                const totalMemory = nodes.items.reduce((sum, node) => {
                    const memory = node.status.capacity?.memory || '0Ki';
                    const memoryBytes = this.parseMemoryToBytes(memory);
                    return sum + memoryBytes;
                }, 0);
                
                validation.details = {
                    platform: 'Kubernetes',
                    nodeCount,
                    totalCPU,
                    totalMemoryGB: Math.round(totalMemory / 1024 / 1024 / 1024),
                    estimatedCapacity: Math.floor(totalCPU * 1000) // Rough estimate
                };
                
                // Score based on capacity
                if (nodeCount >= 10 && totalCPU >= 100) {
                    validation.score = 90;
                    validation.status = 'excellent';
                } else if (nodeCount >= 5 && totalCPU >= 50) {
                    validation.score = 70;
                    validation.status = 'good';
                } else {
                    validation.score = 40;
                    validation.status = 'needs_improvement';
                    validation.recommendations.push('Increase cluster size for million-user capacity');
                }
                
            } catch (error) {
                validation.status = 'error';
                validation.error = error.message;
            }
        } else if (this.metrics.infrastructure.types.docker) {
            validation.details = { platform: 'Docker' };
            validation.score = 50;
            validation.status = 'basic';
            validation.recommendations.push('Consider container orchestration (Kubernetes) for better scalability');
        } else {
            validation.score = 20;
            validation.status = 'critical';
            validation.recommendations.push('Implement container orchestration for scalability');
        }
        
        return validation;
    }

    async validateLoadBalancing() {
        console.log('  ⚖️  Validating load balancing...');
        
        const validation = {
            name: 'Load Balancing',
            category: 'networking',
            status: 'unknown',
            score: 0,
            details: {},
            recommendations: []
        };
        
        try {
            // Check for common load balancers
            const loadBalancers = [];
            
            if (this.metrics.infrastructure.types.nginx) {
                loadBalancers.push('Nginx');
                validation.score += 30;
            }
            
            if (this.metrics.infrastructure.types.kubernetes) {
                // Check for Kubernetes services
                const { stdout } = await execAsync('kubectl get services -o json');
                const services = JSON.parse(stdout);
                const lbServices = services.items.filter(s => s.spec.type === 'LoadBalancer');
                
                if (lbServices.length > 0) {
                    loadBalancers.push('Kubernetes LoadBalancer');
                    validation.score += 40;
                }
            }
            
            validation.details = {
                loadBalancers,
                count: loadBalancers.length
            };
            
            if (validation.score >= 70) {
                validation.status = 'excellent';
            } else if (validation.score >= 40) {
                validation.status = 'good';
                validation.recommendations.push('Consider additional load balancing layers');
            } else {
                validation.status = 'critical';
                validation.recommendations.push('Implement proper load balancing for million-user capacity');
            }
            
        } catch (error) {
            validation.status = 'error';
            validation.error = error.message;
        }
        
        return validation;
    }

    async validateAutoScaling() {
        console.log('  📈 Validating auto-scaling capabilities...');
        
        const validation = {
            name: 'Auto-Scaling',
            category: 'scalability',
            status: 'unknown',
            score: 0,
            details: {},
            recommendations: []
        };
        
        try {
            if (this.metrics.infrastructure.types.kubernetes) {
                // Check for Horizontal Pod Autoscaler
                const { stdout: hpaOutput } = await execAsync('kubectl get hpa -o json');
                const hpas = JSON.parse(hpaOutput);
                
                // Check for Vertical Pod Autoscaler (if available)
                let vpas = { items: [] };
                try {
                    const { stdout: vpaOutput } = await execAsync('kubectl get vpa -o json');
                    vpas = JSON.parse(vpaOutput);
                } catch (error) {
                    // VPA might not be installed
                }
                
                // Check for Cluster Autoscaler (node-level scaling)
                const { stdout: nodesOutput } = await execAsync('kubectl get nodes -o json');
                const nodes = JSON.parse(nodesOutput);
                const hasClusterAutoscaler = nodes.items.some(node => 
                    node.metadata.annotations?.['cluster-autoscaler.kubernetes.io/scale-down-disabled']
                );
                
                validation.details = {
                    horizontalPodAutoscalers: hpas.items.length,
                    verticalPodAutoscalers: vpas.items.length,
                    clusterAutoscaler: hasClusterAutoscaler,
                    scalingPolicies: hpas.items.map(hpa => ({
                        name: hpa.metadata.name,
                        minReplicas: hpa.spec.minReplicas,
                        maxReplicas: hpa.spec.maxReplicas,
                        targetCPU: hpa.spec.targetCPUUtilizationPercentage
                    }))
                };
                
                let score = 0;
                if (hpas.items.length > 0) score += 40;
                if (vpas.items.length > 0) score += 20;
                if (hasClusterAutoscaler) score += 30;
                
                validation.score = score;
                
                if (score >= 80) {
                    validation.status = 'excellent';
                } else if (score >= 50) {
                    validation.status = 'good';
                } else {
                    validation.status = 'needs_improvement';
                    validation.recommendations.push('Implement comprehensive auto-scaling (HPA, VPA, Cluster Autoscaler)');
                }
                
            } else {
                validation.score = 20;
                validation.status = 'basic';
                validation.recommendations.push('Implement auto-scaling mechanisms for dynamic load handling');
            }
            
        } catch (error) {
            validation.status = 'error';
            validation.error = error.message;
        }
        
        return validation;
    }

    async validateResourceLimits() {
        console.log('  💾 Validating resource limits and quotas...');
        
        const validation = {
            name: 'Resource Limits',
            category: 'resource_management',
            status: 'unknown',
            score: 0,
            details: {},
            recommendations: []
        };
        
        try {
            if (this.metrics.infrastructure.types.kubernetes) {
                // Check resource quotas
                const { stdout: quotaOutput } = await execAsync('kubectl get resourcequota -o json');
                const quotas = JSON.parse(quotaOutput);
                
                // Check limit ranges
                const { stdout: limitOutput } = await execAsync('kubectl get limitrange -o json');
                const limits = JSON.parse(limitOutput);
                
                // Check pod resource specifications
                const { stdout: podsOutput } = await execAsync('kubectl get pods -o json');
                const pods = JSON.parse(podsOutput);
                
                const podsWithLimits = pods.items.filter(pod => 
                    pod.spec.containers.some(container => 
                        container.resources?.limits || container.resources?.requests
                    )
                );
                
                validation.details = {
                    resourceQuotas: quotas.items.length,
                    limitRanges: limits.items.length,
                    totalPods: pods.items.length,
                    podsWithResourceLimits: podsWithLimits.length,
                    resourceLimitCoverage: pods.items.length > 0 ? 
                        (podsWithLimits.length / pods.items.length * 100).toFixed(1) + '%' : '0%'
                };
                
                let score = 0;
                if (quotas.items.length > 0) score += 30;
                if (limits.items.length > 0) score += 30;
                if (podsWithLimits.length / pods.items.length > 0.8) score += 40;
                
                validation.score = score;
                
                if (score >= 80) {
                    validation.status = 'excellent';
                } else if (score >= 50) {
                    validation.status = 'good';
                } else {
                    validation.status = 'needs_improvement';
                    validation.recommendations.push('Implement comprehensive resource limits and quotas');
                }
                
            } else {
                validation.score = 30;
                validation.status = 'basic';
                validation.recommendations.push('Implement resource management and limits');
            }
            
        } catch (error) {
            validation.status = 'error';
            validation.error = error.message;
        }
        
        return validation;
    }

    async validateNetworkCapacity() {
        console.log('  🌐 Validating network capacity...');
        
        const validation = {
            name: 'Network Capacity',
            category: 'networking',
            status: 'unknown',
            score: 0,
            details: {},
            recommendations: []
        };
        
        try {
            // Check network interfaces and capacity
            const { stdout: ifconfigOutput } = await execAsync('ifconfig || ip addr show');
            const networkInterfaces = this.parseNetworkInterfaces(ifconfigOutput);
            
            // Estimate network capacity
            const totalBandwidth = networkInterfaces.reduce((sum, iface) => {
                // Rough estimation based on interface type
                if (iface.name.includes('eth') || iface.name.includes('en')) {
                    return sum + 1000; // Assume 1Gbps for ethernet
                }
                return sum;
            }, 0);
            
            validation.details = {
                networkInterfaces: networkInterfaces.length,
                estimatedBandwidthMbps: totalBandwidth,
                interfaces: networkInterfaces.map(iface => ({
                    name: iface.name,
                    status: iface.status
                }))
            };
            
            // Score based on estimated capacity
            if (totalBandwidth >= 10000) { // 10Gbps+
                validation.score = 90;
                validation.status = 'excellent';
            } else if (totalBandwidth >= 1000) { // 1Gbps+
                validation.score = 70;
                validation.status = 'good';
            } else {
                validation.score = 40;
                validation.status = 'needs_improvement';
                validation.recommendations.push('Increase network bandwidth for million-user capacity');
            }
            
        } catch (error) {
            validation.status = 'error';
            validation.error = error.message;
        }
        
        return validation;
    }

    async validateStorageScalability() {
        console.log('  💿 Validating storage scalability...');
        
        const validation = {
            name: 'Storage Scalability',
            category: 'storage',
            status: 'unknown',
            score: 0,
            details: {},
            recommendations: []
        };
        
        try {
            // Check disk space and performance
            const { stdout: dfOutput } = await execAsync('df -h');
            const diskInfo = this.parseDiskInfo(dfOutput);
            
            // Check for persistent volumes in Kubernetes
            let pvInfo = null;
            if (this.metrics.infrastructure.types.kubernetes) {
                try {
                    const { stdout: pvOutput } = await execAsync('kubectl get pv -o json');
                    const pvs = JSON.parse(pvOutput);
                    pvInfo = {
                        persistentVolumes: pvs.items.length,
                        totalCapacity: pvs.items.reduce((sum, pv) => {
                            const capacity = pv.spec.capacity?.storage || '0Gi';
                            return sum + this.parseStorageToBytes(capacity);
                        }, 0)
                    };
                } catch (error) {
                    // PVs might not be configured
                }
            }
            
            validation.details = {
                diskInfo,
                persistentVolumes: pvInfo,
                totalDiskSpaceGB: diskInfo.reduce((sum, disk) => sum + disk.totalGB, 0),
                availableSpaceGB: diskInfo.reduce((sum, disk) => sum + disk.availableGB, 0)
            };
            
            const totalSpace = validation.details.totalDiskSpaceGB;
            const availableSpace = validation.details.availableSpaceGB;
            
            // Score based on available storage
            if (totalSpace >= 1000 && availableSpace >= 500) { // 1TB+ total, 500GB+ available
                validation.score = 90;
                validation.status = 'excellent';
            } else if (totalSpace >= 500 && availableSpace >= 200) {
                validation.score = 70;
                validation.status = 'good';
            } else {
                validation.score = 40;
                validation.status = 'needs_improvement';
                validation.recommendations.push('Increase storage capacity for million-user data requirements');
            }
            
        } catch (error) {
            validation.status = 'error';
            validation.error = error.message;
        }
        
        return validation;
    }

    async validateCacheScalability() {
        console.log('  🚀 Validating cache scalability...');
        
        const validation = {
            name: 'Cache Scalability',
            category: 'caching',
            status: 'unknown',
            score: 0,
            details: {},
            recommendations: []
        };
        
        try {
            let cacheInfo = {};
            
            if (this.metrics.infrastructure.types.redis) {
                // Check Redis configuration
                try {
                    const { stdout: redisInfo } = await execAsync('redis-cli info memory');
                    const memoryInfo = this.parseRedisInfo(redisInfo);
                    
                    cacheInfo.redis = {
                        available: true,
                        memoryUsed: memoryInfo.used_memory_human,
                        maxMemory: memoryInfo.maxmemory_human || 'unlimited',
                        connectedClients: memoryInfo.connected_clients
                    };
                    
                    validation.score += 60;
                } catch (error) {
                    cacheInfo.redis = { available: false, error: error.message };
                }
            }
            
            // Check for other caching solutions
            try {
                await execAsync('memcached -h');
                cacheInfo.memcached = { available: true };
                validation.score += 30;
            } catch (error) {
                // Memcached not available
            }
            
            validation.details = cacheInfo;
            
            if (validation.score >= 80) {
                validation.status = 'excellent';
            } else if (validation.score >= 40) {
                validation.status = 'good';
            } else {
                validation.score = 20;
                validation.status = 'critical';
                validation.recommendations.push('Implement distributed caching (Redis/Memcached) for million-user performance');
            }
            
        } catch (error) {
            validation.status = 'error';
            validation.error = error.message;
        }
        
        return validation;
    }

    async validateDatabaseScalability() {
        console.log('  🗄️  Validating database scalability...');
        
        const validation = {
            name: 'Database Scalability',
            category: 'database',
            status: 'unknown',
            score: 0,
            details: {},
            recommendations: []
        };
        
        try {
            let dbInfo = {};
            
            if (this.metrics.infrastructure.types.postgresql) {
                try {
                    // Check PostgreSQL configuration (simplified)
                    const { stdout: pgVersion } = await execAsync('psql --version');
                    dbInfo.postgresql = {
                        available: true,
                        version: pgVersion.trim()
                    };
                    validation.score += 50;
                } catch (error) {
                    dbInfo.postgresql = { available: false, error: error.message };
                }
            }
            
            // Check for database connection pooling
            try {
                await execAsync('which pgbouncer');
                dbInfo.connectionPooling = { pgbouncer: true };
                validation.score += 20;
            } catch (error) {
                // PgBouncer not available
            }
            
            validation.details = dbInfo;
            
            if (validation.score >= 70) {
                validation.status = 'good';
            } else if (validation.score >= 40) {
                validation.status = 'basic';
                validation.recommendations.push('Implement connection pooling and read replicas');
            } else {
                validation.status = 'critical';
                validation.recommendations.push('Setup scalable database architecture with clustering and replication');
            }
            
        } catch (error) {
            validation.status = 'error';
            validation.error = error.message;
        }
        
        return validation;
    }

    async validateMonitoringCapability() {
        console.log('  📊 Validating monitoring capabilities...');
        
        const validation = {
            name: 'Monitoring Capability',
            category: 'observability',
            status: 'unknown',
            score: 0,
            details: {},
            recommendations: []
        };
        
        try {
            let monitoringTools = {};
            
            // Check for common monitoring tools
            const tools = [
                { name: 'prometheus', port: 9090, score: 30 },
                { name: 'grafana', port: 3001, score: 25 },
                { name: 'jaeger', port: 14268, score: 20 },
                { name: 'elasticsearch', port: 9200, score: 15 },
                { name: 'kibana', port: 5601, score: 10 }
            ];
            
            for (const tool of tools) {
                try {
                    const response = await fetch(`http://localhost:${tool.port}`, { timeout: 2000 });
                    monitoringTools[tool.name] = { available: true, port: tool.port };
                    validation.score += tool.score;
                } catch (error) {
                    monitoringTools[tool.name] = { available: false };
                }
            }
            
            validation.details = { monitoringTools };
            
            if (validation.score >= 80) {
                validation.status = 'excellent';
            } else if (validation.score >= 50) {
                validation.status = 'good';
            } else {
                validation.status = 'needs_improvement';
                validation.recommendations.push('Implement comprehensive monitoring stack (Prometheus, Grafana, Jaeger)');
            }
            
        } catch (error) {
            validation.status = 'error';
            validation.error = error.message;
        }
        
        return validation;
    }

    async validateSecurityScalability() {
        console.log('  🔒 Validating security scalability...');
        
        const validation = {
            name: 'Security Scalability',
            category: 'security',
            status: 'unknown',
            score: 0,
            details: {},
            recommendations: []
        };
        
        try {
            let securityFeatures = {};
            
            if (this.metrics.infrastructure.types.kubernetes) {
                // Check Kubernetes security features
                const { stdout: rbacOutput } = await execAsync('kubectl get clusterroles -o json');
                const rbac = JSON.parse(rbacOutput);
                
                const { stdout: nsPoliciesOutput } = await execAsync('kubectl get networkpolicies -o json');
                const networkPolicies = JSON.parse(nsPoliciesOutput);
                
                securityFeatures.kubernetes = {
                    rbacRoles: rbac.items.length,
                    networkPolicies: networkPolicies.items.length
                };
                
                if (rbac.items.length > 0) validation.score += 30;
                if (networkPolicies.items.length > 0) validation.score += 25;
            }
            
            // Check for SSL/TLS certificates
            try {
                const { stdout: certOutput } = await execAsync('openssl version');
                securityFeatures.ssl = { available: true, version: certOutput.trim() };
                validation.score += 20;
            } catch (error) {
                securityFeatures.ssl = { available: false };
            }
            
            // Check for firewall
            try {
                await execAsync('which ufw || which iptables');
                securityFeatures.firewall = { available: true };
                validation.score += 15;
            } catch (error) {
                securityFeatures.firewall = { available: false };
            }
            
            validation.details = securityFeatures;
            
            if (validation.score >= 80) {
                validation.status = 'excellent';
            } else if (validation.score >= 50) {
                validation.status = 'good';
            } else {
                validation.status = 'needs_improvement';
                validation.recommendations.push('Implement comprehensive security measures (RBAC, Network Policies, SSL/TLS)');
            }
            
        } catch (error) {
            validation.status = 'error';
            validation.error = error.message;
        }
        
        return validation;
    }

    // Utility methods for parsing system information
    parseMemoryToBytes(memoryStr) {
        const units = { Ki: 1024, Mi: 1024 * 1024, Gi: 1024 * 1024 * 1024 };
        const match = memoryStr.match(/^(\d+)(\w+)$/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            return value * (units[unit] || 1);
        }
        return 0;
    }

    parseStorageToBytes(storageStr) {
        const units = { Gi: 1024 * 1024 * 1024, Ti: 1024 * 1024 * 1024 * 1024 };
        const match = storageStr.match(/^(\d+)(\w+)$/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            return value * (units[unit] || 1);
        }
        return 0;
    }

    parseNetworkInterfaces(output) {
        const interfaces = [];
        const lines = output.split('\n');
        let currentInterface = null;
        
        for (const line of lines) {
            if (line.match(/^\w+:/)) {
                if (currentInterface) interfaces.push(currentInterface);
                currentInterface = {
                    name: line.split(':')[0],
                    status: line.includes('UP') ? 'up' : 'down'
                };
            }
        }
        
        if (currentInterface) interfaces.push(currentInterface);
        return interfaces;
    }

    parseDiskInfo(output) {
        const disks = [];
        const lines = output.split('\n').slice(1); // Skip header
        
        for (const line of lines) {
            const parts = line.split(/\s+/);
            if (parts.length >= 6) {
                disks.push({
                    filesystem: parts[0],
                    totalGB: this.parseSize(parts[1]),
                    usedGB: this.parseSize(parts[2]),
                    availableGB: this.parseSize(parts[3]),
                    usePercent: parts[4],
                    mountPoint: parts[5]
                });
            }
        }
        
        return disks;
    }

    parseSize(sizeStr) {
        const units = { K: 1024, M: 1024 * 1024, G: 1024 * 1024 * 1024, T: 1024 * 1024 * 1024 * 1024 };
        const match = sizeStr.match(/^(\d+\.?\d*)([KMGT]?)$/);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2];
            return Math.round(value * (units[unit] || 1) / 1024 / 1024 / 1024); // Convert to GB
        }
        return 0;
    }

    parseRedisInfo(output) {
        const info = {};
        const lines = output.split('\n');
        
        for (const line of lines) {
            const [key, value] = line.split(':');
            if (key && value) {
                info[key.trim()] = value.trim();
            }
        }
        
        return info;
    }

    async generateScalabilityReport() {
        console.log('\n📊 Generating Infrastructure Scalability Report...');
        
        this.metrics.endTime = new Date();
        const totalDuration = this.metrics.endTime - this.metrics.startTime;
        
        const report = {
            summary: {
                validationStartTime: this.metrics.startTime,
                validationEndTime: this.metrics.endTime,
                totalDuration: totalDuration,
                totalValidations: this.validationResults.length,
                passedValidations: this.validationResults.filter(v => v.status === 'excellent' || v.status === 'good').length,
                failedValidations: this.validationResults.filter(v => v.status === 'critical' || v.status === 'error').length,
                criticalIssues: this.criticalIssues.length
            },
            infrastructure: this.metrics.infrastructure,
            validationResults: this.validationResults,
            scalabilityAssessment: this.assessScalabilityReadiness(),
            recommendations: this.generateScalabilityRecommendations(),
            criticalIssues: this.criticalIssues,
            warnings: this.warnings
        };
        
        // Save detailed report
        const reportPath = path.join(this.outputDir, 'infrastructure-scalability-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        // Generate HTML report
        await this.generateHTMLReport(report);
        
        // Print summary
        this.printReportSummary(report);
        
        return report;
    }

    assessScalabilityReadiness() {
        const assessment = {
            overallScore: 0,
            readyForMillionUsers: false,
            categories: {
                infrastructure: { score: 0, status: 'unknown', issues: [] },
                networking: { score: 0, status: 'unknown', issues: [] },
                scalability: { score: 0, status: 'unknown', issues: [] },
                storage: { score: 0, status: 'unknown', issues: [] },
                monitoring: { score: 0, status: 'unknown', issues: [] }
            }
        };
        
        // Calculate category scores
        const categoryMapping = {
            infrastructure: ['Container Orchestration'],
            networking: ['Load Balancing', 'Network Capacity'],
            scalability: ['Auto-Scaling', 'Resource Limits'],
            storage: ['Storage Scalability', 'Cache Scalability', 'Database Scalability'],
            monitoring: ['Monitoring Capability', 'Security Scalability']
        };
        
        Object.entries(categoryMapping).forEach(([category, validationNames]) => {
            const categoryValidations = this.validationResults.filter(v => 
                validationNames.includes(v.name)
            );
            
            if (categoryValidations.length > 0) {
                const avgScore = categoryValidations.reduce((sum, v) => sum + v.score, 0) / categoryValidations.length;
                assessment.categories[category].score = avgScore;
                assessment.categories[category].status = avgScore >= 80 ? 'excellent' : 
                                                       avgScore >= 60 ? 'good' : 
                                                       avgScore >= 40 ? 'needs_improvement' : 'critical';
                
                // Collect issues
                assessment.categories[category].issues = categoryValidations
                    .filter(v => v.status === 'critical' || v.status === 'needs_improvement')
                    .map(v => v.recommendations)
                    .flat();
            }
        });
        
        // Calculate overall score
        const categoryScores = Object.values(assessment.categories).map(c => c.score);
        assessment.overallScore = categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length;
        
        // Determine readiness for million users
        assessment.readyForMillionUsers = assessment.overallScore >= 75 && 
                                         assessment.categories.scalability.score >= 80 &&
                                         assessment.categories.infrastructure.score >= 70;
        
        return assessment;
    }

    generateScalabilityRecommendations() {
        const recommendations = [];
        
        // Collect recommendations from all validations
        this.validationResults.forEach(validation => {
            if (validation.recommendations && validation.recommendations.length > 0) {
                validation.recommendations.forEach(rec => {
                    recommendations.push({
                        category: validation.category,
                        validation: validation.name,
                        priority: validation.status === 'critical' ? 'high' : 
                                 validation.status === 'needs_improvement' ? 'medium' : 'low',
                        recommendation: rec,
                        impact: 'Scalability and performance for million users'
                    });
                });
            }
        });
        
        return recommendations;
    }

    async generateHTMLReport(report) {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Infrastructure Scalability Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #495057; }
        .summary-card .value { font-size: 2em; font-weight: bold; color: #4CAF50; }
        .readiness-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .readiness-score { font-size: 3em; font-weight: bold; text-align: center; margin-bottom: 20px; }
        .score-excellent { color: #4CAF50; }
        .score-good { color: #2196F3; }
        .score-needs-improvement { color: #FF9800; }
        .score-critical { color: #f44336; }
        .categories { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .category { background: white; padding: 15px; border-radius: 6px; text-align: center; }
        .validation-results { margin-top: 30px; }
        .validation-item { margin-bottom: 20px; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; }
        .validation-header { background: #e9ecef; padding: 15px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
        .validation-content { padding: 15px; }
        .status-badge { padding: 4px 12px; border-radius: 20px; color: white; font-size: 0.8em; }
        .status-excellent { background: #4CAF50; }
        .status-good { background: #2196F3; }
        .status-needs-improvement { background: #FF9800; }
        .status-critical { background: #f44336; }
        .status-error { background: #9E9E9E; }
        .recommendations { margin-top: 30px; }
        .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
        .recommendation.high { background: #f8d7da; border-color: #f5c6cb; }
        .recommendation.medium { background: #fff3cd; border-color: #ffeaa7; }
        .recommendation.low { background: #d1ecf1; border-color: #bee5eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Infrastructure Scalability Report</h1>
            <p>Million User Readiness Assessment</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="content">
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Total Validations</h3>
                    <div class="value">${report.summary.totalValidations}</div>
                </div>
                <div class="summary-card">
                    <h3>Passed</h3>
                    <div class="value" style="color: #4CAF50;">${report.summary.passedValidations}</div>
                </div>
                <div class="summary-card">
                    <h3>Failed</h3>
                    <div class="value" style="color: #f44336;">${report.summary.failedValidations}</div>
                </div>
                <div class="summary-card">
                    <h3>Duration</h3>
                    <div class="value">${Math.round(report.summary.totalDuration / 1000 / 60)}m</div>
                </div>
            </div>
            
            <div class="readiness-section">
                <h2>Scalability Readiness Assessment</h2>
                <div class="readiness-score score-${report.scalabilityAssessment.overallScore >= 80 ? 'excellent' : 
                                                   report.scalabilityAssessment.overallScore >= 60 ? 'good' : 
                                                   report.scalabilityAssessment.overallScore >= 40 ? 'needs-improvement' : 'critical'}">
                    ${Math.round(report.scalabilityAssessment.overallScore)}%
                </div>
                <div style="text-align: center; margin-bottom: 20px;">
                    <strong>${report.scalabilityAssessment.readyForMillionUsers ? 
                             '✅ READY FOR MILLION USERS' : 
                             '⚠️ NOT READY FOR MILLION USERS'}</strong>
                </div>
                
                <div class="categories">
                    ${Object.entries(report.scalabilityAssessment.categories).map(([key, category]) => `
                        <div class="category">
                            <h4>${key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                            <div class="value score-${category.status}">
                                ${Math.round(category.score)}%
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="validation-results">
                <h2>Detailed Validation Results</h2>
                ${report.validationResults.map(validation => `
                    <div class="validation-item">
                        <div class="validation-header">
                            <span>${validation.name}</span>
                            <span class="status-badge status-${validation.status}">${validation.status.toUpperCase().replace('_', ' ')}</span>
                        </div>
                        <div class="validation-content">
                            <p><strong>Category:</strong> ${validation.category}</p>
                            <p><strong>Score:</strong> ${validation.score}%</p>
                            ${validation.details ? `<p><strong>Details:</strong> ${JSON.stringify(validation.details, null, 2)}</p>` : ''}
                            ${validation.recommendations && validation.recommendations.length > 0 ? `
                                <p><strong>Recommendations:</strong></p>
                                <ul>
                                    ${validation.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            ${report.recommendations.length > 0 ? `
            <div class="recommendations">
                <h2>Priority Recommendations</h2>
                ${report.recommendations.map(rec => `
                    <div class="recommendation ${rec.priority}">
                        <h4>${rec.validation} - ${rec.priority.toUpperCase()} PRIORITY</h4>
                        <p><strong>Category:</strong> ${rec.category}</p>
                        <p><strong>Recommendation:</strong> ${rec.recommendation}</p>
                        <p><strong>Impact:</strong> ${rec.impact}</p>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;
        
        const htmlPath = path.join(this.outputDir, 'infrastructure-scalability-report.html');
        await fs.writeFile(htmlPath, htmlContent);
        console.log(`📊 HTML report generated: ${htmlPath}`);
    }

    printReportSummary(report) {
        console.log('\n' + '='.repeat(80));
        console.log('🏗️  INFRASTRUCTURE SCALABILITY ASSESSMENT');
        console.log('='.repeat(80));
        
        console.log(`\n📊 Validation Results:`);
        console.log(`   Total Validations: ${report.summary.totalValidations}`);
        console.log(`   Passed: ${report.summary.passedValidations} ✅`);
        console.log(`   Failed: ${report.summary.failedValidations} ${report.summary.failedValidations > 0 ? '❌' : '✅'}`);
        console.log(`   Duration: ${Math.round(report.summary.totalDuration / 1000 / 60)} minutes`);
        
        console.log(`\n🎯 Scalability Readiness:`);
        console.log(`   Overall Score: ${Math.round(report.scalabilityAssessment.overallScore)}%`);
        console.log(`   Million User Ready: ${report.scalabilityAssessment.readyForMillionUsers ? '✅ YES' : '❌ NO'}`);
        
        console.log(`\n📈 Category Scores:`);
        Object.entries(report.scalabilityAssessment.categories).forEach(([key, category]) => {
            const icon = category.status === 'excellent' ? '✅' : 
                        category.status === 'good' ? '🟢' :
                        category.status === 'needs_improvement' ? '⚠️' : '❌';
            console.log(`   ${key.charAt(0).toUpperCase() + key.slice(1)}: ${Math.round(category.score)}% ${icon}`);
        });
        
        if (report.recommendations.filter(r => r.priority === 'high').length > 0) {
            console.log(`\n⚠️  Critical Recommendations:`);
            report.recommendations.filter(r => r.priority === 'high').forEach(rec => {
                console.log(`   • ${rec.recommendation}`);
            });
        }
        
        console.log('\n' + '='.repeat(80));
        
        if (report.scalabilityAssessment.readyForMillionUsers) {
            console.log('🎉 INFRASTRUCTURE IS READY FOR MILLION USERS! 🎉');
        } else {
            console.log('⚠️  INFRASTRUCTURE NEEDS IMPROVEMENTS FOR MILLION USER CAPACITY');
        }
        
        console.log('='.repeat(80));
    }

    async run() {
        try {
            await this.initialize();
            await this.validateInfrastructureScalability();
            const report = await this.generateScalabilityReport();
            
            return report;
        } catch (error) {
            console.error('❌ Infrastructure validation failed:', error.message);
            throw error;
        }
    }
}

// CLI execution
if (require.main === module) {
    const validator = new InfrastructureScalabilityValidator();
    
    validator.run()
        .then(report => {
            process.exit(report.scalabilityAssessment.readyForMillionUsers ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = InfrastructureScalabilityValidator;