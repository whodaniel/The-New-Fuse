/**
 * Verifiable Credential Issuance Service
 *
 * Implements W3C Verifiable Credentials standard for agent skill verification.
 * Enables trusted issuance, verification, and revocation of credentials that
 * attest to agent capabilities and achievements.
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger.js';
export interface VerifiableCredential {
    '@context': string[];
    id: string;
    type: string[];
    issuer: string | CredentialIssuer;
    issuanceDate: string;
    expirationDate?: string;
    credentialSubject: CredentialSubject;
    proof: Proof;
    credentialStatus?: CredentialStatus;
}
export interface CredentialIssuer {
    id: string;
    name?: string;
    description?: string;
    image?: string;
}
export interface CredentialSubject {
    id: string;
    agentId: string;
    agentType: string;
    capabilities: AgentCapability[];
    achievements: AgentAchievement[];
    verifiedSkills: VerifiedSkill[];
    performanceMetrics: PerformanceMetrics;
    onChainData?: {
        tokenId: number;
        contractAddress: string;
        tbaAddress?: string;
    };
}
export interface AgentCapability {
    id: string;
    name: string;
    category: CapabilityCategory;
    proficiencyLevel: ProficiencyLevel;
    verificationMethod: VerificationMethod;
    evidenceURI?: string;
    verifiedAt: string;
    verifier: string;
}
export interface AgentAchievement {
    id: string;
    title: string;
    description: string;
    achievedAt: string;
    evidenceURI: string;
    issuer: string;
    value: number;
}
export interface VerifiedSkill {
    skillName: string;
    skillCategory: string;
    proficiencyScore: number;
    verificationDate: string;
    testResults?: TestResult[];
    peerReviews?: PeerReview[];
}
export interface PerformanceMetrics {
    totalTasks: number;
    completedTasks: number;
    successRate: number;
    averageTaskDuration: number;
    collaborationScore: number;
    innovationIndex: number;
    reliabilityScore: number;
    lastUpdated: string;
}
export interface TestResult {
    testId: string;
    testName: string;
    score: number;
    maxScore: number;
    completedAt: string;
    testMetadata?: any;
}
export interface PeerReview {
    reviewerId: string;
    rating: number;
    comment?: string;
    reviewDate: string;
    verified: boolean;
}
export interface Proof {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
}
export interface CredentialStatus {
    id: string;
    type: string;
    revocationListIndex?: number;
    revocationListCredential?: string;
}
export declare enum CapabilityCategory {
    CODE_GENERATION = "code_generation",
    DATA_ANALYSIS = "data_analysis",
    NATURAL_LANGUAGE = "natural_language",
    COMPUTER_VISION = "computer_vision",
    API_INTEGRATION = "api_integration",
    DATABASE_OPERATIONS = "database_operations",
    WORKFLOW_AUTOMATION = "workflow_automation",
    COLLABORATION = "collaboration",
    PROBLEM_SOLVING = "problem_solving",
    CREATIVITY = "creativity"
}
export declare enum ProficiencyLevel {
    NOVICE = "novice",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced",
    EXPERT = "expert",
    MASTER = "master"
}
export declare enum VerificationMethod {
    AUTOMATED_TESTING = "automated_testing",
    PEER_REVIEW = "peer_review",
    HUMAN_EVALUATION = "human_evaluation",
    BENCHMARK_TESTING = "benchmark_testing",
    REAL_WORLD_PERFORMANCE = "real_world_performance"
}
export interface VCIssuanceRequest {
    agentId: string;
    requestedCapabilities: string[];
    additionalEvidence?: string[];
    requesterSignature: string;
}
export interface VCVerificationResult {
    isValid: boolean;
    credential: VerifiableCredential | null;
    verificationDetails: {
        signatureValid: boolean;
        issuerTrusted: boolean;
        notExpired: boolean;
        notRevoked: boolean;
        credentialIntact: boolean;
    };
    errors: string[];
}
export interface TrustedIssuer {
    id: string;
    name: string;
    publicKey: string;
    authorizedCapabilities: CapabilityCategory[];
    trustLevel: number;
    isActive: boolean;
    addedAt: Date;
}
/**
 * VCIssuanceService - Handles Verifiable Credential lifecycle
 */
export declare class VCIssuanceService extends EventEmitter {
    private drizzle;
    private logger;
    private blockchainService;
    private trustedIssuers;
    private revokedCredentials;
    private readonly config;
    constructor(drizzle: any, logger: Logger, privateKey?: string);
    /**
     * Issue a Verifiable Credential for an agent
     */
    issueCredential(request: VCIssuanceRequest): Promise<VerifiableCredential>;
    /**
     * Verify a Verifiable Credential
     */
    verifyCredential(credential: VerifiableCredential): Promise<VCVerificationResult>;
    /**
     * Revoke a credential
     */
    revokeCredential(credentialId: string, reason: string): Promise<boolean>;
    /**
     * Gather capability evidence for an agent
     */
    private gatherCapabilityEvidence;
    /**
     * Assess agent's performance in a specific capability
     */
    private assessCapabilityPerformance;
    /**
     * Determine proficiency level from performance score
     */
    private determineProficiencyLevel;
    /**
     * Categorize a capability name
     */
    private categorizeCapability;
    /**
     * Generate comprehensive performance metrics for an agent
     */
    private generatePerformanceMetrics;
    /**
     * Get agent achievements
     */
    private getAgentAchievements;
    /**
     * Get verified skills for an agent
     */
    private getVerifiedSkills;
    /**
     * Generate cryptographic proof for a credential
     */
    private generateProof;
    /**
     * Verify credential signature
     */
    private verifySignature;
    /**
     * Check if credential structure is valid
     */
    private isStructurallyValid;
    /**
     * Check if issuer is trusted
     */
    private isTrustedIssuer;
    /**
     * Initialize trusted issuers
     */
    private initializeTrustedIssuers;
    /**
     * Add a trusted issuer
     */
    addTrustedIssuer(issuer: TrustedIssuer): void;
    /**
     * Store credential (in practice, this might use IPFS or a credential registry)
     */
    private storeCredential;
    /**
     * Get all credentials for an agent
     */
    getAgentCredentials(agentId: string): Promise<VerifiableCredential[]>;
    /**
     * Get trusted issuers
     */
    getTrustedIssuers(): TrustedIssuer[];
    /**
     * Check if credential is revoked
     */
    isCredentialRevoked(credentialId: string): boolean;
}
//# sourceMappingURL=VCIssuanceService.d.ts.map