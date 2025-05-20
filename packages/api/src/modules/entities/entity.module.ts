import { Module } from '@nestjs/common';
import { EntityService } from './entity.service.js';
import { EntityController } from './entity.controller.js';
import { PrismaService } from '../../services/prisma.service.js'; // Adjust path if needed
import { AuthModule } from '../auth/auth.module.js'; // Import AuthModule for guards

@Module({
  imports: [
    AuthModule, // Make guards available
    // If PrismaService is provided by a dedicated module, import it here instead of providing directly
    // PrismaModule
  ],
  controllers: [EntityController],
  providers: [
    EntityService,
    PrismaService, // Provide PrismaService directly if not using a dedicated module
  ],
  exports: [EntityService], // Export service if it needs to be used by other modules
})
export class EntityModule {}
