import { IRecoveryStrategy } from './IRecoveryStrategy.tsx';
export declare class RecoveryStrategyRegistry {
    private strategies;
    registerStrategy(strategy: IRecoveryStrategy): void;
}
