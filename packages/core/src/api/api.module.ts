import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
@Module({
  // Implementation needed
}
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
  // Implementation needed
}
      useFactory() => ({
  // Implementation needed
}
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
  ],
  exports: [HttpModule],
})
export class ApiModule {}