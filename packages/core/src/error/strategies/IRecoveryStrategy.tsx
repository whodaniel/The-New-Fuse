import { BaseError } from '../types.tsx';

export interface IRecoveryStrategy {
  canHandle(error: BaseError): boolean;
  recover(error: BaseError): Promise<void>;
}