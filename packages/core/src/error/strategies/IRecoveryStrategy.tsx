import { BaseError } from '../types.js';

export interface IRecoveryStrategy {
  canHandle(error: BaseError): boolean;
  recover(error: BaseError): Promise<void>;
}