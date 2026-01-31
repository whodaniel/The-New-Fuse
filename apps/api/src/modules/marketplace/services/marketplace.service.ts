import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database/drizzle';
import { marketplaceAssets, skills } from '@the-new-fuse/database/drizzle/schema';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { CreateAssetDto, SearchAssetsDto } from '../dto/marketplace.dto';
import { PayPalService } from './paypal.service';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly payPalService: PayPalService
  ) {}

  async searchAssets(query: SearchAssetsDto) {
    const { q, type, category, tags, limit = 20, offset = 0 } = query;

    const filters = [];

    if (q) {
      filters.push(
        sql`(${marketplaceAssets.name} ILIKE ${`%${q}%`} OR ${marketplaceAssets.description} ILIKE ${`%${q}%`})`
      );
    }

    if (type && type.length > 0) {
      filters.push(inArray(marketplaceAssets.type, type));
    }

    if (category) {
      // Support array or string
      const categories = Array.isArray(category) ? category : [category];
      if (categories.length > 0) filters.push(inArray(marketplaceAssets.category, categories));
    }

    // Simple tag logic (jsonb containment)
    if (tags && tags.length > 0) {
      // PostGres JSONB containment requires special operator, Drizzle support varies.
      // For simplicity, we might skip or use raw sql.
      // filters.push(sql`${marketplaceAssets.tags} ?& ${tags}`);
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const assets = await this.db.client
      .select()
      .from(marketplaceAssets)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(marketplaceAssets.createdAt));

    // Get total count (separate query for pagination)
    const countResult = await this.db.client
      .select({ count: sql<number>`count(*)` })
      .from(marketplaceAssets)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    return {
      data: assets,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  }

  async getAssetById(id: string) {
    const asset = await this.db.client.query.marketplaceAssets.findFirst({
      where: eq(marketplaceAssets.id, id),
      with: {
        author: true,
        skill: true,
        promptTemplate: true,
      },
    });

    if (!asset) throw new NotFoundException(`Asset with ID ${id} not found`);
    return asset;
  }

  async createAsset(dto: CreateAssetDto) {
    return this.db.transaction(async (tx) => {
      // 1. Create Base Asset
      const [newAsset] = await tx
        .insert(marketplaceAssets)
        .values({
          type: dto.type,
          name: dto.name,
          description: dto.description,
          version: dto.version,
          slug:
            dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
            '-' +
            Math.random().toString(36).substring(7),
          pricingType: dto.pricingType,
          price: dto.price ? dto.price.toString() : '0',
          currency: 'USD',
          authorId: dto.authorId,
          tags: dto.tags || [],
          category: dto.category,
        })
        .returning();

      // 2. Create Specific Asset Tables
      if (dto.type === 'SKILL' && dto.skillContent) {
        await tx.insert(skills).values({
          assetId: newAsset.id,
          content: dto.skillContent,
          createdBy: dto.authorId,
        });
      }

      // TODO: Handle Prompt Packs and Agents linkage

      return newAsset;
    });
  }

  async getFeaturedAssets() {
    return this.db.client
      .select()
      .from(marketplaceAssets)
      .where(eq(marketplaceAssets.isFeatured, true))
      .limit(5);
  }

  // --- Purchase Logic ---

  async initiatePurchase(assetId: string, paymentMethod: 'paypal') {
    const asset = await this.getAssetById(assetId);

    if (asset.pricingType === 'FREE') {
      return { status: 'COMPLETED', message: 'Asset is free' };
    }

    if (paymentMethod === 'paypal') {
      const order = await this.payPalService.createOrder(Number(asset.price));
      return {
        status: 'INITIATED',
        orderId: order.id,
        approvalUrl: order.links.find((l: any) => l.rel === 'approve')?.href,
      };
    }
  }

  async completePayPalPurchase(orderId: string, assetId: string) {
    const capture = await this.payPalService.captureOrder(orderId);
    if (capture.status === 'COMPLETED') {
      // Grant access logic here (e.g. create a Purchase record, send NFT, etc.)
      this.logger.log(`Purchase completed for asset ${assetId} via PayPal order ${orderId}`);
      return { status: 'COMPLETED', captureId: capture.id };
    }
    throw new Error('Payment not completed');
  }
}
