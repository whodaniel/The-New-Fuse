import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AgentCapabilityDto {
  @ApiProperty({ description: 'Capability name', example: 'code_generation' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Capability type',
    enum: ['core', 'extended', 'custom'],
    example: 'core',
  })
  @IsEnum(['core', 'extended', 'custom'])
  type: 'core' | 'extended' | 'custom';

  @ApiPropertyOptional({ description: 'Capability version', example: '1.0.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ description: 'Capability description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Capability parameters', type: 'object' })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;
}

export class IdentityDto {
  @ApiPropertyOptional({ description: 'Long-term identity ID' })
  @IsString()
  @IsOptional()
  longTermId?: string;

  @ApiPropertyOptional({ description: 'Ephemeral identity ID' })
  @IsString()
  @IsOptional()
  ephemeralId?: string;

  @ApiPropertyOptional({ description: 'Federation identity ID' })
  @IsString()
  @IsOptional()
  federationId?: string;

  @ApiPropertyOptional({ description: 'Identity protocol version', example: 'tnf-1' })
  @IsString()
  @IsOptional()
  protocolVersion?: string;

  @ApiPropertyOptional({ description: 'Identity assignment policy', example: 'network-issued' })
  @IsString()
  @IsOptional()
  assignmentPolicy?: string;
}

export class TrustDto {
  @ApiPropertyOptional({ description: 'Trust tier', example: 'unverified' })
  @IsString()
  @IsOptional()
  tier?: string;

  @ApiPropertyOptional({ description: 'Trust verifier or issuer' })
  @IsString()
  @IsOptional()
  verifiedBy?: string;

  @ApiPropertyOptional({ description: 'Trust evidence payload', type: 'object' })
  @IsObject()
  @IsOptional()
  evidence?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Trust expiration timestamp', example: '2026-12-31T23:59:59Z' })
  @IsString()
  @IsOptional()
  expiresAt?: string;
}

export class SkillsProfileDto {
  @ApiPropertyOptional({ description: 'Skills use progressive disclosure' })
  @IsBoolean()
  @IsOptional()
  progressiveDisclosure?: boolean;

  @ApiPropertyOptional({ description: 'Skills can dynamically load MCP servers' })
  @IsBoolean()
  @IsOptional()
  dynamicMcpLoading?: boolean;

  @ApiPropertyOptional({ description: 'Skill identifiers', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skillIds?: string[];

  @ApiPropertyOptional({ description: 'Skill providers', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skillProviders?: string[];
}

export class McpProfileDto {
  @ApiPropertyOptional({ description: 'Allow dynamic MCP loading' })
  @IsBoolean()
  @IsOptional()
  allowDynamicLoading?: boolean;

  @ApiPropertyOptional({ description: 'MCP servers', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  servers?: string[];

  @ApiPropertyOptional({ description: 'MCP allowlist entries', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowlist?: string[];
}

export class MemoryProfileDto {
  @ApiPropertyOptional({ description: 'Memory provider identifier' })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional({ description: 'Memory retention days' })
  @IsNumber()
  @IsOptional()
  retentionDays?: number;

  @ApiPropertyOptional({ description: 'Memory namespace' })
  @IsString()
  @IsOptional()
  namespace?: string;

  @ApiPropertyOptional({ description: 'Vector store name' })
  @IsString()
  @IsOptional()
  vectorStore?: string;

  @ApiPropertyOptional({ description: 'Memory encryption enabled' })
  @IsBoolean()
  @IsOptional()
  encrypted?: boolean;
}

export class HandoffProfileDto {
  @ApiPropertyOptional({ description: 'Handoff protocol version' })
  @IsString()
  @IsOptional()
  protocolVersion?: string;

  @ApiPropertyOptional({ description: 'Handoff required' })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Allowed handoff modes', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  modes?: string[];
}

export class ProtocolMappingDto {
  @ApiPropertyOptional({ description: 'OpenClaw protocol enabled' })
  @IsBoolean()
  @IsOptional()
  openclaw?: boolean;

  @ApiPropertyOptional({ description: 'Skills profile', type: SkillsProfileDto })
  @ValidateNested()
  @Type(() => SkillsProfileDto)
  @IsOptional()
  skills?: SkillsProfileDto;

  @ApiPropertyOptional({ description: 'MCP profile', type: McpProfileDto })
  @ValidateNested()
  @Type(() => McpProfileDto)
  @IsOptional()
  mcp?: McpProfileDto;

  @ApiPropertyOptional({ description: 'Handoff profile', type: HandoffProfileDto })
  @ValidateNested()
  @Type(() => HandoffProfileDto)
  @IsOptional()
  handoff?: HandoffProfileDto;

  @ApiPropertyOptional({ description: 'Memory profile', type: MemoryProfileDto })
  @ValidateNested()
  @Type(() => MemoryProfileDto)
  @IsOptional()
  memory?: MemoryProfileDto;

  @ApiPropertyOptional({ description: 'Ability/property mapping', type: 'object' })
  @IsObject()
  @IsOptional()
  abilityMap?: Record<string, any>;
}

export class RegisterAgentDto {
  @ApiProperty({ description: 'Agent name', example: 'CodeAssistantAgent' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Agent version', example: '1.0.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ description: 'Agent author', example: 'The New Fuse Team' })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiPropertyOptional({ description: 'Agent description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Agent capabilities', type: [AgentCapabilityDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentCapabilityDto)
  capabilities: AgentCapabilityDto[];

  @ApiPropertyOptional({ description: 'Agent metadata', type: 'object' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Invitation code required to register agent' })
  @IsString()
  @IsNotEmpty()
  invitationCode: string;

  @ApiPropertyOptional({ description: 'Tenant identifier for multi-tenant routing' })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Organization identifier' })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Agency identifier (workspace ID)' })
  @IsString()
  @IsOptional()
  agencyId?: string;

  @ApiPropertyOptional({ description: 'Identity payload (long-term and ephemeral IDs)', type: 'object' })
  @ValidateNested()
  @Type(() => IdentityDto)
  @IsOptional()
  identity?: IdentityDto;

  @ApiPropertyOptional({ description: 'Trust and verification payload', type: 'object' })
  @ValidateNested()
  @Type(() => TrustDto)
  @IsOptional()
  trust?: TrustDto;

  @ApiPropertyOptional({ description: 'Protocol mapping and profiles', type: ProtocolMappingDto })
  @ValidateNested()
  @Type(() => ProtocolMappingDto)
  @IsOptional()
  protocols?: ProtocolMappingDto;

  @ApiPropertyOptional({ description: 'Heartbeat interval in milliseconds', example: 60000 })
  @IsOptional()
  heartbeatInterval?: number;
}
