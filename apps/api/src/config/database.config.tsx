import { ConfigService } from '@nestjs/config';

/**
 * Database configuration options (legacy TypeORM compatible interface)
 * @deprecated Use Drizzle ORM configuration instead
 */
export interface DatabaseConfigOptions {
  type: 'postgres';
  host: string;
  port: number;
  username: string | undefined;
  password: string | undefined;
  database: string;
  entities?: any[];
  synchronize: boolean;
  logging: boolean;
}

function parseDatabaseUrl(
  databaseUrl: string,
  configService: ConfigService
): {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
} {
  try {
    // Parse DATABASE_URL format: postgresql://username:password@host:port/database
    const url = new URL(databaseUrl.replace('postgresql://', 'http://'));
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 5432,
      username: url.username,
      password: url.password,
      database: url.pathname.substring(1), // Remove leading slash
    };
  } catch (error) {
    console.error('Failed to parse DATABASE_URL, falling back to individual env vars:', error);
    return {
      host: configService.get('DB_HOST') || 'localhost',
      port: configService.get<number>('DB_PORT', 5432),
      username: configService.get('DB_USERNAME') || 'postgres',
      password: configService.get('DB_PASSWORD') || 'postgres',
      database: configService.get('DB_DATABASE', 'the_new_fuse'),
    };
  }
}

export const getDatabaseConfig = (configService: ConfigService): DatabaseConfigOptions => {
  // Try to parse DATABASE_URL first (Railway format)
  const databaseUrl = configService.get('DATABASE_URL');
  let dbConfig;

  if (databaseUrl) {
    dbConfig = parseDatabaseUrl(databaseUrl, configService);
  } else {
    // Fallback to individual environment variables
    dbConfig = {
      host: configService.get('DB_HOST') || 'localhost',
      port: configService.get<number>('DB_PORT', 5432),
      username: configService.get('DB_USERNAME'),
      password: configService.get('DB_PASSWORD'),
      database: configService.get('DB_DATABASE', 'the_new_fuse'),
    };
  }

  return {
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    // Disable synchronize to prevent schema conflicts - use Drizzle migrations instead
    synchronize: false,
    logging: configService.get('NODE_ENV') === 'development',
  };
};
