"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fractionalShareRepository = exports.revenueDistributionRepository = exports.revenueStreamRepository = exports.agentNftRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
exports.agentNftRepository = {
    findByAgentId: async (agentId) => {
        const nft = await client_1.db.query.agentNfts.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.agentNfts.agentId, agentId),
        });
        if (!nft)
            return null;
        const streams = await client_1.db.query.revenueStreams.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.revenueStreams.agentNFTId, nft.id), (0, drizzle_orm_1.eq)(schema_1.revenueStreams.isActive, true)),
        });
        return { ...nft, revenueStreams: streams };
    },
    findById: async (id, withRevenueStreams = false) => {
        const nft = await client_1.db.query.agentNfts.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.agentNfts.id, id),
        });
        if (!nft)
            return null;
        let streams = [];
        if (withRevenueStreams) {
            streams = await client_1.db.query.revenueStreams.findMany({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.revenueStreams.agentNFTId, nft.id), (0, drizzle_orm_1.eq)(schema_1.revenueStreams.isActive, true)),
            });
        }
        return { ...nft, revenueStreams: streams };
    },
    create: async (data) => {
        const [nft] = await client_1.db.insert(schema_1.agentNfts).values(data).returning();
        return nft;
    },
    update: async (agentId, data) => {
        const [nft] = await client_1.db
            .update(schema_1.agentNfts)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.agentNfts.agentId, agentId))
            .returning();
        return nft;
    },
    findFullDetailsByAgentId: async (agentId) => {
        const nft = await client_1.db.query.agentNfts.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.agentNfts.agentId, agentId),
            with: {
                agent: true,
            },
        });
        if (!nft)
            return null;
        // Fetch fractional shares
        const shares = await client_1.db.query.fractionalShares.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.fractionalShares.agentNFTId, nft.id),
        });
        // Fetch revenue streams with distributions
        const streams = await client_1.db.query.revenueStreams.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.revenueStreams.agentNFTId, nft.id),
        });
        const streamsWithDist = await Promise.all(streams.map(async (s) => {
            const distributions = await client_1.db.query.revenueDistributions.findMany({
                where: (0, drizzle_orm_1.eq)(schema_1.revenueDistributions.revenueStreamId, s.id),
            });
            return { ...s, distributions };
        }));
        return {
            ...nft,
            fractionalShares: shares.map((s) => ({ ...s, agentNFT: { ...nft, agent: nft.agent } })),
            revenueStreams: streamsWithDist,
        };
    },
};
exports.revenueStreamRepository = {
    findById: async (id) => {
        return await client_1.db.query.revenueStreams.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.revenueStreams.id, id),
        });
    },
    findWithNftAndShares: async (id) => {
        const stream = await client_1.db.query.revenueStreams.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.revenueStreams.id, id),
        });
        if (!stream)
            return null;
        const nft = await client_1.db.query.agentNfts.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.agentNfts.id, stream.agentNFTId),
        });
        if (!nft)
            return { ...stream, agentNFT: null };
        const shares = await client_1.db.query.fractionalShares.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.fractionalShares.agentNFTId, nft.id),
        });
        return {
            ...stream,
            agentNFT: {
                ...nft,
                fractionalShares: shares,
            },
        };
    },
    findWithAgent: async (id) => {
        const stream = await client_1.db.query.revenueStreams.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.revenueStreams.id, id),
        });
        if (!stream)
            return null;
        const nft = await client_1.db.query.agentNfts.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.agentNfts.id, stream.agentNFTId),
            with: {
                agent: true,
            },
        });
        return {
            ...stream,
            agentNFT: nft,
        };
    },
    findWithDistributionsByTime: async (agentNftId, startDate) => {
        const streams = await client_1.db.query.revenueStreams.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.revenueStreams.agentNFTId, agentNftId), (0, drizzle_orm_1.gte)(schema_1.revenueStreams.createdAt, startDate)),
        });
        const results = [];
        for (const stream of streams) {
            const distributions = await client_1.db.query.revenueDistributions.findMany({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.revenueDistributions.revenueStreamId, stream.id), (0, drizzle_orm_1.gte)(schema_1.revenueDistributions.createdAt, startDate)),
            });
            results.push({ ...stream, distributions });
        }
        return results;
    },
    create: async (data) => {
        const [stream] = await client_1.db.insert(schema_1.revenueStreams).values(data).returning();
        return stream;
    },
    update: async (id, data) => {
        const [stream] = await client_1.db
            .update(schema_1.revenueStreams)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.revenueStreams.id, id))
            .returning();
        return stream;
    },
    findPendingDistributions: async () => {
        // Fetch all active streams
        const streams = await client_1.db.select().from(schema_1.revenueStreams).where((0, drizzle_orm_1.eq)(schema_1.revenueStreams.isActive, true));
        const results = [];
        for (const stream of streams) {
            const nft = await client_1.db.query.agentNfts.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.agentNfts.id, stream.agentNFTId),
            });
            if (nft && nft.isFractionalized) {
                // Load shares in service or here?
                // Service expects structure: stream & { agentNFT: nft & { fractionalShares: [] } }
                const shares = await client_1.db.query.fractionalShares.findMany({
                    where: (0, drizzle_orm_1.eq)(schema_1.fractionalShares.agentNFTId, nft.id),
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
exports.revenueDistributionRepository = {
    create: async (data) => {
        const [dist] = await client_1.db.insert(schema_1.revenueDistributions).values(data).returning();
        return dist;
    },
};
exports.fractionalShareRepository = {
    findByAgentNftId: async (agentNftId) => {
        return await client_1.db.query.fractionalShares.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.fractionalShares.agentNFTId, agentNftId),
        });
    },
};
//# sourceMappingURL=marketplace.repository.js.map