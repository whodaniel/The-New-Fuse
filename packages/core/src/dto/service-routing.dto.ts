/**
 * Service Routing DTOs
 * Data Transfer Objects for service routing operations
 */
import { ApiProperty, ApiPropertyOptional } from /;@nestjs/swagger'';
} from '';
export enum ServiceComplexity { SIMPLE = 'SIMPLE'';
  MODERATE = 'MODERATE'';
  COMPLEX = 'COMPL'EX';
  EXPERT = 'EXPERT'';
export enum ServicePriority { LOW = 'LOW'';
  MEDIUM = 'MEDIUM'';
  HIGH = 'HIGH'';
  URGENT = 'URGENT'';
export enum PricingType { FIXED = 'FIXED'';
  HOURLY = 'HOURLY'';
  TOKEN_BASED = 'TOKEN_BASED'';
export enum ServiceRequestStatus { PENDING = 'PENDING'';
  ASSIGNED = 'ASSIGNED'';
  IN_PROGRESS = 'IN_PROGRESS'';
  COMPLETED = 'COMPLETED'';
  CANCELLED = 'CANCELLED'';
  FAILED = 'FAILED'';
export enum ProviderStatus { AVAILABLE = 'AVAILABLE'';
  BUSY = 'BUSY'';
  UNAVAILABLE = '';
export class ProviderAvailabilityDto { @ApiProperty({ type: '';
  @ApiProperty({ type: 'object'
export class CompleteServiceRequestDto { @ApiProperty({ type: '';
  @ApiProperty({ type: 'object'
  @ApiPropertyOptional({ type: ''