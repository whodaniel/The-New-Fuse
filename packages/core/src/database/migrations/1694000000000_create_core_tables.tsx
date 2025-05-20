import { EnhancedDatabaseService } from '../enhanced-database.service.js';

export async function up(db: EnhancedDatabaseService): Promise<void> {
    // Create users table
    await db.executeQuery(`
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create agents table
    await db.executeQuery(`
        CREATE TABLE IF NOT EXISTS agents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            type VARCHAR(50) NOT NULL,
            config JSONB NOT NULL DEFAULT '{}',
            status VARCHAR(50) NOT NULL DEFAULT 'inactive',
            owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_active_at TIMESTAMP WITH TIME ZONE
        )
    `);

    // Create pipelines table
    await db.executeQuery(`
        CREATE TABLE IF NOT EXISTS pipelines (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            config JSONB NOT NULL DEFAULT '{}',
            status VARCHAR(50) NOT NULL DEFAULT 'inactive',
            owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_run_at TIMESTAMP WITH TIME ZONE
        )
    `);

    // Create pipeline_stages table
    await db.executeQuery(`
        CREATE TABLE IF NOT EXISTS pipeline_stages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
            agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            config JSONB NOT NULL DEFAULT '{}',
            order_index INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(pipeline_id, order_index)
        )
    `);
}

export async function down(db: EnhancedDatabaseService): Promise<void> {
    // Drop triggers first
    // Note: 'tasks', 'metrics', 'task_dependencies' are dropped here but not created in the 'up' function of this migration.
    // This might be intentional if they are managed by other migrations or parts of the system.
    const tables = ['users', 'agents', 'pipelines', 'pipeline_stages', 'tasks'];
    for (const table of tables) {
        await db.executeQuery(`
            DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table}
        `);
    }

    // Drop function
    await db.executeQuery('DROP FUNCTION IF EXISTS update_updated_at');

    // Drop tables in reverse order
    await db.executeQuery('DROP TABLE IF EXISTS metrics');
    await db.executeQuery('DROP TABLE IF EXISTS task_dependencies');
    await db.executeQuery('DROP TABLE IF EXISTS tasks');
    await db.executeQuery('DROP TABLE IF EXISTS pipeline_stages');
    await db.executeQuery('DROP TABLE IF EXISTS pipelines');
    await db.executeQuery('DROP TABLE IF EXISTS agents');
    await db.executeQuery('DROP TABLE IF EXISTS users');
}
