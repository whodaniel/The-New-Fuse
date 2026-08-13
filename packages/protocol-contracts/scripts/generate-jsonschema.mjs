import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

import { ExecuteRequestSchema, ExecuteResponseSchema } from '../src/adk-gateway.ts';
import {
  AkashComputeAgentMetadataSchema,
  AkashDeploymentInputSchema,
  AkashProviderInfoSchema,
  AITrainingJobInputSchema,
  AOProcessStateSchema,
  AOStateManagementInputSchema,
  ArweaveMemoryAgentMetadataSchema,
  ArweaveStorageInputSchema,
  ArweaveTransactionSchema,
  AuditLogEntrySchema,
  AuditLogResultSchema,
  CrossChainBridgeInputSchema,
  CrossChainBridgeResultSchema,
  DataRetrievalResultSchema,
  DeploymentResultSchema,
  EnsoDeFiAgentMetadataSchema,
  EnsoDeFiInputSchema,
  EnsoExecutionResultSchema,
  GeneratedModel3DSchema,
  GPUResourceUsageSchema,
  Image3DGenerationInputSchema,
  ImageGenerationInputSchema,
  InferenceAPIResultSchema,
  InferenceServiceInputSchema,
  MemoryQueryInputSchema,
  QueryResultSchema,
  RenderAssetSchema,
  RenderJobInputSchema,
  RenderJobResultSchema,
  RenderNetworkAgentMetadataSchema,
  RouteStepSchema,
  StorageResultSchema,
  TokenAmountSchema,
  TokenSwapInputSchema,
  TrainingJobResultSchema,
  TransactionResultSchema,
  YieldOpportunitySchema,
  YieldOptimizationReportSchema,
  YieldStakingInputSchema,
} from '../src/crypto.ts';
import {
  AgentIdentitySchema,
  AuctionPayloadSchema,
  BidPayloadSchema,
  EventPayloadSchema,
  MessageContextSchema,
  MessageTypeSchema,
  ResponsePayloadSchema,
  StateSyncPayloadSchema,
  TaskPayloadSchema,
  TNFEnvelopeSchema,
} from '../src/envelope.ts';
import {
  FederationGateDecisionSchema,
  HandoffAckSchema,
  HandoffPacketSchema,
  HandoffPayloadSchema,
  HandoffPrioritySchema,
  HandoffStatusSchema,
  MasterCumulativeIdSchema,
  TNFResourcePointerSchema,
} from '../src/handoff.ts';
import {
  ResourceNegotiationPayloadSchema,
  ResourceStrategySchema,
  ResourceTierSchema,
} from '../src/resource.ts';
import { SgpEnvelopeSchema, SgpPayloadSchema } from '../src/sgp.ts';
import { TwipEnvelopeSchema, TwipIdentitySchema } from '../src/twip.ts';
import { ScrapeRequestSchema, ScrapeResponseSchema } from '../src/web-scraping.ts';

const CryptoOperationsRegistrySchema = z.object({
  // Shared/Common
  TokenAmount: TokenAmountSchema,
  RouteStep: RouteStepSchema,
  TransactionResult: TransactionResultSchema,

  // ENSO DeFi
  EnsoDeFiInput: EnsoDeFiInputSchema,
  TokenSwapInput: TokenSwapInputSchema,
  YieldStakingInput: YieldStakingInputSchema,
  CrossChainBridgeInput: CrossChainBridgeInputSchema,
  EnsoExecutionResult: EnsoExecutionResultSchema,
  YieldOpportunity: YieldOpportunitySchema,
  YieldOptimizationReport: YieldOptimizationReportSchema,
  CrossChainBridgeResult: CrossChainBridgeResultSchema,
  EnsoDeFiAgentMetadata: EnsoDeFiAgentMetadataSchema,

  // Akash Compute
  AkashDeploymentInput: AkashDeploymentInputSchema,
  AITrainingJobInput: AITrainingJobInputSchema,
  InferenceServiceInput: InferenceServiceInputSchema,
  AkashProviderInfo: AkashProviderInfoSchema,
  DeploymentResult: DeploymentResultSchema,
  TrainingJobResult: TrainingJobResultSchema,
  InferenceAPIResult: InferenceAPIResultSchema,
  AkashComputeAgentMetadata: AkashComputeAgentMetadataSchema,

  // Arweave & AO Memory
  ArweaveStorageInput: ArweaveStorageInputSchema,
  AuditLogEntry: AuditLogEntrySchema,
  AOStateManagementInput: AOStateManagementInputSchema,
  MemoryQueryInput: MemoryQueryInputSchema,
  ArweaveTransaction: ArweaveTransactionSchema,
  StorageResult: StorageResultSchema,
  AOProcessState: AOProcessStateSchema,
  AuditLogResult: AuditLogResultSchema,
  QueryResult: QueryResultSchema,
  DataRetrievalResult: DataRetrievalResultSchema,
  ArweaveMemoryAgentMetadata: ArweaveMemoryAgentMetadataSchema,

  // Render Network
  RenderJobInput: RenderJobInputSchema,
  Image3DGenerationInput: Image3DGenerationInputSchema,
  ImageGenerationInput: ImageGenerationInputSchema,
  RenderAsset: RenderAssetSchema,
  RenderJobResult: RenderJobResultSchema,
  GeneratedModel3D: GeneratedModel3DSchema,
  GPUResourceUsage: GPUResourceUsageSchema,
  RenderNetworkAgentMetadata: RenderNetworkAgentMetadataSchema,
});

const MessagingRegistrySchema = z.object({
  AgentIdentity: AgentIdentitySchema,
  MessageType: MessageTypeSchema,
  MessageContext: MessageContextSchema,
  TNFEnvelope: TNFEnvelopeSchema,
  TaskPayload: TaskPayloadSchema,
  EventPayload: EventPayloadSchema,
  StateSyncPayload: StateSyncPayloadSchema,
  ResponsePayload: ResponsePayloadSchema,
  AuctionPayload: AuctionPayloadSchema,
  BidPayload: BidPayloadSchema,
  ResourceTier: ResourceTierSchema,
  ResourceStrategy: ResourceStrategySchema,
  ResourceNegotiationPayload: ResourceNegotiationPayloadSchema,
  HandoffPriority: HandoffPrioritySchema,
  HandoffStatus: HandoffStatusSchema,
  FederationGateDecision: FederationGateDecisionSchema,
  MasterCumulativeId: MasterCumulativeIdSchema,
  TNFResourcePointer: TNFResourcePointerSchema,
  HandoffPayload: HandoffPayloadSchema,
  HandoffPacket: HandoffPacketSchema,
  HandoffAck: HandoffAckSchema,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const generatedRoot = path.join(packageRoot, 'generated', 'jsonschema');
const docsSchemaRoot = path.join(repoRoot, 'docs', 'protocols', 'schemas');

const SCHEMA_DRAFT = 'https://json-schema.org/draft/2020-12/schema';

const entries = [
  {
    schema: TwipEnvelopeSchema,
    title: 'TWIP Envelope',
    id: 'https://tnf.local/spec/twip/0.1/twip-envelope.schema.json',
    outputPath: path.join('twip', 'twip-envelope.schema.json'),
    docsMirror: 'twip-envelope.schema.json',
  },
  {
    schema: TwipIdentitySchema,
    title: 'TWIP Identity',
    id: 'https://tnf.local/spec/twip/0.1/twip-identity.schema.json',
    outputPath: path.join('twip', 'twip-identity.schema.json'),
    docsMirror: 'twip-identity.schema.json',
  },
  {
    schema: SgpEnvelopeSchema,
    title: 'SGP Message Envelope',
    id: 'https://tnf.local/spec/sgp/0.1/envelope.schema.json',
    outputPath: path.join('sgp', 'sgp-envelope.schema.json'),
    docsMirror: 'sgp-envelope.schema.json',
    forceObjectRoot: true,
  },
  {
    schema: SgpPayloadSchema,
    title: 'SGP Payloads by Message Type',
    id: 'https://tnf.local/spec/sgp/0.1/payloads.schema.json',
    outputPath: path.join('sgp', 'sgp-payloads.schema.json'),
    docsMirror: 'sgp-payloads.schema.json',
    forceObjectRoot: true,
  },
  {
    schema: ExecuteRequestSchema,
    title: 'ExecuteRequest',
    id: 'https://tnf.local/spec/adk/0.1/execute-request.schema.json',
    outputPath: path.join('adk', 'execute-request.schema.json'),
    adjuster: 'adkExecuteRequest',
  },
  {
    schema: ExecuteResponseSchema,
    title: 'ExecuteResponse',
    id: 'https://tnf.local/spec/adk/0.1/execute-response.schema.json',
    outputPath: path.join('adk', 'execute-response.schema.json'),
  },
  {
    schema: ScrapeRequestSchema,
    title: 'ScrapeRequest',
    id: 'https://tnf.local/spec/scraping/0.1/scrape-request.schema.json',
    outputPath: path.join('scraping', 'scrape-request.schema.json'),
    adjuster: 'scrapeRequest',
  },
  {
    schema: ScrapeResponseSchema,
    title: 'ScrapeResponse',
    id: 'https://tnf.local/spec/scraping/0.1/scrape-response.schema.json',
    outputPath: path.join('scraping', 'scrape-response.schema.json'),
  },
  {
    schema: CryptoOperationsRegistrySchema,
    title: 'Crypto Operations Bundle',
    id: 'https://tnf.local/spec/crypto/0.1/crypto.schema.json',
    outputPath: path.join('crypto', 'crypto.schema.json'),
    forceObjectRoot: true,
  },
  {
    schema: MessagingRegistrySchema,
    title: 'TNF Messaging Bundle',
    id: 'https://tnf.local/spec/messaging/0.1/envelope.schema.json',
    outputPath: path.join('messaging', 'envelope.schema.json'),
    forceObjectRoot: true,
  },
];


function sortDeep(value) {
  if (Array.isArray(value)) {
    return value.map(sortDeep);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, sortDeep(nested)]),
  );
}

function addMetadata(schemaJson, title, id, forceObjectRoot = false) {
  const sorted = sortDeep(schemaJson);
  const { $schema: _ignoreSchema, $id: _ignoreId, title: _ignoreTitle, ...rest } = sorted;
  const withMeta = {
    $schema: SCHEMA_DRAFT,
    $id: id,
    title,
    ...rest,
  };

  if (forceObjectRoot && typeof withMeta.type === 'undefined') {
    withMeta.type = 'object';
  }

  return withMeta;
}

function stripRequiredFields(schemaJson, fields) {
  if (!schemaJson || typeof schemaJson !== 'object') {
    return;
  }

  if (!Array.isArray(schemaJson.required)) {
    return;
  }

  schemaJson.required = schemaJson.required.filter((field) => !fields.includes(field));
  if (schemaJson.required.length === 0) {
    delete schemaJson.required;
  }
}

function applyAdjustments(schemaJson, adjuster) {
  if (adjuster === 'adkExecuteRequest') {
    stripRequiredFields(schemaJson, ['model', 'tools', 'metadata', 'timeoutMs']);
    stripRequiredFields(schemaJson?.properties?.input, ['messages']);
    stripRequiredFields(schemaJson?.properties?.metadata, ['provider']);
  }

  if (adjuster === 'scrapeRequest') {
    stripRequiredFields(schemaJson, ['max_chars', 'timeout_ms', 'main_content_only']);
  }
}

async function writeJson(targetPath, value) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  for (const entry of entries) {
    const schemaJson = z.toJSONSchema(entry.schema);
    const withMeta = addMetadata(schemaJson, entry.title, entry.id, Boolean(entry.forceObjectRoot));
    applyAdjustments(withMeta, entry.adjuster);

    const generatedPath = path.join(generatedRoot, entry.outputPath);
    await writeJson(generatedPath, withMeta);

    if (entry.docsMirror) {
      const docsPath = path.join(docsSchemaRoot, entry.docsMirror);
      await writeJson(docsPath, withMeta);
    }

    console.log(`[protocol-contracts] wrote ${path.relative(repoRoot, generatedPath)}`);
  }
}

main().catch((error) => {
  console.error(`[protocol-contracts] generation failed: ${error.message}`);
  process.exit(1);
});
