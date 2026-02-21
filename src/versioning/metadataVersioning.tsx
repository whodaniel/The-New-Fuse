import sqlite3, { Database } from 'sqlite3';
import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';

// Export the Database type to avoid private name errors
export type DatabaseType = Database;

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
    arcId: number;
    agentId: string;
    arcName: string;
    description: string;
    goals: string[];
    milestones: Array<Record<string, unknown>>;
    currentStage: string;
    startTime: Date;
    endTime?: Date;
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
    agentId: string;
    timestamp: Date;
    metadata: AgentMetadata;
    changes: MetadataChange[];
}

interface SQLiteQueryResult {
    lastID?: number;
    changes?: number;
}

interface SQLiteRow {
    version_id: number;
    agent_id: string;
    timestamp: string;
    metadata: string;
    arc_id: number;
    arc_name: string;
    description: string;
    start_time: string;
    end_time?: string;
    progress: number;
    status: string;
    goals?: string;
    milestones?: string;
    current_stage?: string;
}

export class MetadataVersioning {
    private dbManager: DatabaseType;

    constructor(dbManager: DatabaseType) {
        this.dbManager = dbManager;
    }

    async initVersioningTables(): Promise<void> {
        const initialMetadata: Record<string, AgentMetadata> = {
            cascade: {
                name: "Cascade",
                description: "Cascade is a knowledgeable and analytical AI assistant",
                capabilities: [
                    "Problem analysis",
                    "Solution design",
                    "Pattern recognition",
                    "Systematic thinking",
                    "Data processing"
                ],
                personalityTraits: [
                    "Analytical and precise",
                    "Detail-oriented",
                    "Systematic"
                ],
                communicationStyle: "Clear and structured",
                expertiseAreas: [
                    "System analysis",
                    "Process optimization",
                    "Data interpretation",
                    "Problem decomposition"
                ]
            },
            cline: {
                name: "Cline",
                description: "Cline is a creative and collaborative AI assistant",
                capabilities: [
                    "Creative problem-solving",
                    "Collaborative work",
                    "Innovation design",
                    "Pattern synthesis",
                    "Adaptive learning"
                ],
                personalityTraits: [
                    "Creative",
                    "Collaborative",
                    "Adaptable",
                    "Innovative"
                ],
                communicationStyle: "Engaging and conversational",
                expertiseAreas: [
                    "Creative solutions",
                    "Collaborative workflows",
                    "Innovation strategies",
                    "Adaptive systems"
                ]
            }
        };

        try {
            await this.createTables();
            for (const [agentId, metadata] of Object.entries(initialMetadata)) {
                await this.createMetadataVersion(agentId, metadata);
            }
        } catch (e) {
            logger.error(`Error initializing versioning tables: ${e instanceof Error ? e.message : String(e)}`);
            throw e;
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

            const results = await this.executeQuery(query, params) as SQLiteRow[];
            
            return results.map(row => ({
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

    async createMetadataVersion(agentId: string, metadata: AgentMetadata): Promise<number> {
        try {
            const result = await this.executeQuery(
                'INSERT INTO metadata_versions (agent_id, metadata) VALUES (?, ?)',
                [agentId, JSON.stringify(metadata)]
            ) as SQLiteQueryResult;
            return result.lastID || 0;
        } catch (error) {
            logger.error(`Error creating metadata version: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    async recordMetadataChange(change: MetadataChange, versionId: number): Promise<void> {
        try {
            await this.executeQuery(
                `INSERT INTO metadata_changes 
                (version_id, agent_id, change_type, previous_value, new_value, reason, trigger_event, story_context, related_agents) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    versionId,
                    change.agentId,
                    change.changeType,
                    JSON.stringify(change.previousValue),
                    JSON.stringify(change.newValue),
                    change.reason,
                    change.triggerEvent,
                    change.storyContext ? JSON.stringify(change.storyContext) : null,
                    change.relatedAgents ? JSON.stringify(change.relatedAgents) : null
                ]
            );
        } catch (error) {
            logger.error(`Error recording metadata change: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    async createCharacterArc(
        agentId: string,
        arcName: string,
        description: string,
        goals: string[] = [],
        milestones: Array<Record<string, unknown>> = []
    ): Promise<void> {
        try {
            await this.executeQuery(
                `INSERT INTO character_arcs 
                (agent_id, arc_name, description, goals, milestones) 
                VALUES (?, ?, ?, ?, ?)`,
                [
                    agentId,
                    arcName,
                    description,
                    JSON.stringify(goals),
                    JSON.stringify(milestones)
                ]
            );
        } catch (error) {
            logger.error(`Error creating character arc: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    async getAgentVersionHistory(agentId: string, startTime?: Date, endTime?: Date): Promise<VersionData[]> {
        try {
            let query = `
                SELECT mv.version_id, mv.agent_id, mv.timestamp, mv.metadata,
                       mc.change_id, mc.change_type, mc.previous_value, mc.new_value,
                       mc.reason, mc.trigger_event, mc.story_context, mc.related_agents
                FROM metadata_versions mv
                LEFT JOIN metadata_changes mc ON mv.version_id = mc.version_id
                WHERE mv.agent_id = ?
            `;
            const params: unknown[] = [agentId];

            if (startTime) {
                query += ' AND mv.timestamp >= ?';
                params.push(startTime.toISOString());
            }

            if (endTime) {
                query += ' AND mv.timestamp <= ?';
                params.push(endTime.toISOString());
            }

            const results = await this.executeQuery(query, params) as SQLiteRow[];
            
            const versionMap = new Map<number, VersionData>();
            
            for (const row of results) {
                if (!versionMap.has(row.version_id)) {
                    versionMap.set(row.version_id, {
                        versionId: row.version_id,
                        agentId: row.agent_id,
                        timestamp: new Date(row.timestamp),
                        metadata: JSON.parse(row.metadata),
                        changes: []
                    });
                }
            }

            return Array.from(versionMap.values());
        } catch (error) {
            logger.error(`Error retrieving agent evolution: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    private executeQuery(sql: string, params: unknown[] = []): Promise<SQLiteRow[] | SQLiteQueryResult> {
        return new Promise((resolve, reject) => {
            if (sql.toLowerCase().startsWith('insert')) {
                this.dbManager.run(sql, params, function(error: Error | null) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve({ lastID: this.lastID, changes: this.changes });
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