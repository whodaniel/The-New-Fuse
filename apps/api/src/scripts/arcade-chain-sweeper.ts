import { Contract, ethers } from 'ethers';
import { MongoClient } from 'mongodb';

const {
  ARCADE_RPC_HTTP_URL,
  ARCADE_AUCTION_ENGINE_ADDRESS,
  ARCADE_SIDEPOT_MANAGER_ADDRESS,
  ARCADE_PT_HOOK_ROUTER_ADDRESS,
  ARCADE_SWEEP_BLOCK_WINDOW = '12000',
  MONGODB_URI,
  MONGODB_URL,
  MONGODB_DB = 'thenewfuse',
} = process.env;

const mongoUri = MONGODB_URI || MONGODB_URL;

if (!ARCADE_RPC_HTTP_URL) throw new Error('Missing ARCADE_RPC_HTTP_URL');
if (!ARCADE_AUCTION_ENGINE_ADDRESS) throw new Error('Missing ARCADE_AUCTION_ENGINE_ADDRESS');
if (!ARCADE_SIDEPOT_MANAGER_ADDRESS) throw new Error('Missing ARCADE_SIDEPOT_MANAGER_ADDRESS');
if (!ARCADE_PT_HOOK_ROUTER_ADDRESS) throw new Error('Missing ARCADE_PT_HOOK_ROUTER_ADDRESS');
if (!mongoUri) throw new Error('Missing MONGODB_URI or MONGODB_URL');

const auctionAbi = [
  'event JackpotUnlock(uint256 indexed id, address indexed winner, uint256 finalCost)',
  'function auctions(uint256) view returns (uint256 id, string agentId, uint256 currentPrice, uint256 floorPrice, uint256 priceDrop, uint256 bidFee, bool active, address winner, address lastBidder, uint256 endTime)',
];
const sidepotAbi = [
  'event PotFunded(uint256 indexed potId, address indexed funder, uint256 amount)',
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

function readArgs(event: ethers.Log | ethers.EventLog): any | null {
  if ('args' in event && event.args) return event.args as any;
  return null;
}

async function main() {
  const provider = new ethers.JsonRpcProvider(ARCADE_RPC_HTTP_URL);
  const mongo = new MongoClient(mongoUri);
  await mongo.connect();
  const db = mongo.db(MONGODB_DB);
  const users = db.collection<any>('users');
  const telemetry = db.collection<any>('arcade_event_telemetry');

  const auction = new Contract(ARCADE_AUCTION_ENGINE_ADDRESS, auctionAbi, provider);
  const sidepot = new Contract(ARCADE_SIDEPOT_MANAGER_ADDRESS, sidepotAbi, provider);
  const router = new Contract(ARCADE_PT_HOOK_ROUTER_ADDRESS, routerAbi, provider);

  const latest = await provider.getBlockNumber();
  const fromBlock = Math.max(0, latest - Number(ARCADE_SWEEP_BLOCK_WINDOW));

  const jackpotEvents = await auction.queryFilter(
    auction.filters.JackpotUnlock(),
    fromBlock,
    latest
  );
  const prizeEvents = await router.queryFilter(router.filters.PrizeRouted(), fromBlock, latest);
  const potEvents = await sidepot.queryFilter(sidepot.filters.PotFunded(), fromBlock, latest);

  for (const event of jackpotEvents) {
    const txHash = event.transactionHash;
    const logIndex = event.index;
    const _id = eventId(txHash, logIndex);

    const existing = await telemetry.findOne({ _id });
    if (existing) continue;

    const args = readArgs(event);
    if (!args) continue;
    const id = args.id as bigint;
    const winner = String(args.winner || '').toLowerCase();
    const finalCost = args.finalCost as bigint;
    const auctionData = await auction.auctions(id);
    const agentId = String(auctionData.agentId);

    await telemetry.insertOne({
      _id,
      type: 'JackpotUnlock',
      auctionId: Number(id),
      winner,
      finalCost: toFloat(finalCost),
      agentId,
      txHash,
      logIndex,
      source: 'SWEEPER',
      createdAt: new Date(),
    });

    await users.updateOne({ walletAddress: winner }, {
      $addToSet: { unlockedAgents: agentId },
      $push: {
        history: {
          type: 'AUCTION_WIN',
          source: 'CHAIN_SWEEPER',
          auctionId: Number(id),
          agentId,
          cost: toFloat(finalCost),
          txHash,
          createdAt: new Date(),
        },
      },
    } as any);
  }

  for (const event of prizeEvents) {
    const txHash = event.transactionHash;
    const logIndex = event.index;
    const _id = eventId(txHash, logIndex);
    const existing = await telemetry.findOne({ _id });
    if (existing) continue;
    const args = readArgs(event);
    if (!args) continue;

    await telemetry.insertOne({
      _id,
      type: 'PrizeRouted',
      winner: String(args.winner || '').toLowerCase(),
      prizeAmount: toFloat(args.prizeAmount as bigint),
      winnerAmount: toFloat(args.winnerAmount as bigint),
      treasuryAmount: toFloat(args.treasuryAmount as bigint),
      sidepotAmount: toFloat(args.sidepotAmount as bigint),
      txHash,
      logIndex,
      source: 'SWEEPER',
      createdAt: new Date(),
    });
  }

  for (const event of potEvents) {
    const txHash = event.transactionHash;
    const logIndex = event.index;
    const _id = eventId(txHash, logIndex);
    const existing = await telemetry.findOne({ _id });
    if (existing) continue;
    const args = readArgs(event);
    if (!args) continue;

    await telemetry.insertOne({
      _id,
      type: 'PotFunded',
      potId: Number(args.potId),
      funder: String(args.funder || '').toLowerCase(),
      amount: toFloat(args.amount as bigint),
      txHash,
      logIndex,
      source: 'SWEEPER',
      createdAt: new Date(),
    });
  }

  console.log(
    `[arcade-chain-sweeper] backfilled jackpot=${jackpotEvents.length}, prize=${prizeEvents.length}, pot=${potEvents.length}`
  );

  await mongo.close();
}

main().catch((error: any) => {
  console.error('[arcade-chain-sweeper] fatal', error);
  process.exit(1);
});
