import { Contract, ethers } from 'ethers';
import { MongoClient } from 'mongodb';

type Nullable<T> = T | null;

const {
  ARCADE_RPC_WSS_URL,
  ARCADE_AUCTION_ENGINE_ADDRESS,
  ARCADE_SIDEPOT_MANAGER_ADDRESS,
  ARCADE_PT_HOOK_ROUTER_ADDRESS,
  MONGODB_URI,
  MONGODB_URL,
  MONGODB_DB = 'thenewfuse',
} = process.env;

const mongoUri = MONGODB_URI || MONGODB_URL;

if (!ARCADE_RPC_WSS_URL) throw new Error('Missing ARCADE_RPC_WSS_URL');
if (!ARCADE_AUCTION_ENGINE_ADDRESS) throw new Error('Missing ARCADE_AUCTION_ENGINE_ADDRESS');
if (!ARCADE_SIDEPOT_MANAGER_ADDRESS) throw new Error('Missing ARCADE_SIDEPOT_MANAGER_ADDRESS');
if (!ARCADE_PT_HOOK_ROUTER_ADDRESS) throw new Error('Missing ARCADE_PT_HOOK_ROUTER_ADDRESS');
if (!mongoUri) throw new Error('Missing MONGODB_URI or MONGODB_URL');

const auctionEngineAbi = [
  'event JackpotUnlock(uint256 indexed id, address indexed winner, uint256 finalCost)',
  'function auctions(uint256) view returns (uint256 id, string agentId, uint256 currentPrice, uint256 floorPrice, uint256 priceDrop, uint256 bidFee, bool active, address winner, address lastBidder, uint256 endTime)',
];

const sidepotAbi = [
  'event PotFunded(uint256 indexed potId, address indexed funder, uint256 amount)',
  'function pots(uint256) view returns (string label, uint256 balance, uint256 minDrawAmount, uint256 totalFunded, bool active)',
];

const routerAbi = [
  'event PrizeRouted(address indexed winner, uint256 prizeAmount, uint256 winnerAmount, uint256 treasuryAmount, uint256 sidepotAmount)',
];

function eventId(txHash: string, logIndex: number): string {
  return `${txHash}:${logIndex}`;
}

function toFloat(value: bigint, decimals = 18): number {
  return Number(ethers.formatUnits(value, decimals));
}

async function withRetry<T>(op: () => Promise<T>, retries = 5): Promise<T> {
  let err: Nullable<unknown> = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await op();
    } catch (e) {
      err = e;
      await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
    }
  }
  throw err;
}

async function main() {
  const mongo = new MongoClient(mongoUri);
  await mongo.connect();

  const db = mongo.db(MONGODB_DB);
  const users = db.collection<any>('users');
  const telemetry = db.collection<any>('arcade_event_telemetry');
  const metrics = db.collection<any>('arcade_live_metrics');

  const provider = new ethers.WebSocketProvider(ARCADE_RPC_WSS_URL);

  const auction = new Contract(ARCADE_AUCTION_ENGINE_ADDRESS, auctionEngineAbi, provider);
  const sidepot = new Contract(ARCADE_SIDEPOT_MANAGER_ADDRESS, sidepotAbi, provider);
  const router = new Contract(ARCADE_PT_HOOK_ROUTER_ADDRESS, routerAbi, provider);

  const upsertTelemetry = async (doc: Record<string, unknown>) => {
    const _id = eventId(String(doc.txHash), Number(doc.logIndex));
    await telemetry.updateOne(
      { _id },
      {
        $setOnInsert: {
          ...doc,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  };

  console.log('[arcade-chain-listener] listening...');

  auction.on('JackpotUnlock', async (id: bigint, winner: string, finalCost: bigint, event: any) => {
    try {
      const auctionData = await withRetry(() => auction.auctions(id));
      const agentId = String(auctionData.agentId);
      const wallet = winner.toLowerCase();

      await users.updateOne({ walletAddress: wallet }, {
        $addToSet: { unlockedAgents: agentId },
        $push: {
          history: {
            type: 'AUCTION_WIN',
            source: 'CHAIN_LISTENER',
            auctionId: Number(id),
            agentId,
            cost: toFloat(finalCost),
            txHash: event.log.transactionHash,
            createdAt: new Date(),
          },
        },
        $inc: { karma: 250 },
      } as any);

      await upsertTelemetry({
        type: 'JackpotUnlock',
        auctionId: Number(id),
        winner: wallet,
        finalCost: toFloat(finalCost),
        agentId,
        txHash: event.log.transactionHash,
        logIndex: event.log.index,
      });
    } catch (error) {
      console.error('[JackpotUnlock] failed', error);
    }
  });

  router.on(
    'PrizeRouted',
    async (
      winner: string,
      prizeAmount: bigint,
      winnerAmount: bigint,
      treasuryAmount: bigint,
      sidepotAmount: bigint,
      event: any
    ) => {
      try {
        await upsertTelemetry({
          type: 'PrizeRouted',
          winner: winner.toLowerCase(),
          prizeAmount: toFloat(prizeAmount),
          winnerAmount: toFloat(winnerAmount),
          treasuryAmount: toFloat(treasuryAmount),
          sidepotAmount: toFloat(sidepotAmount),
          txHash: event.log.transactionHash,
          logIndex: event.log.index,
        });

        await metrics.updateOne(
          { _id: 'prize-routing' },
          {
            $inc: {
              totalPrizeAmount: toFloat(prizeAmount),
              totalWinnerAmount: toFloat(winnerAmount),
              totalTreasuryAmount: toFloat(treasuryAmount),
              totalSidepotAmount: toFloat(sidepotAmount),
              routedCount: 1,
            },
            $set: { updatedAt: new Date() },
          },
          { upsert: true }
        );
      } catch (error) {
        console.error('[PrizeRouted] failed', error);
      }
    }
  );

  sidepot.on('PotFunded', async (potId: bigint, funder: string, amount: bigint, event: any) => {
    try {
      const pot = await withRetry(() => sidepot.pots(potId));
      await upsertTelemetry({
        type: 'PotFunded',
        potId: Number(potId),
        funder: funder.toLowerCase(),
        amount: toFloat(amount),
        potLabel: String(pot.label),
        potBalance: toFloat(pot.balance),
        totalFunded: toFloat(pot.totalFunded),
        txHash: event.log.transactionHash,
        logIndex: event.log.index,
      });

      await metrics.updateOne(
        { _id: `pot:${Number(potId)}` },
        {
          $set: {
            potId: Number(potId),
            potLabel: String(pot.label),
            potBalance: toFloat(pot.balance),
            totalFunded: toFloat(pot.totalFunded),
            updatedAt: new Date(),
          },
          $inc: { fundedEvents: 1 },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('[PotFunded] failed', error);
    }
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT: shutting down listener');
    provider.destroy();
    await mongo.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('[arcade-chain-listener] fatal', error);
  process.exit(1);
});
