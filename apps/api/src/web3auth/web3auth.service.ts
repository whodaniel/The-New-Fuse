// @ts-nocheck
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CHAIN_NAMESPACES } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { Web3Auth } from '@web3auth/node-sdk';
import { createWalletClient, getAddress, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import {
  PrivateKeyProvider,
  ProviderResult,
  Web3AuthInstance,
  Web3AuthOptions,
  Web3AuthProvider,
} from './web3auth.types.js';

@Injectable()
export class Web3authService implements OnModuleInit {
  private readonly logger = new Logger(Web3authService.name);
  private isEnabled = false;
  private web3auth!: Web3Auth;
  private privateKeyProvider!: EthereumPrivateKeyProvider;
  private chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0x1', // Ethereum Mainnet
    rpcTarget: process.env.ETHEREUM_RPC_URL || 'https://rpc.ankr.com/eth',
    displayName: 'Ethereum Mainnet',
    blockExplorer: 'https://etherscan.io',
    ticker: 'ETH',
    tickerName: 'Ethereum',
  };

  async onModuleInit() {
    try {
      this.logger.log('Initializing Web3Auth Node SDK...');

      const clientId = process.env.WEB3AUTH_CLIENT_ID;
      if (!clientId) {
        this.logger.log('Web3Auth integration disabled: WEB3AUTH_CLIENT_ID is not configured.');
        return;
      }

      // Initialize the Ethereum provider
      this.privateKeyProvider = new EthereumPrivateKeyProvider({
        config: { chainConfig: this.chainConfig },
      });

      // Initialize Web3Auth with properly typed options
      const web3AuthOptions: Web3AuthOptions = {
        clientId,
        web3AuthNetwork: 'sapphire_mainnet',
      };
      this.web3auth = new Web3Auth(web3AuthOptions as ConstructorParameters<typeof Web3Auth>[0]);

      // Initialize - the privateKeyProvider is passed here for some SDK versions
      await (this.web3auth as unknown as Web3AuthInstance).init({
        provider: this.privateKeyProvider,
      });
      this.isEnabled = true;
      this.logger.log('Web3Auth initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Web3Auth:', error);
      throw error;
    }
  }

  async getProvider(verifierId: string): Promise<ProviderResult> {
    try {
      if (!this.isEnabled || !this.web3auth) {
        throw new Error(
          'Web3Auth is not initialized. Check WEB3AUTH_CLIENT_ID environment variable.'
        );
      }
      this.logger.log(`Getting provider for verifierId: ${verifierId}`);

      // For server-side operations, we need to use custom JWT or other authentication
      // This is a simplified example - in production, you'd implement proper JWT validation
      const idToken = await this.generateServerSideToken(verifierId);

      // Use the new connect API with typed options
      const connectOptions = {
        verifier: 'tnf-server-verifier', // Configure this in Web3Auth dashboard
        verifierId,
        idToken,
      };

      const web3authProvider = await (this.web3auth as unknown as Web3AuthInstance).connect(
        connectOptions
      );

      if (!web3authProvider) {
        throw new Error('Failed to get Web3Auth provider');
      }

      // Get private key from the provider - use the privateKeyProvider instead
      let privateKey: string;
      const pkProvider = this.privateKeyProvider as unknown as PrivateKeyProvider;
      if (this.privateKeyProvider && typeof pkProvider.request === 'function') {
        privateKey = (await pkProvider.request({
          method: 'eth_private_key',
        })) as string;
      } else {
        // Fallback - try to get from web3auth provider directly
        const provider = web3authProvider as Web3AuthProvider;
        privateKey = (await provider.request?.({
          method: 'eth_private_key',
        })) as string;
      }

      if (!privateKey) {
        throw new Error('Failed to retrieve private key from Web3Auth');
      }

      // Create viem account and wallet client with proper types
      const account = privateKeyToAccount(`0x${privateKey}`);
      const walletClient = createWalletClient({
        account,
        chain: mainnet,
        transport: http(),
      });

      return {
        provider: web3authProvider,
        account,
        walletClient,
      };
    } catch (error) {
      this.logger.error(`Failed to get provider for verifierId ${verifierId}:`, error);
      throw error;
    }
  }

  async deriveAddress(verifierId: string): Promise<string> {
    try {
      this.logger.log(`Deriving address for verifierId: ${verifierId}`);

      // For address derivation without full connection, we can use Web3Auth's key derivation
      // This is a simplified approach - you might want to cache addresses
      const provider = await this.getProvider(verifierId);
      const address = getAddress(provider.account.address);

      this.logger.log(`Derived address ${address} for verifierId ${verifierId}`);
      return address;
    } catch (error) {
      this.logger.error(`Failed to derive address for verifierId ${verifierId}:`, error);
      throw error;
    }
  }

  private async generateServerSideToken(verifierId: string): Promise<string> {
    // This is a placeholder for server-side JWT generation
    // In production, implement proper JWT creation with your authentication logic
    // The JWT should contain claims that identify the user/agent

    const jwt = require('jsonwebtoken');
    const payload = {
      iss: process.env.WEB3AUTH_VERIFIER_DOMAIN || 'tnf.local',
      aud: process.env.WEB3AUTH_CLIENT_ID,
      sub: verifierId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    };

    const secret = process.env.WEB3AUTH_JWT_SECRET;
    if (!secret) {
      throw new Error('WEB3AUTH_JWT_SECRET environment variable is required');
    }
    return jwt.sign(payload, secret, { algorithm: 'HS256' });
  }

  async disconnect(verifierId: string) {
    try {
      this.logger.log(`Disconnecting verifierId: ${verifierId}`);
      // Web3Auth cleanup if needed
      // Note: The node SDK doesn't require explicit disconnect for server-side usage
    } catch (error) {
      this.logger.error(`Failed to disconnect verifierId ${verifierId}:`, error);
      throw error;
    }
  }
}
