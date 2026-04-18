import { desc, eq, or } from 'drizzle-orm';
import { db } from '../client.js';
import { marketplaceCatalogItems, type NewMarketplaceCatalogItemRow } from '../schema/index.js';

export class DrizzleMarketplaceCatalogRepository {
  async count(): Promise<number> {
    const rows = await db.$count(marketplaceCatalogItems);
    return Number(rows || 0);
  }

  async findAll() {
    return db
      .select()
      .from(marketplaceCatalogItems)
      .orderBy(desc(marketplaceCatalogItems.updatedAt));
  }

  async findByIdOrSlug(idOrSlug: string) {
    const [item] = await db
      .select()
      .from(marketplaceCatalogItems)
      .where(
        or(eq(marketplaceCatalogItems.id, idOrSlug), eq(marketplaceCatalogItems.slug, idOrSlug))
      )
      .limit(1);
    return item ?? null;
  }

  async insertIfMissing(item: NewMarketplaceCatalogItemRow) {
    const inserted = await db
      .insert(marketplaceCatalogItems)
      .values(item)
      .onConflictDoNothing({ target: marketplaceCatalogItems.id })
      .returning();
    return inserted[0] ?? null;
  }

  async upsert(item: NewMarketplaceCatalogItemRow) {
    const updated = await db
      .insert(marketplaceCatalogItems)
      .values(item)
      .onConflictDoUpdate({
        target: marketplaceCatalogItems.id,
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

export const drizzleMarketplaceCatalogRepository = new DrizzleMarketplaceCatalogRepository();
