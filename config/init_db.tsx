/**
 * Initialize the FUSE-AI database with necessary tables and the founding architect.
 */

import { DataSource } from 'typeorm';
import path from 'path';
import { AdminRegistry } from './models/admin_registry.js';
import { getSettings } from './config.js';

const settings = getSettings();

async function initDatabase(): Promise<void> {
  // Create TypeORM data source
  const dataSource = new DataSource({
    type: 'postgres', // Assuming PostgreSQL, adjust as needed
    url: settings.SQLALCHEMY_DATABASE_URI,
    synchronize: true,
    logging: true,
    entities: [path.join(__dirname, 'models', '*.entity.{ts,js}')]
  });

  try {
    // Initialize database connection
    await dataSource.initialize();

    // Drop existing tables and create new ones
    await dataSource.synchronize(true);

    // Initialize admin registry
    const registry = new AdminRegistry(path.join(__dirname, '..', 'data'));

    // Register founding architect
    const visionStatement = `
    As the Founding Architect of FUSE-AI, I envision a future where technology 
    and human consciousness merge harmoniously, creating a bridge to the next 
    level of human evolution. Through the integration of mythological wisdom, 
    advanced AI, and transformative experiences, we will unlock the full 
    potential of human creativity and consciousness.
    `;

    const foundingArchitect = await registry.registerFoundingArchitect({
      fullName: "Daniel Adam Goldberg",
      knownAs: "Daniel Who",
      dateOfBirth: new Date(1975, 11, 5), // Note: Month is 0-based in JavaScript
      visionStatement: visionStatement
    });

  } catch (error) {
    console.error('Error initializing database:', error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    // Close database connection
    await dataSource.destroy();
  }
}

// Run if this is the main module
if (require.main === module) {
  initDatabase().catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
}
