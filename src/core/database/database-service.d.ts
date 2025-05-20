import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
export declare class DatabaseService implements TypeOrmOptionsFactory {
  private configService;
  constructor(configService: ConfigService);
  createTypeOrmOptions(): TypeOrmModuleOptions;
}
