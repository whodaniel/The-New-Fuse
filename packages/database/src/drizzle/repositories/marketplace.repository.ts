import { and, eq, gte } from 'drizzle-orm';
import { db } from '../client';
import { agentNfts, fractionalShares, revenueDistributions, revenueStreams } from '../schema';

export const agentNftRepository = {
  findByAgentId: async (agentId: string) => {
    const nft = await db.query.agentNfts.findFirst({
      where: eq(agentNfts.agentId, agentId),
    });

    if (!nft) return null;

    const streams = await db.query.revenueStreams.findMany({
      where: and(eq(revenueStreams.agentNFTId, nft.id), eq(revenueStreams.isActive, true)),
    });

    return { ...nft, revenueStreams: streams };
  },

  findById: async (id: string, withRevenueStreams = false) => {
    const nft = await db.query.agentNfts.findFirst({
      where: eq(agentNfts.id, id),
    });

    if (!nft) return null;

    let streams: any[] = [];
    if (withRevenueStreams) {
      streams = await db.query.revenueStreams.findMany({
        where: and(eq(revenueStreams.agentNFTId, nft.id), eq(revenueStreams.isActive, true)),
      });
    }

    return { ...nft, revenueStreams: streams };
  },

  create: async (data: typeof agentNfts.$inferInsert) => {
    const [nft] = await db.insert(agentNfts).values(data).returning();
    return nft;
  },

  update: async (agentId: string, data: Partial<typeof agentNfts.$inferInsert>) => {
    const [nft] = await db
      .update(agentNfts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(agentNfts.agentId, agentId))
      .returning();
    return nft;
  },

  findFullDetailsByAgentId: async (agentId: string) => {
    const nft = await db.query.agentNfts.findFirst({
      where: eq(agentNfts.agentId, agentId),
      with: {
        agent: true,
      },
    });

    if (!nft) return null;

    // Fetch fractional shares
    const shares = await db.query.fractionalShares.findMany({
      where: eq(fractionalShares.agentNFTId, nft.id),
    });

    // Fetch revenue streams with distributions
    const streams = await db.query.revenueStreams.findMany({
      where: eq(revenueStreams.agentNFTId, nft.id),
    });

    const streamsWithDist = await Promise.all(
      streams.map(async (s) => {
        const distributions = await db.query.revenueDistributions.findMany({
          where: eq(revenueDistributions.revenueStreamId, s.id),
        });
        return { ...s, distributions };
      })
    );

    return {
      ...nft,
      fractionalShares: shares.map((s) => ({ ...s, agentNFT: { ...nft, agent: nft.agent } })),
      revenueStreams: streamsWithDist,
    };
  },
};

export const revenueStreamRepository = {
  findById: async (id: string) => {
    return await db.query.revenueStreams.findFirst({
      where: eq(revenueStreams.id, id),
    });
  },

  findWithNftAndShares: async (id: string) => {
    const stream = await db.query.revenueStreams.findFirst({
      where: eq(revenueStreams.id, id),
    });

    if (!stream) return null;

    const nft = await db.query.agentNfts.findFirst({
      where: eq(agentNfts.id, stream.agentNFTId),
    });

    if (!nft) return { ...stream, agentNFT: null };

    const shares = await db.query.fractionalShares.findMany({
      where: eq(fractionalShares.agentNFTId, nft.id),
    });

    return {
      ...stream,
      agentNFT: {
        ...nft,
        fractionalShares: shares,
      },
    };
  },

  findWithAgent: async (id: string) => {
    const stream = await db.query.revenueStreams.findFirst({
      where: eq(revenueStreams.id, id),
    });

    if (!stream) return null;

    const nft = await db.query.agentNfts.findFirst({
      where: eq(agentNfts.id, stream.agentNFTId),
      with: {
        agent: true,
      },
    });

    return {
      ...stream,
      agentNFT: nft,
    };
  },

  findWithDistributionsByTime: async (agentNftId: string, startDate: Date) => {
    const streams = await db.query.revenueStreams.findMany({
      where: and(
        eq(revenueStreams.agentNFTId, agentNftId),
        gte(revenueStreams.createdAt, startDate)
      ),
    });

    const results = [];
    for (const stream of streams) {
      const distributions = await db.query.revenueDistributions.findMany({
        where: and(
          eq(revenueDistributions.revenueStreamId, stream.id),
          gte(revenueDistributions.createdAt, startDate)
        ),
      });
      results.push({ ...stream, distributions });
    }

    return results;
  },

  create: async (data: typeof revenueStreams.$inferInsert) => {
    const [stream] = await db.insert(revenueStreams).values(data).returning();
    return stream;
  },

  update: async (id: string, data: Partial<typeof revenueStreams.$inferInsert>) => {
    const [stream] = await db
      .update(revenueStreams)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(revenueStreams.id, id))
      .returning();
    return stream;
  },

  findPendingDistributions: async () => {
    // Fetch all active streams
    const streams = await db.select().from(revenueStreams).where(eq(revenueStreams.isActive, true));

    const results = [];
    for (const stream of streams) {
      const nft = await db.query.agentNfts.findFirst({
        where: eq(agentNfts.id, stream.agentNFTId),
      });

      if (nft && nft.isFractionalized) {
        // Load shares in service or here?
        // Service expects structure: stream & { agentNFT: nft & { fractionalShares: [] } }
        const shares = await db.query.fractionalShares.findMany({
          where: eq(fractionalShares.agentNFTId, nft.id),
        });

        results.push({
          ...stream,
          agentNFT: {
            ...nft,
            fractionalShares: shares,
          },
        });
      }
    }

    return results;
  },
};

export const revenueDistributionRepository = {
  create: async (data: typeof revenueDistributions.$inferInsert) => {
    const [dist] = await db.insert(revenueDistributions).values(data).returning();
    return dist;
  },
};

export const fractionalShareRepository = {
  findByAgentNftId: async (agentNftId: string) => {
    return await db.query.fractionalShares.findMany({
      where: eq(fractionalShares.agentNFTId, agentNftId),
    });
  },
};
