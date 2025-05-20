import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseManager } from '@/core/database/databaseManager';
import { MetricsCollector } from '@/core/monitoring/metricsCollector';

const dbManager = new DatabaseManager(
  // Configuration will be loaded from environment variables
  {
    type: process.env.DB_TYPE as 'postgres' | 'mysql' | 'sqlite',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true',
  },
  new MetricsCollector()
);

export default async function handler(req: NextApiRequest, res: NextApiResponse): any {
  // Only allow admin users
  // TODO: Add proper auth check here
  if (!req.session?.user?.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    switch (req.method) {
      case 'GET':
        if (req.query.type === 'stats') {
          const stats = await dbManager.getStats();
          return res.json(stats);
        }
        if (req.query.type === 'configs') {
          // TODO: Implement config retrieval from secure storage
          return res.json([]);
        }
        return res.status(400).json({ error: 'Invalid request type' });

      case 'POST':
        if (req.query.type === 'backup') {
          const backupPath = process.env.DB_BACKUP_PATH || './backups';
          await dbManager.backup(backupPath);
          return res.json({ message: 'Backup created successfully' });
        }
        if (req.query.type === 'restore') {
          if (!req.files?.backup) {
            return res.status(400).json({ error: 'No backup file provided' });
          }
          const backupFile = req.files.backup;
          await dbManager.restore(backupFile.path);
          return res.json({ message: 'Database restored successfully' });
        }
        if (req.query.type === 'migrations') {
          await dbManager.runMigrations();
          return res.json({ message: 'Migrations completed successfully' });
        }
        return res.status(400).json({ error: 'Invalid request type' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database admin error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}