import { Module } from '@nestjs/common';
import { MarketplaceController } from './controllers/marketplace.controller';
import { MarketplaceService } from './services/marketplace.service';
import { PayPalService } from './services/paypal.service';
// import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    // DatabaseModule,
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, PayPalService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
