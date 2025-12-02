export const getDatabaseConfig = (configService) => ({
  url: configService.get('DATABASE_URL') || 'postgresql://postgres:postgres@localhost:5432/fuse',
  host: configService.get('DB_HOST') || 'localhost',
  port: configService.get('DB_PORT') || 5432,
  username: configService.get('DB_USERNAME') || 'postgres',
  password: configService.get('DB_PASSWORD') || 'postgres',
  database: configService.get('DB_DATABASE') || 'fuse',
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('DB_SSL') === 'true',
});
//# sourceMappingURL=database.config.js.map
