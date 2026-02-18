import { Injectable, Logger } from '@nestjs/common';
import { db, sql } from '@the-new-fuse/database';

type RowMap = Record<string, any>;

@Injectable()
export class TnfRegistryService {
  private readonly logger = new Logger(TnfRegistryService.name);

  private rows(result: any): RowMap[] {
    if (Array.isArray(result)) {
      return result as RowMap[];
    }
    if (result?.rows && Array.isArray(result.rows)) {
      return result.rows as RowMap[];
    }
    return [];
  }

  async getDiscoverableAgents(): Promise<RowMap[]> {
    const result = await db.execute(sql`
      SELECT
        d.id,
        d.tnf_id,
        d.name,
        d.description,
        d.agent_type,
        d.access_level,
        d.is_system,
        d.version,
        d.capabilities,
        d.skills,
        d.tags,
        d.mcp_ids,
        lm.tnf_id AS default_llm_tnf_id,
        h.tnf_id AS default_harness_tnf_id,
        d.updated_at
      FROM tnf_agent_definitions d
      LEFT JOIN tnf_llm_models lm ON d.default_llm_id = lm.id
      LEFT JOIN tnf_harnesses h ON d.default_harness_id = h.id
      ORDER BY d.is_system DESC, d.name ASC
    `);

    return this.rows(result).map((row) => ({
      id: row.id,
      tnfId: row.tnf_id,
      name: row.name,
      description: row.description,
      agentType: row.agent_type,
      accessLevel: row.access_level,
      isSystem: row.is_system,
      version: row.version,
      capabilities: row.capabilities ?? [],
      skills: row.skills ?? [],
      tags: row.tags ?? [],
      mcpIds: row.mcp_ids ?? [],
      defaultLlmTnfId: row.default_llm_tnf_id,
      defaultHarnessTnfId: row.default_harness_tnf_id,
      updatedAt: row.updated_at,
      source: 'tnf_v2',
    }));
  }

  async getFrontloadSnapshot(): Promise<RowMap> {
    const [agentsResult, llmResult, harnessResult, mcpResult] = await Promise.all([
      db.execute(sql`
        SELECT tnf_id, name, agent_type, is_system, access_level, version
        FROM tnf_agent_definitions
        ORDER BY is_system DESC, name ASC
      `),
      db.execute(sql`
        SELECT tnf_id, name, provider, model_id, family, version, is_current
        FROM tnf_llm_models
        ORDER BY provider ASC, name ASC
      `),
      db.execute(sql`
        SELECT tnf_id, name, platform, instance, environment, status, ws_url, endpoint_url
        FROM tnf_harnesses
        ORDER BY name ASC
      `),
      db.execute(sql`
        SELECT tnf_id, name, protocol, scope, status, command
        FROM tnf_mcp_servers
        ORDER BY name ASC
      `),
    ]);

    const agents = this.rows(agentsResult);
    const llmModels = this.rows(llmResult);
    const harnesses = this.rows(harnessResult);
    const mcpServers = this.rows(mcpResult);

    this.logger.log(
      `Frontload snapshot generated from TNF V2 (${agents.length} agents, ${llmModels.length} models, ${harnesses.length} harnesses, ${mcpServers.length} MCPs)`
    );

    return {
      source: 'tnf_v2',
      generatedAt: new Date().toISOString(),
      counts: {
        agents: agents.length,
        llmModels: llmModels.length,
        harnesses: harnesses.length,
        mcpServers: mcpServers.length,
      },
      agents: agents.map((row) => ({
        tnfId: row.tnf_id,
        name: row.name,
        agentType: row.agent_type,
        isSystem: row.is_system,
        accessLevel: row.access_level,
        version: row.version,
      })),
      llmModels: llmModels.map((row) => ({
        tnfId: row.tnf_id,
        name: row.name,
        provider: row.provider,
        modelId: row.model_id,
        family: row.family,
        version: row.version,
        isCurrent: row.is_current,
      })),
      harnesses: harnesses.map((row) => ({
        tnfId: row.tnf_id,
        name: row.name,
        platform: row.platform,
        instance: row.instance,
        environment: row.environment,
        status: row.status,
        wsUrl: row.ws_url,
        endpointUrl: row.endpoint_url,
      })),
      mcpServers: mcpServers.map((row) => ({
        tnfId: row.tnf_id,
        name: row.name,
        protocol: row.protocol,
        scope: row.scope,
        status: row.status,
        command: row.command,
      })),
    };
  }
}
