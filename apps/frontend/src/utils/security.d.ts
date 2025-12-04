export declare class SecurityGuard {
    constructor(policy?: {
        level: any;
        maxMessageSize: number;
        allowedPatterns: string[];
        blockedPatterns: string[];
        requireAuthentication: boolean;
        requireEncryption: boolean;
        allowedRoles: string[];
    });
    checkMessage(message: any): {
        passed: boolean;
        threats: never[];
        details: {};
    };
    calculateMessageSize(obj: any): number;
    containsSensitiveData(content: any): boolean;
    updatePolicy(newPolicy: any): void;
    getPolicy(): any;
}
export declare const SecurityPolicies: {
    HIGH: {
        level: any;
        maxMessageSize: number;
        allowedPatterns: string[];
        blockedPatterns: string[];
        requireAuthentication: boolean;
        requireEncryption: boolean;
        allowedRoles: string[];
    };
    MEDIUM: {
        level: any;
        maxMessageSize: number;
        allowedPatterns: string[];
        blockedPatterns: string[];
        requireAuthentication: boolean;
        requireEncryption: boolean;
        allowedRoles: string[];
    };
    LOW: {
        level: any;
        maxMessageSize: number;
        allowedPatterns: never[];
        blockedPatterns: string[];
        requireAuthentication: boolean;
        requireEncryption: boolean;
        allowedRoles: string[];
    };
};
