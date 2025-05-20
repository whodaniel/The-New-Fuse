import { IRecoveryStrategy } from './IRecoveryStrategy.js';
export declare class RecoveryStrategyRegistry {
    private strategies;
    registerStrategy(strategy: IRecoveryStrategy): void;
}
