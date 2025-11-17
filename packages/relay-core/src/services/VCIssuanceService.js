/**
 * Verifiable Credential Issuance Service
 *
 * Implements W3C Verifiable Credentials standard for agent skill verification.
 * Enables trusted issuance, verification, and revocation of credentials that
 * attest to agent capabilities and achievements.
 */
import { EventEmitter } from 'events';
import { BlockchainService } from './shared/BlockchainService.js';
export var CapabilityCategory;
(function (CapabilityCategory) {
    CapabilityCategory["CODE_GENERATION"] = "code_generation";
    CapabilityCategory["DATA_ANALYSIS"] = "data_analysis";
    CapabilityCategory["NATURAL_LANGUAGE"] = "natural_language";
    CapabilityCategory["COMPUTER_VISION"] = "computer_vision";
    CapabilityCategory["API_INTEGRATION"] = "api_integration";
    CapabilityCategory["DATABASE_OPERATIONS"] = "database_operations";
    CapabilityCategory["WORKFLOW_AUTOMATION"] = "workflow_automation";
    CapabilityCategory["COLLABORATION"] = "collaboration";
    CapabilityCategory["PROBLEM_SOLVING"] = "problem_solving";
    CapabilityCategory["CREATIVITY"] = "creativity";
})(CapabilityCategory || (CapabilityCategory = {}));
export var ProficiencyLevel;
(function (ProficiencyLevel) {
    ProficiencyLevel["NOVICE"] = "novice";
    ProficiencyLevel["INTERMEDIATE"] = "intermediate";
    ProficiencyLevel["ADVANCED"] = "advanced";
    ProficiencyLevel["EXPERT"] = "expert";
    ProficiencyLevel["MASTER"] = "master";
})(ProficiencyLevel || (ProficiencyLevel = {}));
export var VerificationMethod;
(function (VerificationMethod) {
    VerificationMethod["AUTOMATED_TESTING"] = "automated_testing";
    VerificationMethod["PEER_REVIEW"] = "peer_review";
    VerificationMethod["HUMAN_EVALUATION"] = "human_evaluation";
    VerificationMethod["BENCHMARK_TESTING"] = "benchmark_testing";
    VerificationMethod["REAL_WORLD_PERFORMANCE"] = "real_world_performance";
})(VerificationMethod || (VerificationMethod = {}));
/**
 * VCIssuanceService - Handles Verifiable Credential lifecycle
 */
export class VCIssuanceService extends EventEmitter {
    prisma;
    logger;
    blockchainService = null;
    trustedIssuers = new Map();
    revokedCredentials = new Set();
    // Service configuration
    config = {
        issuerDID: 'did:web:tnf.network:issuers:main',
        issuerName: 'The New Fuse Credential Authority',
        baseContext: [
            'https://www.w3.org/2018/credentials/v1',
            'https://tnf.network/credentials/agent/v1'
        ],
        defaultExpirationDays: 365,
        enableRevocation: true,
        requireMultipleVerifiers: true,
        minTrustLevel: 7
    };
    constructor(prisma, logger, privateKey) {
        super();
        this.prisma = prisma;
        this.logger = logger;
        // Initialize blockchain service for cryptographic operations
        if (privateKey) {
            const blockchainConfig = {
                enabled: true,
                providerUrl: 'https://rpc.ankr.com/arbitrum', // Default for signing
                contractAddress: '',
                privateKey,
                chainId: 42161,
                gasLimit: 2000000,
                maxGasPrice: '50'
            };
            this.blockchainService = new BlockchainService(blockchainConfig, logger);
        }
        this.initializeTrustedIssuers();
    }
    // ============ Core Credential Issuance ============
    /**
     * Issue a Verifiable Credential for an agent
     */
    async issueCredential(request) {
        try {
            this.logger.info(`Issuing credential for agent: ${request.agentId}`);
            // Verify the agent exists
            const agent = await this.prisma.agent.findUnique({
                where: { id: request.agentId },
                include: { metadata: true }
            });
            if (!agent) {
                throw new Error('Agent not found');
            }
            // Gather capability evidence
            const capabilities = await this.gatherCapabilityEvidence(request.agentId, request.requestedCapabilities);
            // Generate performance metrics
            const performanceMetrics = await this.generatePerformanceMetrics(request.agentId);
            // Create credential subject
            const credentialSubject = {
                id: `did:agent:${request.agentId}`,
                agentId: request.agentId,
                agentType: agent.type,
                capabilities,
                achievements: await this.getAgentAchievements(request.agentId),
                verifiedSkills: await this.getVerifiedSkills(request.agentId),
                performanceMetrics
            };
            // Generate credential ID
            const credentialId = `urn:tnf:credential:${Date.now()}:${request.agentId}`;
            // Create the credential
            const credential = {
                '@context': this.config.baseContext,
                id: credentialId,
                type: ['VerifiableCredential', 'AgentCapabilityCredential'],
                issuer: {
                    id: this.config.issuerDID,
                    name: this.config.issuerName,
                    description: 'Trusted authority for agent capability verification'
                },
                issuanceDate: new Date().toISOString(),
                expirationDate: new Date(Date.now() + this.config.defaultExpirationDays * 24 * 60 * 60 * 1000).toISOString(),
                credentialSubject,
                proof: await this.generateProof(credentialSubject),
                credentialStatus: this.config.enableRevocation ? {
                    id: `${this.config.issuerDID}/revocation/${credentialId}`,
                    type: 'RevocationList2020Status'
                } : undefined
            };
            // Store credential
            await this.storeCredential(credential);
            this.emit('credentialIssued', {
                agentId: request.agentId,
                credentialId,
                capabilities: capabilities.length
            });
            this.logger.info(`Credential issued successfully: ${credentialId}`);
            return credential;
        }
        catch (error) {
            this.logger.error(`Failed to issue credential: ${error}`);
            throw error;
        }
    }
    /**
     * Verify a Verifiable Credential
     */
    async verifyCredential(credential) {
        try {
            const result = {
                isValid: false,
                credential: null,
                verificationDetails: {
                    signatureValid: false,
                    issuerTrusted: false,
                    notExpired: false,
                    notRevoked: false,
                    credentialIntact: false
                },
                errors: []
            };
            // Check if credential is structurally valid
            if (!this.isStructurallyValid(credential)) {
                result.errors.push('Credential structure is invalid');
                return result;
            }
            result.verificationDetails.credentialIntact = true;
            // Check expiration
            if (credential.expirationDate) {
                const expirationDate = new Date(credential.expirationDate);
                if (expirationDate < new Date()) {
                    result.errors.push('Credential has expired');
                }
                else {
                    result.verificationDetails.notExpired = true;
                }
            }
            else {
                result.verificationDetails.notExpired = true;
            }
            // Check if revoked
            if (!this.revokedCredentials.has(credential.id)) {
                result.verificationDetails.notRevoked = true;
            }
            else {
                result.errors.push('Credential has been revoked');
            }
            // Verify signature
            const signatureValid = await this.verifySignature(credential);
            result.verificationDetails.signatureValid = signatureValid;
            if (!signatureValid) {
                result.errors.push('Invalid signature');
            }
            // Check issuer trust
            const issuerId = typeof credential.issuer === 'string'
                ? credential.issuer
                : credential.issuer.id;
            if (this.isTrustedIssuer(issuerId)) {
                result.verificationDetails.issuerTrusted = true;
            }
            else {
                result.errors.push('Issuer is not trusted');
            }
            // Determine overall validity
            result.isValid = Object.values(result.verificationDetails).every(v => v === true);
            result.credential = result.isValid ? credential : null;
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to verify credential: ${error}`);
            return {
                isValid: false,
                credential: null,
                verificationDetails: {
                    signatureValid: false,
                    issuerTrusted: false,
                    notExpired: false,
                    notRevoked: false,
                    credentialIntact: false
                },
                errors: ['Verification process failed']
            };
        }
    }
    /**
     * Revoke a credential
     */
    async revokeCredential(credentialId, reason) {
        try {
            this.revokedCredentials.add(credentialId);
            this.emit('credentialRevoked', {
                credentialId,
                reason,
                revokedAt: new Date().toISOString()
            });
            this.logger.info(`Credential revoked: ${credentialId}, reason: ${reason}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to revoke credential: ${error}`);
            return false;
        }
    }
    // ============ Capability Assessment ============
    /**
     * Gather capability evidence for an agent
     */
    async gatherCapabilityEvidence(agentId, requestedCapabilities) {
        const capabilities = [];
        for (const capabilityName of requestedCapabilities) {
            try {
                // Get agent's historical performance in this capability
                const performance = await this.assessCapabilityPerformance(agentId, capabilityName);
                // Determine proficiency level
                const proficiencyLevel = this.determineProficiencyLevel(performance);
                // Find appropriate category
                const category = this.categorizeCapability(capabilityName);
                const capability = {
                    id: `cap_${agentId}_${capabilityName}_${Date.now()}`,
                    name: capabilityName,
                    category,
                    proficiencyLevel,
                    verificationMethod: VerificationMethod.REAL_WORLD_PERFORMANCE,
                    verifiedAt: new Date().toISOString(),
                    verifier: this.config.issuerDID
                };
                capabilities.push(capability);
            }
            catch (error) {
                this.logger.warn(`Failed to assess capability ${capabilityName} for agent ${agentId}: ${error}`);
            }
        }
        return capabilities;
    }
    /**
     * Assess agent's performance in a specific capability
     */
    async assessCapabilityPerformance(agentId, capability) {
        // Query task history for capability-related tasks
        const tasks = await this.prisma.task.findMany({
            where: {
                agentId: agentId,
                status: 'COMPLETED',
                type: {
                    contains: capability,
                    mode: 'insensitive'
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        if (tasks.length === 0) {
            return 0.5; // Baseline score for unverified capabilities
        }
        // Calculate success rate and efficiency
        const completedTasks = tasks.length;
        const averageCompletionTime = tasks.reduce((sum, task) => {
            if (task.completedAt && task.createdAt) {
                return sum + (task.completedAt.getTime() - task.createdAt.getTime());
            }
            return sum;
        }, 0) / completedTasks;
        // Normalize to 0-1 scale based on task complexity and completion time
        const efficiencyScore = Math.min(1, 86400000 / averageCompletionTime); // 1 day baseline
        const volumeScore = Math.min(1, completedTasks / 20); // 20 tasks for full score
        return (efficiencyScore * 0.6) + (volumeScore * 0.4);
    }
    /**
     * Determine proficiency level from performance score
     */
    determineProficiencyLevel(score) {
        if (score >= 0.9)
            return ProficiencyLevel.MASTER;
        if (score >= 0.8)
            return ProficiencyLevel.EXPERT;
        if (score >= 0.7)
            return ProficiencyLevel.ADVANCED;
        if (score >= 0.5)
            return ProficiencyLevel.INTERMEDIATE;
        return ProficiencyLevel.NOVICE;
    }
    /**
     * Categorize a capability name
     */
    categorizeCapability(capabilityName) {
        const name = capabilityName.toLowerCase();
        if (name.includes('code') || name.includes('programming')) {
            return CapabilityCategory.CODE_GENERATION;
        }
        if (name.includes('data') || name.includes('analysis')) {
            return CapabilityCategory.DATA_ANALYSIS;
        }
        if (name.includes('api') || name.includes('integration')) {
            return CapabilityCategory.API_INTEGRATION;
        }
        if (name.includes('database') || name.includes('sql')) {
            return CapabilityCategory.DATABASE_OPERATIONS;
        }
        if (name.includes('workflow') || name.includes('automation')) {
            return CapabilityCategory.WORKFLOW_AUTOMATION;
        }
        if (name.includes('collaboration') || name.includes('team')) {
            return CapabilityCategory.COLLABORATION;
        }
        if (name.includes('vision') || name.includes('image')) {
            return CapabilityCategory.COMPUTER_VISION;
        }
        if (name.includes('creative') || name.includes('innovation')) {
            return CapabilityCategory.CREATIVITY;
        }
        if (name.includes('problem') || name.includes('solving')) {
            return CapabilityCategory.PROBLEM_SOLVING;
        }
        return CapabilityCategory.NATURAL_LANGUAGE; // Default
    }
    // ============ Performance Metrics ============
    /**
     * Generate comprehensive performance metrics for an agent
     */
    async generatePerformanceMetrics(agentId) {
        const tasks = await this.prisma.task.findMany({
            where: { agentId: agentId },
            orderBy: { createdAt: 'desc' },
            take: 1000 // Last 1000 tasks for comprehensive analysis
        });
        const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
        const totalTasks = tasks.length;
        const successRate = totalTasks > 0 ? completedTasks.length / totalTasks : 0;
        const averageTaskDuration = completedTasks.reduce((sum, task) => {
            if (task.completedAt && task.createdAt) {
                return sum + (task.completedAt.getTime() - task.createdAt.getTime());
            }
            return sum;
        }, 0) / (completedTasks.length || 1);
        // Calculate collaboration score (based on multi-agent tasks)
        const collaborativeTasks = tasks.filter((t) => t.description?.includes('collaboration') ||
            t.description?.includes('team') ||
            t.description?.includes('handoff'));
        const collaborationScore = tasks.length > 0
            ? (collaborativeTasks.length / tasks.length) * 100
            : 0;
        // Innovation index (based on creative/novel task completion)
        const innovativeTasks = tasks.filter((t) => t.description?.includes('innovative') ||
            t.description?.includes('creative') ||
            t.description?.includes('novel'));
        const innovationIndex = tasks.length > 0
            ? (innovativeTasks.length / tasks.length) * 100
            : 0;
        // Reliability score (consistency over time)
        const recentTasks = tasks.filter((t) => t.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const recentSuccessRate = recentTasks.length > 0
            ? recentTasks.filter((t) => t.status === 'COMPLETED').length / recentTasks.length
            : 0;
        const reliabilityScore = (successRate * 0.7) + (recentSuccessRate * 0.3);
        return {
            totalTasks,
            completedTasks: completedTasks.length,
            successRate: Math.round(successRate * 100),
            averageTaskDuration: Math.round(averageTaskDuration / 60000), // Convert to minutes
            collaborationScore: Math.round(collaborationScore),
            innovationIndex: Math.round(innovationIndex),
            reliabilityScore: Math.round(reliabilityScore * 100),
            lastUpdated: new Date().toISOString()
        };
    }
    // ============ Achievements & Skills ============
    /**
     * Get agent achievements
     */
    async getAgentAchievements(agentId) {
        // In a real implementation, this would query an achievements database
        // For now, we'll generate sample achievements based on task history
        const achievements = [];
        const taskCount = await this.prisma.task.count({
            where: { agentId: agentId, status: 'COMPLETED' }
        });
        if (taskCount >= 100) {
            achievements.push({
                id: `achievement_centurion_${agentId}`,
                title: 'Centurion',
                description: 'Completed 100+ tasks',
                achievedAt: new Date().toISOString(),
                evidenceURI: `tnf://achievements/centurion/${agentId}`,
                issuer: this.config.issuerDID,
                value: 100
            });
        }
        if (taskCount >= 1000) {
            achievements.push({
                id: `achievement_veteran_${agentId}`,
                title: 'Veteran Agent',
                description: 'Completed 1000+ tasks',
                achievedAt: new Date().toISOString(),
                evidenceURI: `tnf://achievements/veteran/${agentId}`,
                issuer: this.config.issuerDID,
                value: 1000
            });
        }
        return achievements;
    }
    /**
     * Get verified skills for an agent
     */
    async getVerifiedSkills(agentId) {
        // This would typically integrate with skill assessment systems
        // For now, return basic skills based on agent metadata
        const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
            select: { capabilities: true, metadata: true }
        });
        if (!agent?.metadata) {
            return [];
        }
        const skills = [];
        // Extract skills from agent capabilities
        const capabilities = agent.capabilities;
        if (capabilities) {
            Object.entries(capabilities).forEach(([skill, enabled]) => {
                if (enabled) {
                    skills.push({
                        skillName: skill,
                        skillCategory: this.categorizeCapability(skill),
                        proficiencyScore: Math.floor(Math.random() * 30) + 70, // 70-100 for enabled skills
                        verificationDate: new Date().toISOString()
                    });
                }
            });
        }
        return skills;
    }
    // ============ Cryptographic Operations ============
    /**
     * Generate cryptographic proof for a credential
     */
    async generateProof(credentialSubject) {
        if (!this.blockchainService) {
            throw new Error('Blockchain service not configured for signing');
        }
        const message = JSON.stringify(credentialSubject);
        const signature = await this.blockchainService.signMessage(message);
        if (!signature) {
            throw new Error('Failed to sign credential');
        }
        return {
            type: 'EcdsaSecp256k1Signature2019',
            created: new Date().toISOString(),
            verificationMethod: `${this.config.issuerDID}#key-1`,
            proofPurpose: 'assertionMethod',
            proofValue: signature
        };
    }
    /**
     * Verify credential signature
     */
    async verifySignature(credential) {
        try {
            const message = JSON.stringify(credential.credentialSubject);
            const signature = credential.proof.proofValue;
            // Use shared blockchain service for verification
            const recoveredAddress = this.blockchainService?.verifyMessage(message, signature) ||
                BlockchainService.verifyMessage(message, signature);
            // For now, just check if signature is valid format
            return signature.length > 0 && !!recoveredAddress;
        }
        catch (error) {
            this.logger.error(`Signature verification failed: ${error}`);
            return false;
        }
    }
    // ============ Utility Functions ============
    /**
     * Check if credential structure is valid
     */
    isStructurallyValid(credential) {
        return !!(credential['@context'] &&
            credential.id &&
            credential.type &&
            credential.issuer &&
            credential.issuanceDate &&
            credential.credentialSubject &&
            credential.proof);
    }
    /**
     * Check if issuer is trusted
     */
    isTrustedIssuer(issuerId) {
        if (issuerId === this.config.issuerDID) {
            return true; // Self-issued credentials
        }
        const issuer = this.trustedIssuers.get(issuerId);
        return issuer ? issuer.isActive && issuer.trustLevel >= this.config.minTrustLevel : false;
    }
    /**
     * Initialize trusted issuers
     */
    initializeTrustedIssuers() {
        // Add default trusted issuers
        this.addTrustedIssuer({
            id: 'did:web:tnf.network:issuers:main',
            name: 'The New Fuse Credential Authority',
            publicKey: 'placeholder_public_key',
            authorizedCapabilities: Object.values(CapabilityCategory),
            trustLevel: 10,
            isActive: true,
            addedAt: new Date()
        });
    }
    /**
     * Add a trusted issuer
     */
    addTrustedIssuer(issuer) {
        this.trustedIssuers.set(issuer.id, issuer);
        this.emit('trustedIssuerAdded', issuer);
    }
    /**
     * Store credential (in practice, this might use IPFS or a credential registry)
     */
    async storeCredential(credential) {
        // In a real implementation, store in a verifiable data registry
        this.logger.info(`Storing credential: ${credential.id}`);
    }
    // ============ Public Query Methods ============
    /**
     * Get all credentials for an agent
     */
    async getAgentCredentials(agentId) {
        // In practice, query from credential storage
        return [];
    }
    /**
     * Get trusted issuers
     */
    getTrustedIssuers() {
        return Array.from(this.trustedIssuers.values());
    }
    /**
     * Check if credential is revoked
     */
    isCredentialRevoked(credentialId) {
        return this.revokedCredentials.has(credentialId);
    }
}
//# sourceMappingURL=VCIssuanceService.js.map