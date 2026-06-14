export interface NativeEnvelopeValidatorStatus {
    mode: 'native' | 'typescript';
    available: boolean;
    enabled: boolean;
    required: boolean;
    libraryPath?: string;
    reason?: string;
}
export interface NativeEnvelopeValidationOptions {
    enabled?: boolean;
    required?: boolean;
}
export declare function getNativeEnvelopeValidatorStatus(options?: NativeEnvelopeValidationOptions): NativeEnvelopeValidatorStatus;
export declare function assertNativeEnvelopeValid(envelope: unknown, options?: NativeEnvelopeValidationOptions): void;
export declare function resetNativeEnvelopeValidatorCache(): void;
//# sourceMappingURL=native-envelope-validator.d.ts.map