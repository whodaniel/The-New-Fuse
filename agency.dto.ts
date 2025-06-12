import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean } from 'class-validator';

/**
 * DTO for creating a new agency
 */
export class CreateAgencyDto {
  @ApiProperty({ 
    description: 'Agency name', 
    example: 'Acme Digital Agency' 
  })
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @ApiProperty({ 
    description: 'Subdomain for the agency (must be unique)', 
    example: 'acme-digital' 
  })
  @IsString()
  @IsNotEmpty()
  subdomain: string = '';

  @ApiProperty({ 
    description: 'Administrator email address', 
    example: 'admin@acmedigital.com' 
  })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string = '';

  @ApiProperty({ 
    description: 'Administrator full name', 
    example: 'John Smith' 
  })
  @IsString()
  @IsNotEmpty()
  adminName: string = '';

  @ApiProperty({ 
    description: 'Enable swarm orchestration for the agency', 
    example: true, 
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  enableSwarmOrchestration?: boolean;
}

/**
 * DTO for updating an existing agency
 */
export class UpdateAgencyDto {
  @ApiProperty({ 
    description: 'Agency name', 
    example: 'Acme Digital Agency Updated',
    required: false 
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ 
    description: 'Administrator email address', 
    example: 'newemail@acmedigital.com',
    required: false 
  })
  @IsEmail()
  @IsOptional()
  adminEmail?: string;

  @ApiProperty({ 
    description: 'Administrator full name', 
    example: 'Jane Smith',
    required: false 
  })
  @IsString()
  @IsOptional()
  adminName?: string;
}

/**
 * DTO for agency status response
 */
export class AgencyStatusResponseDto {
  @ApiProperty({ 
    description: 'Unique agency identifier', 
    example: 'uuid-12345-67890' 
  })
  id: string = '';

  @ApiProperty({ 
    description: 'Agency name', 
    example: 'Acme Digital Agency' 
  })
  name: string = '';

  @ApiProperty({ 
    description: 'Agency subdomain', 
    example: 'acme-digital' 
  })
  subdomain: string = '';

  @ApiProperty({ 
    description: 'Current agency status', 
    example: 'active',
    enum: ['active', 'inactive', 'suspended']
  })
  status: 'active' | 'inactive' | 'suspended' = 'active';

  @ApiProperty({ 
    description: 'Whether swarm orchestration is enabled', 
    example: true 
  })
  swarmEnabled: boolean = false;

  @ApiProperty({ 
    description: 'Number of active agents in the swarm', 
    example: 5 
  })
  activeAgents: number = 0;

  @ApiProperty({ 
    description: 'Last activity timestamp', 
    example: '2024-01-15T10:30:00Z' 
  })
  lastActivity: Date = new Date();
}

/**
 * DTO for agency swarm configuration
 */
export class ToggleSwarmDto {
  @ApiProperty({ 
    description: 'Enable or disable swarm orchestration', 
    example: true 
  })
  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean = false;
}

/**
 * DTO for paginated agency list query
 */
export class AgencyListQueryDto {
  @ApiProperty({ 
    description: 'Page number for pagination', 
    example: 1, 
    required: false 
  })
  @IsOptional()
  page?: number;

  @ApiProperty({ 
    description: 'Number of items per page', 
    example: 20, 
    required: false 
  })
  @IsOptional()
  limit?: number;
}

/**
 * DTO for agency list response
 */
export class AgencyListResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean = true;

  @ApiProperty({ 
    description: 'List of agencies',
    type: [AgencyStatusResponseDto]
  })
  data: AgencyStatusResponseDto[] = [];

  @ApiProperty({ 
    description: 'Pagination information' 
  })
  pagination: {
    page!: number;
    limit!: number;
    total!: number;
  } = { page!: 1, limit: 20, total: 0 };
}

/**
 * Standard API response wrapper DTO
 */
export class StandardResponseDto<T = any> {
  @ApiProperty({ description: 'Success status' })
  success: boolean = true;

  @ApiProperty({ description: 'Response data' })
  data?: T;

  @ApiProperty({ description: 'Response message' })
  message?: string;
}