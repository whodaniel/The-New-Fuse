import { Injectable, Logger } from '@nestjs/common';
import { JsonRpcProvider, Provider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { Contract } from '@ethersproject/contracts';

export interface BlockchainConfig {
  providerUrl: string;
  privateKey?: string; // For server-side wallet
}

@Injectable()
export class BlockchainIntegration {
  private readonly logger = new Logger(BlockchainIntegration.name);
  private provider: Provider;
  private wallet: Wallet | null = null;

  constructor(private readonly config: BlockchainConfig) {
    this.initialize();
  }

  private initialize(): void {
    try {
      this.provider = new JsonRpcProvider(this.config.providerUrl);
      if (this.config.privateKey) {
        this.wallet = new Wallet(this.config.privateKey, this.provider);
        this.logger.log(`Initialized blockchain integration with provider at ${this.config.providerUrl} and wallet address ${this.wallet.address}`);
      } else {
        this.logger.log(`Initialized blockchain integration with provider at ${this.config.providerUrl} (read-only)`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize blockchain provider', error.stack);
      throw new Error('Could not connect to blockchain provider.');
    }
  }

  getProvider(): Provider {
    return this.provider;
  }

  getWallet(): Wallet | null {
    return this.wallet;
  }

  async getBalance(address?: string): Promise<string> {
    const targetAddress = address || this.wallet?.address;
    if (!targetAddress) {
      throw new Error('Address must be provided or wallet must be configured.');
    }
    const balance = await this.provider.getBalance(targetAddress);
    return balance.toString();
  }

  async sendTransaction(to: string, value: string, data?: string): Promise<any> {
    if (!this.wallet) {
      throw new Error('Wallet is not configured. Cannot send transactions.');
    }
    const tx = { to, value, data };
    this.logger.log('Sending transaction:', tx);
    return this.wallet.sendTransaction(tx);
  }

  createContractInstance(abi: any, address: string): Contract {
    return new Contract(address, abi, this.wallet || this.provider);
  }

  async healthCheck(): Promise<{ status: 'ok' | 'error'; details?: any }> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      return { status: 'ok', details: { blockNumber } };
    } catch (error) {
      this.logger.error('Blockchain provider health check failed', error.stack);
      return { status: 'error', details: { error: error.message } };
    }
  }
}
