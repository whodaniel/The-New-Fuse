import { Web3Provider } from '@ethersproject/providers';
// Use 'as any' for CircleWallet if types are missing/incorrect
import { CircleWallet as CircleWalletType } from '@circle-financial/sdk'; // Keep original import for potential future type fixes
const CircleWallet = CircleWalletType as any; // Use 'as any' for instantiation

export class BlockchainIntegration {
  private web3Provider: Web3Provider;
  private circleWallet: CircleWalletType; // Use the original type here for property typing

  constructor(
    private readonly config: {
      providers: {
        // Assuming this is a URL or connection info string
        ethereum: string;
        circle: {
          apiKey: string;
          environment: 'sandbox' | 'production';
        };
      };
    }
  ) {}

  async initialize(): Promise<void> {
    // Initialize Web3Provider using the configured provider URL/info
    this.web3Provider = new Web3Provider(this.config.providers.ethereum);
    // Instantiate CircleWallet using the 'as any' alias
    this.circleWallet = new CircleWallet({
      apiKey: this.config.providers.circle.apiKey,
      environment: this.config.providers.circle.environment
    });
    // Add logging
    console.log('BlockchainIntegration initialized.');
    console.log('Using Ethereum provider:', this.config.providers.ethereum);
    console.log('Using Circle environment:', this.config.providers.circle.environment);
  }

  async connectWallet(): Promise<string[]> {
    // This method still relies on browser interaction (requesting accounts).
    // If this class is purely backend, this method might need rethinking
    // or removal. For now, we leave it assuming it might be called
    // in a context where web3Provider.send is valid (e.g., passed from frontend).
    console.log('Attempting to connect wallet via eth_requestAccounts...');
    const accounts = await this.web3Provider.send('eth_requestAccounts', []);
    console.log('Wallet connected, accounts:', accounts);
    return accounts;
  }
}