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
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: { chainConfig: this.chainConfig }
      });

      // Initialize Web3Auth
      this.web3auth = new Web3Auth({
        clientId,
        web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET, // Use TESTNET for development
      });

      await this.web3auth.init({ provider: privateKeyProvider as any });
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

      const web3authProvider = await this.web3auth.connect({
        verifier: 'tnf-server-verifier', // Configure this in Web3Auth dashboard
        verifierId,
        idToken
      });

      if (!web3authProvider) {
        throw new Error('Failed to get Web3Auth provider');
      }

      // Get private key from Web3Auth
      const privateKey = await web3authProvider.request({
        method: 'eth_private_key'
      }) as string;

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
