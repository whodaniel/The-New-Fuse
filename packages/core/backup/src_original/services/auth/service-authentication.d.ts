export interface AuthStrategy {
    validate(token: string): Promise<boolean>;
}
export declare class ServiceAuthentication {
    private readonly authStrategy;
    constructor(authStrategy: AuthStrategy);
    validateServiceToken(): Promise<void>;
}
export declare class CrossServiceAuth {
    private readonly authentication;
    constructor(authentication: ServiceAuthentication);
    validateServiceToken(): Promise<void>;
}
declare const _default: {
    ServiceAuthentication: typeof ServiceAuthentication;
    AuthStrategy: any;
    CrossServiceAuth: typeof CrossServiceAuth;
};
export default _default;
