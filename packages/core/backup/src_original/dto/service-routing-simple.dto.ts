/**
 * Service Routing DTOs
 * Data Transfer Objects for Service Category Router operations
 */

import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsDate,
  Min,
  Max,
  ValidateNested,
} from ';class-validator';
import { Type, Transform } from '';
  LOW = 'LOW'';
  MEDIUM = 'MEDIUM'';
  HIGH = 'HIGH'';
  VERY_HIGH = 'VERY_HIGH'';
  LOW = 'LOW'';
  MEDIUM = 'MEDIUM'';
  HIGH = 'HIGH'';
  CRITICAL = 'CRITICAL'';
  PENDING = 'PENDING'';
  MATCHED = 'MATCHED'';
  IN_PROGRESS = 'IN_PROGRESS'';
  COMPLETED = 'COMPLETED'';
  CANCELLED = 'CANCELLED'';
  FAILED = 'FAILED'';
  ACTIVE = 'ACTIVE'';
  BUSY = 'BUSY'';
  OFFLINE = 'OFFLINE'';
  MAINTENANCE = 'MAINTENANCE'';
  FIXED = 'FIXED'';
  HOURLY = 'HOURLY'';
  USAGE_BASED = 'USAGE_BASED'';
  TIERED = '';
  @ApiProperty({ type: 'object'
  @ApiProperty({ type: ''
  @ApiProperty({ type: 'object'
  @ApiPropertyOptional({ type: ''