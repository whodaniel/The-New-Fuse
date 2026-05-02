/**
 * Web3Auth Service Type Definitions
 * Proper TypeScript interfaces to replace `any` types
 */

import type { WalletClient, Account, Address, Chain, Transport } from 'viem';

/**
 * Web3Auth Node SDK initialization options
 * Based on @web3auth/node-sdk types
 */
export interface Web3AuthOptions {
  clientId: string;
  web3AuthNetwork: 'sapphire_mainnet' | 'sapphire_devnet' | 'cyan_mainnet' | 'cyan_devnet' | 'aqua_mainnet' | 'testnet';
  storageKey?: string;
  storageType?: 'local' | 'session' | 'memory';
}

/**
 * Chain configuration for Web3Auth providers
 */
export interface ChainConfig {
  chainNamespace: string;
  chainId: string;
  rpcTarget: string;
  displayName: string;
  blockExplorer: string;
  ticker: string;
  tickerName: string;
}

/**
 * Ethereum Private Key Provider configuration
 */
export interface EthereumPrivateKeyProviderConfig {
  config: {
    chainConfig: ChainConfig;
  };
}

/**
 * Web3Auth connect options for server-side authentication
 */
export interface Web3AuthConnectOptions {
  verifier: string;
  verifierId: string;
  idToken: string;
}

/**
 * Generic provider interface that Web3Auth providers implement
 */
export interface Web3AuthProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

/**
 * Web3Auth Node SDK instance interface
 * Defines the methods available on the Web3Auth instance
 */
export interface Web3AuthInstance {
  init: (options: { provider?: unknown }) => Promise<void>;
  connect: (options: Web3AuthConnectOptions) => Promise<Web3AuthProvider | null>;
  disconnect: () => Promise<void>;
  provider?: Web3AuthProvider;
  connected: boolean;
}

/**
 * Provider result returned from getProvider
 * Contains viem types for account and wallet client
 */
export interface ProviderResult {
  provider: Web3AuthProvider;
  account: Account;
  walletClient: WalletClient<Transport, Chain, Account>;
}

/**
 * JWT payload structure for server-side token generation
 */
export interface JwtPayload {
  iss: string;
  aud: string;
  sub: string;
  iat: number;
  exp: number;
}

/**
 * Private key provider interface
 */
export interface PrivateKeyProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  init: (options?: unknown) => Promise<void>;
}
