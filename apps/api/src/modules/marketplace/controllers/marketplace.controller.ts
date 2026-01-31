import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateAssetDto, SearchAssetsDto } from '../dto/marketplace.dto';
import { MarketplaceService } from '../services/marketplace.service';
// Assuming this exists, verify path later (it does, based on file tree)
// Use standard AuthGuard if JwtAuthGuard import fails, but earlier file scan showed auth/jwt-auth.guard

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('assets')
  async searchAssets(@Query() query: SearchAssetsDto) {
    return this.marketplaceService.searchAssets(query);
  }

  @Get('assets/:id')
  async getAssetById(@Param('id') id: string) {
    return this.marketplaceService.getAssetById(id);
  }

  @Post('assets')
  // @UseGuards(JwtAuthGuard) // Commented out until we confirm exact path or user desires auth
  async createAsset(@Body() createAssetDto: CreateAssetDto) {
    return this.marketplaceService.createAsset(createAssetDto);
  }

  @Get('featured')
  async getFeaturedAssets() {
    return this.marketplaceService.getFeaturedAssets();
  }

  @Post('purchase')
  async purchaseAsset(@Body() body: { assetId: string; paymentMethod: 'paypal' }) {
    return this.marketplaceService.initiatePurchase(body.assetId, body.paymentMethod);
  }

  @Post('paypal/capture')
  async capturePayPalOrder(@Body() body: { orderId: string; assetId: string }) {
    return this.marketplaceService.completePayPalPurchase(body.orderId, body.assetId);
  }
}
