/**
 * ERC-4337 UserOperation Type Definitions
 * Proper TypeScript interfaces to replace `any` types in transaction handling
 */

import type { Address, Hash, Hex } from 'viem';

/**
 * ERC-4337 UserOperation structure
 * Based on the EntryPoint contract specification
 * @see https://eips.ethereum.org/EIPS/eip-4337
 */
export interface UserOperation {
  /** Sender address - the smart account address */
  sender: Address;
  /** Anti-replay protection - nonce from EntryPoint */
  nonce: string;
  /** Init code for account deployment (0x if account exists) */
  initCode?: Hex;
  /** Call data for the smart account execution */
  callData: Hex;
  /** Gas limit for execution */
  callGasLimit: string;
  /** Gas limit for verification */
  verificationGasLimit: string;
  /** Gas for pre-verification steps */
  preVerificationGas: string;
  /** Maximum fee per gas */
  maxFeePerGas: string;
  /** Maximum priority fee per gas */
  maxPriorityFeePerGas: string;
  /** Paymaster address (0x if no paymaster) */
  paymaster?: Address;
  /** Paymaster-specific data */
  paymasterData?: Hex;
  /** Signature from the account owner */
  signature: Hex;
}

/**
 * UserOperation for signing (before signature is added)
 */
export interface UserOperationForSigning extends Omit<UserOperation, 'signature'> {
  signature?: Hex;
}

/**
 * Signed UserOperation ready for submission
 */
export interface SignedUserOperation extends UserOperation {
  signature: Hex;
}

/**
 * UserOperation hash response from bundler
 */
export interface UserOperationHash {
  hash: Hash;
  entryPoint: Address;
  sender: Address;
  nonce: string;
}

/**
 * Bundler JSON-RPC response for eth_sendUserOperation
 */
export interface BundlerResponse {
  jsonrpc: '2.0';
  id: number;
  result?: string;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * Wallet with agent relation type
 * Returned from findByIdWithAgent database method
 */
export interface WalletWithAgent {
  id: string;
  address: Address;
  agentId: string | null;
  type: 'EOA' | 'SMART_ACCOUNT' | 'MULTISIG';
  balance: string;
  nonce: number;
  isActive: boolean;
  lastActivity: Date | null;
  createdAt: Date;
  updatedAt: Date;
  agent: {
    id: string;
    userId: string;
    name: string;
    user: {
      id: string;
      username: string;
      email: string;
    } | null;
  } | null;
}

/**
 * Transaction data for building UserOperation
 */
export interface TransactionCallData {
  target: Address;
  value: bigint;
  data: Hex;
}

/**
 * Compliance check result
 */
export interface ComplianceCheckResult {
  isHighRisk: boolean;
  riskScore: number;
  reason?: string;
}

/**
 * Recent transaction summary for compliance checks
 */
export interface RecentTransactionSummary {
  hash: string;
  toAddress: string;
  value: string;
  timestamp: Date;
  status: string;
}
