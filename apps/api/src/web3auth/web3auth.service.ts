import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Web3Auth } from '@web3auth/node-sdk';
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { createWalletClient, http, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

@Injectable()
export class Web3authService implements OnModuleInit {
  private readonly logger = new Logger(Web3authService.name);
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
        this.logger.warn('WEB3AUTH_CLIENT_ID environment variable is missing. Web3Auth module will be disabled.');
        return;
      }

      // Initialize the Ethereum provider
      this.privateKeyProvider = new EthereumPrivateKeyProvider({
        config: { chainConfig: this.chainConfig }
      });

      // Initialize Web3Auth
      // Note: Using type assertion as SDK types may not be up to date
      this.web3auth = new Web3Auth({
        clientId,
        web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
      } as any);

      // Initialize - the privateKeyProvider is passed here for some SDK versions
      await (this.web3auth as any).init({ provider: this.privateKeyProvider });
      this.logger.log('Web3Auth initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Web3Auth:', error);
      throw error;
    }
  }

  async getProvider(verifierId: string): Promise<{ provider: any; account: any; walletClient: any }> {
    try {
      if (!this.web3auth) {
        throw new Error('Web3Auth is not initialized. Check WEB3AUTH_CLIENT_ID environment variable.');
      }
      this.logger.log(`Getting provider for verifierId: ${verifierId}`);

      // For server-side operations, we need to use custom JWT or other authentication
      // This is a simplified example - in production, you'd implement proper JWT validation
      const idToken = await this.generateServerSideToken(verifierId);

      // Use the new connect API
      const web3authProvider = await this.web3auth.connect({
        verifier: 'tnf-server-verifier', // Configure this in Web3Auth dashboard
        verifierId,
        idToken
      } as any); // Type assertion needed as the API types may be out of sync

      if (!web3authProvider) {
        throw new Error('Failed to get Web3Auth provider');
      }

      // Get private key from the provider - use the privateKeyProvider instead
      let privateKey: string;
      if (this.privateKeyProvider && typeof (this.privateKeyProvider as any).request === 'function') {
        privateKey = await (this.privateKeyProvider as any).request({
          method: 'eth_private_key'
        }) as string;
      } else {
        // Fallback - try to get from web3auth provider directly
        privateKey = await (web3authProvider as any).request?.({
          method: 'eth_private_key'
        }) as string;
      }

      if (!privateKey) {
        throw new Error('Failed to retrieve private key from Web3Auth');
      }

      // Create viem account and wallet client
      const account = privateKeyToAccount(`0x${privateKey}`);
      const walletClient = createWalletClient({
        account,
        chain: mainnet,
        transport: http()
      });

      return {
        provider: web3authProvider,
        account,
        walletClient
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
