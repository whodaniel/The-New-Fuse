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
// @ts-nocheck
const common_1 = require("@nestjs/common");
const base_1 = require("@web3auth/base");
const ethereum_provider_1 = require("@web3auth/ethereum-provider");
const node_sdk_1 = require("@web3auth/node-sdk");
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
let Web3authService = Web3authService_1 = class Web3authService {
    constructor() {
        this.logger = new common_1.Logger(Web3authService_1.name);
        this.isEnabled = false;
        this.chainConfig = {
            chainNamespace: base_1.CHAIN_NAMESPACES.EIP155,
            chainId: '0x1', // Ethereum Mainnet
            rpcTarget: process.env.ETHEREUM_RPC_URL || 'https://rpc.ankr.com/eth',
            displayName: 'Ethereum Mainnet',
            blockExplorer: 'https://etherscan.io',
            ticker: 'ETH',
            tickerName: 'Ethereum',
        };
    }
    async onModuleInit() {
        try {
            this.logger.log('Initializing Web3Auth Node SDK...');
            const clientId = process.env.WEB3AUTH_CLIENT_ID;
            if (!clientId) {
                this.logger.log('Web3Auth integration disabled: WEB3AUTH_CLIENT_ID is not configured.');
                return;
            }
            // Initialize the Ethereum provider
            this.privateKeyProvider = new ethereum_provider_1.EthereumPrivateKeyProvider({
                config: { chainConfig: this.chainConfig },
            });
            // Initialize Web3Auth with properly typed options
            const web3AuthOptions = {
                clientId,
                web3AuthNetwork: 'sapphire_mainnet',
            };
            this.web3auth = new node_sdk_1.Web3Auth(web3AuthOptions);
            // Initialize - the privateKeyProvider is passed here for some SDK versions
            await this.web3auth.init({
                provider: this.privateKeyProvider,
            });
            this.isEnabled = true;
            this.logger.log('Web3Auth initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize Web3Auth:', error);
            throw error;
        }
    }
    async getProvider(verifierId) {
        try {
            if (!this.isEnabled || !this.web3auth) {
                throw new Error('Web3Auth is not initialized. Check WEB3AUTH_CLIENT_ID environment variable.');
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
            const web3authProvider = await this.web3auth.connect(connectOptions);
            if (!web3authProvider) {
                throw new Error('Failed to get Web3Auth provider');
            }
            // Get private key from the provider - use the privateKeyProvider instead
            let privateKey;
            const pkProvider = this.privateKeyProvider;
            if (this.privateKeyProvider && typeof pkProvider.request === 'function') {
                privateKey = (await pkProvider.request({
                    method: 'eth_private_key',
                }));
            }
            else {
                // Fallback - try to get from web3auth provider directly
                const provider = web3authProvider;
                privateKey = (await provider.request?.({
                    method: 'eth_private_key',
                }));
            }
            if (!privateKey) {
                throw new Error('Failed to retrieve private key from Web3Auth');
            }
            // Create viem account and wallet client with proper types
            const account = (0, accounts_1.privateKeyToAccount)(`0x${privateKey}`);
            const walletClient = (0, viem_1.createWalletClient)({
                account,
                chain: chains_1.mainnet,
                transport: (0, viem_1.http)(),
            });
            return {
                provider: web3authProvider,
                account,
                walletClient,
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
        const secret = process.env.WEB3AUTH_JWT_SECRET;
        if (!secret) {
            throw new Error('WEB3AUTH_JWT_SECRET environment variable is required');
        }
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
//# sourceMappingURL=web3auth.service.js.map