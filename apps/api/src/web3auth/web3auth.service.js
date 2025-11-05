var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Web3authService_1;
import { Injectable, Logger } from '@nestjs/common';
import { Web3Auth } from '@web3auth/node-sdk';
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { createWalletClient, http, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';
let Web3authService = Web3authService_1 = class Web3authService {
    logger = new Logger(Web3authService_1.name);
    web3auth;
    chainConfig = {
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
                throw new Error('WEB3AUTH_CLIENT_ID environment variable is required');
            }
            // Initialize the Ethereum provider
            const privateKeyProvider = new EthereumPrivateKeyProvider({
                config: { chainConfig: this.chainConfig }
            });
            // Initialize Web3Auth
            this.web3auth = new Web3Auth({
                clientId,
                web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET, // Use TESTNET for development
                privateKeyProvider: privateKeyProvider
            });
            await this.web3auth.init();
            this.logger.log('Web3Auth initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize Web3Auth:', error);
            throw error;
        }
    }
    async getProvider(verifierId) {
        try {
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
            const privateKey = await web3authProvider.getPrivateKey();
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
        }
        catch (error) {
            this.logger.error(`Failed to get provider for verifierId ${verifierId}:`, error);
            throw error;
        }
    }
    async deriveAddress(verifierId) {
        try {
            this.logger.log(`Deriving address for verifierId: ${verifierId}`);
            // For address derivation without full connection, we can use Web3Auth's key derivation
            // This is a simplified approach - you might want to cache addresses
            const provider = await this.getProvider(verifierId);
            const address = getAddress(provider.account.address);
            this.logger.log(`Derived address ${address} for verifierId ${verifierId}`);
            return address;
        }
        catch (error) {
            this.logger.error(`Failed to derive address for verifierId ${verifierId}:`, error);
            throw error;
        }
    }
    async generateServerSideToken(verifierId) {
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
        const secret = process.env.WEB3AUTH_JWT_SECRET || 'your-jwt-secret';
        return jwt.sign(payload, secret, { algorithm: 'HS256' });
    }
    async disconnect(verifierId) {
        try {
            this.logger.log(`Disconnecting verifierId: ${verifierId}`);
            // Web3Auth cleanup if needed
            // Note: The node SDK doesn't require explicit disconnect for server-side usage
        }
        catch (error) {
            this.logger.error(`Failed to disconnect verifierId ${verifierId}:`, error);
            throw error;
        }
    }
};
Web3authService = Web3authService_1 = __decorate([
    Injectable()
], Web3authService);
export { Web3authService };
//# sourceMappingURL=web3auth.service.js.map