// Service Authentication Implementation
export interface AuthStrategy {
    validate(token: string): Promise<boolean>;
}

export class ServiceAuthentication {
    constructor(private readonly authStrategy: AuthStrategy) {}

    async validateServiceToken(): Promise<void> {token: string): Promise<boolean> {
        return this.authStrategy.validate(token);
    }
}

export class CrossServiceAuth {
    constructor(private readonly authentication: ServiceAuthentication) {}

    async validateServiceToken(): Promise<void> {token: string): Promise<boolean> {
        return this.authentication.validateServiceToken(token);
    }
}

// Export all components
export default {
    ServiceAuthentication,
    AuthStrategy,
    CrossServiceAuth
};
