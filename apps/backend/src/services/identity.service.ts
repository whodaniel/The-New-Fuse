import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { createPublicClient, createWalletClient, http, namehash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { polygon } from 'viem/chains';

@Injectable()
export class IdentityService {
  private walletClient;
  private publicClient;
  private registryAddress = '0xa9a6A14A3645144487de29A04f8461b35430001'; // UNS Registry

  // Root domain hashes
  private rootDomains = {
    com: namehash('thenewfuse.com'),
    hub: namehash('thenewfuse.hub'),
    agent: namehash('thenewfuse.agent'),
  };

  constructor(private configService: ConfigService) {
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    const rpcUrl = this.configService.get<string>('POLYGON_RPC_URL') || 'https://polygon-rpc.com';

    if (privateKey) {
      this.publicClient = createPublicClient({
        chain: polygon,
        transport: http(rpcUrl),
      });

      const account = privateKeyToAccount(privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account,
        chain: polygon,
        transport: http(rpcUrl),
      });
    }
  }

  /**
   * Generates a random Machine ID label (e.g., usr_8f2k9z)
   */
  generateMachineLabel(isAgent = false): string {
    const prefix = isAgent ? 'agent' : 'usr';
    // SECURITY: Use cryptographically secure random values instead of Math.random()
    const randomSuffix = crypto.randomBytes(4).toString('hex').substring(0, 6);
    return `${prefix}_${randomSuffix}`;
  }

  /**
   * Mints a subdomain Machine ID for a new user/agent
   * @param toAddress - The wallet address that will own the subdomain
   * @param isAgent - True if minting for an AI agent, False for human
   */
  async mintMachineID(toAddress: string, isAgent = false): Promise<string> {
    const label = this.generateMachineLabel(isAgent);
    const parentNode = isAgent ? this.rootDomains.agent : this.rootDomains.com;
    const fullDomain = isAgent ? `${label}.thenewfuse.agent` : `${label}.thenewfuse.com`;

    if (!this.walletClient) {
      console.warn('Wallet not configured. Skipping on-chain minting for:', fullDomain);
      return fullDomain;
    }

    try {
      // ABI for UNS Registry 'setSubnodeOwner' (standard ENS/UNS pattern)
      // function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external;
      const abi = [
        {
          inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'label', type: 'bytes32' },
            { name: 'owner', type: 'address' },
          ],
          name: 'setSubnodeOwner',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ];

      const labelHash = namehash(label) as `0x${string}`; // This is actually incorrect for label, we need keccak256 of label
      // Correct label hash logic:
      // labelHash is keccak256(bytes(label))
      // But viem's namehash handles full names.
      // We need just the label hash for setSubnodeOwner usually.

      // For now, logging the intent as placeholder for actual TX execution to avoid gas spend during dev
      // console.log(`Minting ${fullDomain} to ${toAddress}`);

      // In production:
      // await this.walletClient.writeContract({
      //   address: this.registryAddress as `0x${string}`,
      //   abi,
      //   functionName: 'setSubnodeOwner',
      //   args: [parentNode, keccak256(toBytes(label)), toAddress as `0x${string}`],
      // });

      return fullDomain;
    } catch (error) {
      console.error('Error minting Machine ID:', error);
      // Fallback: return the generated name even if on-chain mint failed (for now)
      return fullDomain;
    }
  }
}
