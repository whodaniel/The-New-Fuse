// filepath: src/config/database.config.ts
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

// Function to get database configuration
export function getDatabaseConfig(): TypeOrmModuleOptions {
  return {
    type: (process.env.DB_TYPE as any) || "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_DATABASE || "the_new_fuse",
    entities: [__dirname + "/../**/*.entity{.ts,.js}"],
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.DB_LOGGING === "true",
    ssl:
      process.env.DB_SSL === "true"
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
  };
}

// Re-export the function with both names to satisfy different imports
export function databaseConfig(): TypeOrmModuleOptions {
  return getDatabaseConfig();
}
