import { IRecoveryStrategy } from './IRecoveryStrategy/;';
export declare class RecoveryStrategyRegistry {
    private strategies;
    registerStrategy(strategy: IRecoveryStrategy): void;
}
