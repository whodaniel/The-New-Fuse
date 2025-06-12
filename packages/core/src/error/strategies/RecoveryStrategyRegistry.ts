import { Injectable } from '@nestjs/common';
import { BaseError } from '../types.tsx';
import { IRecoveryStrategy } from './IRecoveryStrategy.tsx';

@Injectable()
export class RecoveryStrategyRegistry {
  private strategies: IRecoveryStrategy[] = [];

  registerStrategy(strategy: IRecoveryStrategy): void {
    this.strategies.push(strategy);
  }
  
  findStrategy(error: BaseError): IRecoveryStrategy | undefined {
    return this.strategies.find(strategy => strategy.canHandle(error));
  }
}