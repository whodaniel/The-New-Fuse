/**
 * Theia Persistence Service
 * 
 * Implements hybrid data persistence strategy for Theia IDE:
 * - Database: Persistent user data, workspaces, configurations
 * - Local Storage: UI preferences, temporary settings
 * - File System: Project files, caches
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { StorageService } from '@theia/core/lib/browser/storage-service';
import { getTheiaDbClient } from '../database/TheiaDbConnection';
import { TheiaDatabaseService, TheiaWorkspace, TheiaAIConfiguration, TheiaMCPServer } from '../../../packages/theia-integration/src/TheiaDatabaseService';
import { PrismaClient } from '@prisma/client';

export interface PersistenceConfig {
  enableDatabasePersistence: boolean;
  enableLocalStoragePersistence: boolean;
  enableFileSystemPersistence: boolean;
  syncInterval: number;
  maxRetries: number;
}

export interface WorkspacePersistenceData {
  workspace: TheiaWorkspace;
  aiConfig?: TheiaAIConfiguration;
  mcpServers: TheiaMCPServer[];
  localPreferences: Record<string, any>;
}

@injectable()
export class TheiaPersistenceService {
  private dbService: TheiaDatabaseService | null = null;
  private prisma: PrismaClient | null = null;
  private config: PersistenceConfig;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(
    @inject(StorageService) private storageService: StorageService
  ) {
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  private getDefaultConfig(): PersistenceConfig {
    return {
      enableDatabasePersistence: true,
      enableLocalStoragePersistence: true,
      enableFileSystemPersistence: true,
      syncInterval: 30000, // 30 seconds
      maxRetries: 3,
    };
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize database connection
      if (this.config.enableDatabasePersistence) {
        this.prisma = await getTheiaDbClient();
        this.dbService = new TheiaDatabaseService(this.prisma);
        console.log('✅ Theia database persistence initialized');
      }

      // Start sync timer
      if (this.config.syncInterval > 0) {
        this.startSyncTimer();
      }

      console.log('✅ Theia persistence service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Theia persistence service:', error);
      // Fallback to local storage only
      this.config.enableDatabasePersistence = false;
    }
  }

  // ============================================================================
  // WORKSPACE PERSISTENCE
  // ============================================================================

  async saveWorkspace(workspace: Omit<TheiaWorkspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const workspaceId = `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save to database
    if (this.config.enableDatabasePersistence && this.dbService) {
      try {
        const savedWorkspace = await this.dbService.createWorkspace(workspace);
        console.log(`💾 Workspace saved to database: ${savedWorkspace.id}`);
        return savedWorkspace.id;
      } catch (error) {
        console.error('Failed to save workspace to database:', error);
      }
    }

    // Fallback to local storage
    if (this.config.enableLocalStoragePersistence) {
      try {
        const workspaceData = { ...workspace, id: workspaceId };
        await this.storageService.setData(`theia-workspace-${workspaceId}`, workspaceData);
        console.log(`💾 Workspace saved to local storage: ${workspaceId}`);
        return workspaceId;
      } catch (error) {
        console.error('Failed to save workspace to local storage:', error);
      }
    }

    throw new Error('Failed to save workspace: all persistence methods failed');
  }

  async loadWorkspace(workspaceId: string): Promise<TheiaWorkspace | null> {
    // Try database first
    if (this.config.enableDatabasePersistence && this.dbService) {
      try {
        const workspace = await this.dbService.getWorkspaceById(workspaceId);
        if (workspace) {
          console.log(`📖 Workspace loaded from database: ${workspaceId}`);
          return workspace;
        }
      } catch (error) {
        console.error('Failed to load workspace from database:', error);
      }
    }

    // Fallback to local storage
    if (this.config.enableLocalStoragePersistence) {
      try {
        const workspace = await this.storageService.getData(`theia-workspace-${workspaceId}`);
        if (workspace) {
          console.log(`📖 Workspace loaded from local storage: ${workspaceId}`);
          return workspace;
        }
      } catch (error) {
        console.error('Failed to load workspace from local storage:', error);
      }
    }

    return null;
  }

  async loadUserWorkspaces(userId: string): Promise<TheiaWorkspace[]> {
    // Try database first
    if (this.config.enableDatabasePersistence && this.dbService) {
      try {
        const workspaces = await this.dbService.getWorkspacesByUser(userId);
        console.log(`📖 Loaded ${workspaces.length} workspaces from database for user: ${userId}`);
        return workspaces;
      } catch (error) {
        console.error('Failed to load workspaces from database:', error);
      }
    }

    // Fallback to local storage (limited functionality)
    if (this.config.enableLocalStoragePersistence) {
      try {
        const allKeys = await this.storageService.getData('theia-workspace-keys') || [];
        const workspaces: TheiaWorkspace[] = [];
        
        for (const key of allKeys) {
          const workspace = await this.storageService.getData(key);
          if (workspace && workspace.userId === userId) {
            workspaces.push(workspace);
          }
        }
        
        console.log(`📖 Loaded ${workspaces.length} workspaces from local storage for user: ${userId}`);
        return workspaces;
      } catch (error) {
        console.error('Failed to load workspaces from local storage:', error);
      }
    }

    return [];
  }

  async updateWorkspace(workspaceId: string, updates: Partial<TheiaWorkspace>): Promise<void> {
    // Update in database
    if (this.config.enableDatabasePersistence && this.dbService) {
      try {
        await this.dbService.updateWorkspace(workspaceId, updates);
        console.log(`💾 Workspace updated in database: ${workspaceId}`);
      } catch (error) {
        console.error('Failed to update workspace in database:', error);
      }
    }

    // Update in local storage
    if (this.config.enableLocalStoragePersistence) {
      try {
        const existing = await this.storageService.getData(`theia-workspace-${workspaceId}`);
        if (existing) {
          const updated = { ...existing, ...updates };
          await this.storageService.setData(`theia-workspace-${workspaceId}`, updated);
          console.log(`💾 Workspace updated in local storage: ${workspaceId}`);
        }
      } catch (error) {
        console.error('Failed to update workspace in local storage:', error);
      }
    }
  }

  // ============================================================================
  // AI CONFIGURATION PERSISTENCE
  // ============================================================================

  async saveAIConfiguration(config: Omit<TheiaAIConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Save to database
    if (this.config.enableDatabasePersistence && this.dbService) {
      try {
        const savedConfig = await this.dbService.createAIConfiguration(config);
        console.log(`💾 AI configuration saved to database: ${savedConfig.id}`);
        return savedConfig.id;
      } catch (error) {
        console.error('Failed to save AI configuration to database:', error);
      }
    }

    // Fallback to local storage
    if (this.config.enableLocalStoragePersistence) {
      try {
        const configId = `ai_config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const configData = { ...config, id: configId };
        await this.storageService.setData(`theia-ai-config-${configId}`, configData);
        console.log(`💾 AI configuration saved to local storage: ${configId}`);
        return configId;
      } catch (error) {
        console.error('Failed to save AI configuration to local storage:', error);
      }
    }

    throw new Error('Failed to save AI configuration: all persistence methods failed');
  }

  async loadAIConfiguration(userId: string, workspaceId?: string): Promise<TheiaAIConfiguration | null> {
    // Try database first
    if (this.config.enableDatabasePersistence && this.dbService) {
      try {
        const config = await this.dbService.getAIConfigurationByUser(userId, workspaceId);
        if (config) {
          console.log(`📖 AI configuration loaded from database for user: ${userId}`);
          return config;
        }
      } catch (error) {
        console.error('Failed to load AI configuration from database:', error);
      }
    }

    // Fallback to local storage
    if (this.config.enableLocalStoragePersistence) {
      try {
        const config = await this.storageService.getData(`theia-ai-config-${userId}`);
        if (config) {
          console.log(`📖 AI configuration loaded from local storage for user: ${userId}`);
          return config;
        }
      } catch (error) {
        console.error('Failed to load AI configuration from local storage:', error);
      }
    }

    return null;
  }

  // ============================================================================
  // MCP SERVER PERSISTENCE
  // ============================================================================

  async saveMCPServer(server: Omit<TheiaMCPServer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Save to database
    if (this.config.enableDatabasePersistence && this.dbService) {
      try {
        const savedServer = await this.dbService.createMCPServer(server);
        console.log(`💾 MCP server saved to database: ${savedServer.id}`);
        return savedServer.id;
      } catch (error) {
        console.error('Failed to save MCP server to database:', error);
      }
    }

    // Fallback to local storage
    if (this.config.enableLocalStoragePersistence) {
      try {
        const serverId = `mcp_server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const serverData = { ...server, id: serverId };
        await this.storageService.setData(`theia-mcp-server-${serverId}`, serverData);
        console.log(`💾 MCP server saved to local storage: ${serverId}`);
        return serverId;
      } catch (error) {
        console.error('Failed to save MCP server to local storage:', error);
      }
    }

    throw new Error('Failed to save MCP server: all persistence methods failed');
  }

  async loadMCPServers(workspaceId: string): Promise<TheiaMCPServer[]> {
    // Try database first
    if (this.config.enableDatabasePersistence && this.dbService) {
      try {
        const servers = await this.dbService.getMCPServersByWorkspace(workspaceId);
        console.log(`📖 Loaded ${servers.length} MCP servers from database for workspace: ${workspaceId}`);
        return servers;
      } catch (error) {
        console.error('Failed to load MCP servers from database:', error);
      }
    }

    // Fallback to local storage
    if (this.config.enableLocalStoragePersistence) {
      try {
        const serverKeys = await this.storageService.getData(`theia-mcp-servers-${workspaceId}`) || [];
        const servers: TheiaMCPServer[] = [];
        
        for (const key of serverKeys) {
          const server = await this.storageService.getData(key);
          if (server) {
            servers.push(server);
          }
        }
        
        console.log(`📖 Loaded ${servers.length} MCP servers from local storage for workspace: ${workspaceId}`);
        return servers;
      } catch (error) {
        console.error('Failed to load MCP servers from local storage:', error);
      }
    }

    return [];
  }

  // ============================================================================
  // SYNC AND CLEANUP
  // ============================================================================

  private startSyncTimer(): void {
    this.syncTimer = setInterval(() => {
      this.syncData().catch(error => {
        console.error('Data sync failed:', error);
      });
    }, this.config.syncInterval);
  }

  private async syncData(): Promise<void> {
    // Sync local storage data to database if available
    if (this.config.enableDatabasePersistence && this.dbService && this.config.enableLocalStoragePersistence) {
      console.log('🔄 Syncing local data to database...');
      // Implementation would sync local storage data to database
      // This is a placeholder for the sync logic
    }
  }

  async cleanup(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }

    console.log('🧹 Theia persistence service cleaned up');
  }
}
