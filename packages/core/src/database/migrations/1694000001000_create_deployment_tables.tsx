import { EnhancedDatabaseService } from '../enhanced-database.service.js';

export async function up(db: EnhancedDatabaseService): Promise<void> {
    // Create deployments table
    await db.executeQuery(`
        CREATE TABLE IF NOT EXISTS deployments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            environment VARCHAR(50) NOT NULL,
            version VARCHAR(100) NOT NULL,
            status VARCHAR(50) NOT NULL,
            started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_by VARCHAR(255) NOT NULL,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create deployment_validations table
    await db.executeQuery(`
        CREATE TABLE IF NOT EXISTS deployment_validations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            deployment_id UUID REFERENCES deployments(id) ON DELETE CASCADE,
            validation_type VARCHAR(50) NOT NULL,
            status VARCHAR(50) NOT NULL,
            errors TEXT[] DEFAULT ARRAY[]::TEXT[],
            warnings TEXT[] DEFAULT ARRAY[]::TEXT[],
            metrics JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create deployment_metrics table
    await db.executeQuery(`
        CREATE TABLE IF NOT EXISTS deployment_metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            deployment_id UUID REFERENCES deployments(id) ON DELETE CASCADE,
            metric_name VARCHAR(100) NOT NULL,
            metric_value DOUBLE PRECISION NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            labels JSONB DEFAULT '{}'::jsonb
        )
    `);

    // Create indexes
    await db.executeQuery(`
        CREATE INDEX idx_deployments_environment ON deployments(environment);
        CREATE INDEX idx_deployments_status ON deployments(status);
        CREATE INDEX idx_deployments_version ON deployments(version);
        CREATE INDEX idx_deployment_validations_deployment ON deployment_validations(deployment_id);
        CREATE INDEX idx_deployment_validations_type ON deployment_validations(validation_type);
        CREATE INDEX idx_deployment_metrics_deployment ON deployment_metrics(deployment_id);
        CREATE INDEX idx_deployment_metrics_name ON deployment_metrics(metric_name);
        CREATE INDEX idx_deployment_metrics_timestamp ON deployment_metrics(timestamp);
    `);

    // Create trigger for updated_at
    await db.executeQuery(`
        CREATE TRIGGER update_deployments_updated_at
            BEFORE UPDATE ON deployments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    `);
}

export async function down(db: EnhancedDatabaseService): Promise<void> {
    // Drop indexes first
    await db.executeQuery(`
        DROP INDEX IF EXISTS idx_deployments_environment;
        DROP INDEX IF EXISTS idx_deployments_status;
        DROP INDEX IF EXISTS idx_deployments_version;
        DROP INDEX IF EXISTS idx_deployment_validations_deployment;
        DROP INDEX IF EXISTS idx_deployment_validations_type;
        DROP INDEX IF EXISTS idx_deployment_metrics_deployment;
        DROP INDEX IF EXISTS idx_deployment_metrics_name;
        DROP INDEX IF EXISTS idx_deployment_metrics_timestamp;
    `);

    // Drop trigger
    await db.executeQuery(`
        DROP TRIGGER IF EXISTS update_deployments_updated_at ON deployments;
    `);

    // Drop tables in reverse order
    await db.executeQuery('DROP TABLE IF EXISTS deployment_metrics');
    await db.executeQuery('DROP TABLE IF EXISTS deployment_validations');
    await db.executeQuery('DROP TABLE IF EXISTS deployments');
}