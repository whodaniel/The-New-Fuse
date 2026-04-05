"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleMarketplaceCatalogRepository = exports.DrizzleMarketplaceCatalogRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
class DrizzleMarketplaceCatalogRepository {
    async count() {
        const rows = await client_1.db.$count(schema_1.marketplaceCatalogItems);
        return Number(rows || 0);
    }
    async findAll() {
        return client_1.db
            .select()
            .from(schema_1.marketplaceCatalogItems)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.marketplaceCatalogItems.updatedAt));
    }
    async findByIdOrSlug(idOrSlug) {
        const [item] = await client_1.db
            .select()
            .from(schema_1.marketplaceCatalogItems)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.marketplaceCatalogItems.id, idOrSlug), (0, drizzle_orm_1.eq)(schema_1.marketplaceCatalogItems.slug, idOrSlug)))
            .limit(1);
        return item ?? null;
    }
    async insertIfMissing(item) {
        const inserted = await client_1.db
            .insert(schema_1.marketplaceCatalogItems)
            .values(item)
            .onConflictDoNothing({ target: schema_1.marketplaceCatalogItems.id })
            .returning();
        return inserted[0] ?? null;
    }
    async upsert(item) {
        const updated = await client_1.db
            .insert(schema_1.marketplaceCatalogItems)
            .values(item)
            .onConflictDoUpdate({
            target: schema_1.marketplaceCatalogItems.id,
            set: {
                slug: item.slug,
                name: item.name,
                description: item.description,
                kind: item.kind,
                category: item.category,
                tags: item.tags,
                capabilities: item.capabilities,
                rating: item.rating,
                totalRuns: item.totalRuns,
                successRate: item.successRate,
                pricePerRun: item.pricePerRun,
                status: item.status,
                publicationStatus: item.publicationStatus,
                launchUrl: item.launchUrl ?? null,
                avatarUrl: item.avatarUrl ?? null,
                createdBy: item.createdBy ?? null,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            },
        })
            .returning();
        return updated[0] ?? null;
    }
}
exports.DrizzleMarketplaceCatalogRepository = DrizzleMarketplaceCatalogRepository;
exports.drizzleMarketplaceCatalogRepository = new DrizzleMarketplaceCatalogRepository();
//# sourceMappingURL=marketplace-catalog.repository.js.map