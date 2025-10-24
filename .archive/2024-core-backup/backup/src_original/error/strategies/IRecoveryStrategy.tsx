import { BaseError } from '../types';

export interface IRecoveryStrategy {
  canHandle(error: BaseError): boolean;
  recover(error: BaseError): Promise<void>;
}