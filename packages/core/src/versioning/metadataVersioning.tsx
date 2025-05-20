import { Database } from 'sqlite3';
import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';

const logger: Logger = getLogger('metadata_versioning');

export enum ChangeType {
    PERSONALITY = 'personality',
    CAPABILITY = 'capability',
    EXPERTISE = 'expertise',
    COMMUNICATION = 'communication',
    RELATIONSHIP = 'relationship',
    CHARACTER_ARC = 'character_arc'
}

export interface MetadataChange {
    changeId: string;
    agentId: string;
    timestamp: string;
    changeType: ChangeType;
    previousValue: unknown;
    newValue: unknown;
    reason: string;
    triggerEvent?: string;
    storyContext?: Record<string, unknown>;
    relatedAgents?: string[];
}

interface CharacterArc {
    arcId: string;
    agentId: string;
    arcName: string;
    description: string;
    goals: string[];
    milestones: Array<Record<string, unknown>>;
    currentStage: string;
    startTime: string;
    endTime?: string;
    progress: number;
    status: string;
}

interface AgentMetadata {
    name: string;
    description: string;
    capabilities: string[];
    personalityTraits: string[];
    communicationStyle: string;
    expertiseAreas: string[];
}

interface VersionData {
    versionId: number;
    timestamp: string;
    metadata: AgentMetadata;
    change?: {
        type: ChangeType;
        reason: string;
        triggerEvent?: string;
        storyContext?: Record<string, unknown>;
        relatedAgents?: string[];
    };
}

interface SQLiteQueryResult {
    lastID?: number;
    changes?: number;
}

interface SQLiteRow {
    id: number;
    version_id: number;
    agent_id: string;
    timestamp: string;
    metadata: string;
    change_id: number;
    change_type: string;
    previous_value: string;
    new_value: string;
    reason: string;
    trigger_event: string;
    story_context: string;
    related_agents: string;
    arc_id: string;
    arc_name: string;
    description: string;
    start_time: string;
    end_time: string;
    progress: number;
    status: string;
    [key: string]: unknown;
}

export class MetadataVersioning {
    private dbManager: Database;

    constructor(dbManager: Database) {
        this.dbManager = dbManager;
    }

    async initVersioningTables(): Promise<void> {
        try {
            await this.createTables();
        } catch (e) {
            logger.error(`Error initializing versioning tables: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    private async createTables(): Promise<void> {
        const queries = [
            `CREATE TABLE IF NOT EXISTS metadata_versions (
                version_id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT NOT NULL,
                FOREIGN KEY (agent_id) REFERENCES agent_metadata(agent_id)
            )`,
            `CREATE TABLE IF NOT EXISTS metadata_changes (
                change_id INTEGER PRIMARY KEY AUTOINCREMENT,
                version_id INTEGER NOT NULL,
                agent_id TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                change_type TEXT NOT NULL,
                previous_value TEXT,
                new_value TEXT NOT NULL,
                reason TEXT NOT NULL,
                trigger_event TEXT,
                story_context TEXT,
                related_agents TEXT,
                FOREIGN KEY (version_id) REFERENCES metadata_versions(version_id),
                FOREIGN KEY (agent_id) REFERENCES agent_metadata(agent_id)
            )`,
            `CREATE TABLE IF NOT EXISTS character_arcs (
                arc_id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT NOT NULL,
                arc_name TEXT NOT NULL,
                description TEXT NOT NULL,
                goals TEXT,
                milestones TEXT,
                current_stage TEXT DEFAULT 'in_progress',
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP,
                progress REAL DEFAULT 0.0,
                status TEXT DEFAULT 'in_progress',
                FOREIGN KEY (agent_id) REFERENCES agent_metadata(agent_id)
            )`
        ];

        for (const query of queries) {
            await this.executeQuery(query);
        }
    }

    async createMetadataVersion(agentId: string, metadata: AgentMetadata): Promise<number> {
        try {
            const result = await this.executeQuery(
                'INSERT INTO metadata_versions (agent_id, metadata) VALUES (?, ?)',
                [agentId, JSON.stringify(metadata)]
            );
            return result.lastID || 0;
        } catch (e) {
            logger.error(`Error creating metadata version: ${e instanceof Error ? e.message : String(e)}`);
            throw e;
        }
    }

    async recordMetadataChange(change: MetadataChange, versionId: number): Promise<void> {
        try {
            await this.executeQuery(
                `INSERT INTO metadata_changes (
                    change_id, agent_id, timestamp, change_type,
                    previous_value, new_value, reason, trigger_event,
                    story_context, related_agents, version_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    change.changeId,
                    change.agentId,
                    change.timestamp,
                    change.changeType,
                    change.previousValue ? JSON.stringify(change.previousValue) : null,
                    change.newValue ? JSON.stringify(change.newValue) : null,
                    change.reason,
                    change.triggerEvent || null,
                    change.storyContext ? JSON.stringify(change.storyContext) : null,
                    change.relatedAgents ? JSON.stringify(change.relatedAgents) : null,
                    versionId
                ]
            );
        } catch (e) {
            logger.error(`Error recording metadata change: ${e instanceof Error ? e.message : String(e)}`);
            throw e;
        }
    }

    async createCharacterArc(
        agentId: string,
        arcName: string,
        description: string,
        goals: string[],
        milestones: Array<Record<string, unknown>>
    ): Promise<void> {
        try {
            await this.executeQuery(
                `INSERT INTO character_arcs (
                    agent_id, arc_name, description, goals, milestones,
                    current_stage, start_time, progress, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    agentId,
                    arcName,
                    description,
                    JSON.stringify(goals),
                    JSON.stringify(milestones),
                    'in_progress',
                    new Date().toISOString(),
                    0,
                    'active'
                ]
            );
        } catch (e) {
            logger.error(`Error creating character arc: ${e instanceof Error ? e.message : String(e)}`);
            throw e;
        }
    }

    async getAgentEvolution(
        agentId: string,
        startTime?: string,
        endTime?: string
    ): Promise<VersionData[]> {
        try {
            let query = `
                SELECT mv.version_id, mv.timestamp, mv.metadata,
                       mc.change_type, mc.reason, mc.trigger_event,
                       mc.story_context, mc.related_agents
                FROM metadata_versions mv
                LEFT JOIN metadata_changes mc ON mv.version_id = mc.version_id
                WHERE mv.agent_id = ?
                ORDER BY mv.timestamp DESC
            `;
            const params: unknown[] = [agentId];

            if (startTime) {
                query += ' AND mv.timestamp >= ?';
                params.push(startTime);
            }

            if (endTime) {
                query += ' AND mv.timestamp <= ?';
                params.push(endTime);
            }

            const rows = await this.executeQuery(query, params);

            return rows.map(row => ({
                versionId: row.version_id,
                timestamp: row.timestamp,
                metadata: JSON.parse(row.metadata as string),
                change: row.change_type ? {
                    type: row.change_type as ChangeType,
                    reason: row.reason,
                    triggerEvent: row.trigger_event,
                    storyContext: row.story_context ? JSON.parse(row.story_context as string) : undefined,
                    relatedAgents: row.related_agents ? JSON.parse(row.related_agents as string) : undefined
                } : undefined
            }));
        } catch (e) {
            logger.error(`Error retrieving agent evolution: ${e instanceof Error ? e.message : String(e)}`);
            return [];
        }
    }

    async getCharacterArcs(agentId: string, arcName?: string): Promise<CharacterArc[]> {
        try {
            let query = `
                SELECT * FROM character_arcs 
                WHERE agent_id = ?
            `;
            const params: unknown[] = [agentId];

            if (arcName) {
                query += ' AND arc_name = ?';
                params.push(arcName);
            }

            const rows = await this.executeQuery(query, params) as SQLiteRow[];
            
            return rows.map(row => ({
                arcId: row.arc_id,
                agentId: row.agent_id,
                arcName: row.arc_name,
                description: row.description,
                goals: JSON.parse(row.goals || '[]'),
                milestones: JSON.parse(row.milestones || '[]'),
                currentStage: row.current_stage || 'in_progress',
                startTime: new Date(row.start_time),
                endTime: row.end_time ? new Date(row.end_time) : undefined,
                progress: row.progress,
                status: row.status
            }));
        } catch (error) {
            logger.error(`Error retrieving character arcs: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    private async executeQuery(sql: string, params: unknown[] = []): Promise<SQLiteRow[] | SQLiteQueryResult> {
        return new Promise((resolve, reject) => {
            if (sql.toLowerCase().startsWith('insert')) {
                this.dbManager.run(sql, params, function(error: Error | null) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve({ 
                            lastID: this.lastID, 
                            changes: this.changes 
                        });
                    }
                });
            } else {
                this.dbManager.all(sql, params, (error: Error | null, rows: SQLiteRow[]) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(rows);
                    }
                });
            }
        });
    }
}
