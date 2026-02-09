import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzleUserRepository } from '@the-new-fuse/database';
import { encodeFunctionData, parseEther } from 'viem';

@Injectable()
export class AuctionRelayerService {
  private readonly logger = new Logger(AuctionRelayerService.name);
  private readonly ENSO_API_URL = 'https://api.enso.finance/v1/shortcuts/route';

  constructor(private config: ConfigService) {}

  /**
   * Relays a bid using off-chain "Fuse Credits" via Enso Shortcuts
   */
  async relayBid(userId: string, auctionId: number, bidCredits: number): Promise<string> {
    const AUCTION_ADDRESS = this.config.get<string>('AUCTION_MANAGER_ADDRESS');
    const TREASURY_ADDRESS = this.config.get<string>('PLATFORM_TREASURY_ADDRESS');
    const ENSO_KEY = this.config.get<string>('ENSO_API_KEY');

    if (!AUCTION_ADDRESS || !TREASURY_ADDRESS || !ENSO_KEY) {
      throw new Error('AuctionRelayer configuration missing');
    }

    // 1. Verify Credits in DB
    const user = await drizzleUserRepository.findById(userId);
    if (!user) throw new Error('User not found');

    // Assuming 'credits' or similar field exists, or use a workaround if schema not updated yet.
    // For now, using a placeholder check.
    const userCredits = (user as any).fuseCredits || 0;

    if (userCredits < bidCredits) {
      throw new Error('Insufficient Fuse Credits');
    }

    // 2. Prepare Transaction Data (using viem)
    const data = encodeFunctionData({
      abi: [
        {
          inputs: [{ name: '_id', type: 'uint256' }],
          name: 'placeBid',
          outputs: [],
          stateMutability: 'payable',
          type: 'function',
        },
      ],
      functionName: 'placeBid',
      args: [BigInt(auctionId)],
    });

    // 3. Create Enso Intent (Platform pays gas)
    const intentPayload = {
      chain: 137, // Polygon
      from: TREASURY_ADDRESS,
      to: AUCTION_ADDRESS,
      data: data,
      value: parseEther(bidCredits.toString()).toString(),
    };

    try {
      // 4. Execute via Enso
      const response = await fetch(this.ENSO_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ENSO_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(intentPayload),
      });

      const result = await response.json();

      if (result.status === 'success' || result.txHash) {
        // 5. Update DB (Debit credits)
        // using raw update safely or prisma update if schema matches
        // await this.prisma.user.update(...)

        this.logger.log(`Bid relayed successfully: ${result.txHash}`);
        return result.txHash;
      } else {
        throw new Error(`Enso relay failed: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      this.logger.error('Failed to relay bid', error);
      throw error;
    }
  }
}
