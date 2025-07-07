"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Web3authService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3authService = void 0;
const common_1 = require("@nestjs/common");
const node_sdk_1 = require("@web3auth/node-sdk");
const base_1 = require("@web3auth/base");
const ethereum_provider_1 = require("@web3auth/ethereum-provider");
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
let Web3authService = Web3authService_1 = class Web3authService {
    logger = new common_1.Logger(Web3authService_1.name);
    web3auth;
    chainConfig = {
        chainNamespace: base_1.CHAIN_NAMESPACES.EIP155,
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
            const privateKeyProvider = new ethereum_provider_1.EthereumPrivateKeyProvider({
                config: { chainConfig: this.chainConfig }
            });
            // Initialize Web3Auth
            this.web3auth = new node_sdk_1.Web3Auth({
                clientId,
                web3AuthNetwork: base_1.WEB3AUTH_NETWORK.SAPPHIRE_MAINNET, // Use TESTNET for development
                privateKeyProvider
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
            const privateKey = await web3authProvider.request({
                method: 'eth_private_key'
            });
            // Create viem account and wallet client
            const account = (0, accounts_1.privateKeyToAccount)(`0x${privateKey}`);
            const walletClient = (0, viem_1.createWalletClient)({
                account,
                chain: chains_1.mainnet,
                transport: (0, viem_1.http)()
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
            const address = (0, viem_1.getAddress)(provider.account.address);
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
exports.Web3authService = Web3authService;
exports.Web3authService = Web3authService = Web3authService_1 = __decorate([
    (0, common_1.Injectable)()
], Web3authService);
