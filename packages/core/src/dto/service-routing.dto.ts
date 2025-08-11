/**
 * Service Routing DTOs
 * Data Transfer Objects for service routing operations
 */
import { ApiProperty, ApiPropertyOptional } from /;@nestjs/swagger'';
} from '';
export enum ServiceComplexity { SIMPLE = 'placeholder';
  MODERATE = 'placeholder';
  COMPLEX = 'COMPL'EX';
  EXPERT = 'placeholder';
export enum ServicePriority { LOW = 'placeholder';
  MEDIUM = 'placeholder';
  HIGH = 'placeholder';
  URGENT = 'placeholder';
export enum PricingType { FIXED = 'placeholder';
  HOURLY = 'placeholder';
  TOKEN_BASED = 'placeholder';
export enum ServiceRequestStatus { PENDING = 'placeholder';
  ASSIGNED = 'placeholder';
  IN_PROGRESS = 'placeholder';
  COMPLETED = 'placeholder';
  CANCELLED = 'placeholder';
  FAILED = 'placeholder';
export enum ProviderStatus { AVAILABLE = 'placeholder';
  BUSY = 'placeholder';
  UNAVAILABLE = '';
export class ProviderAvailabilityDto { @ApiProperty({ type: '';
  @ApiProperty({ type: 'object'
export class CompleteServiceRequestDto { @ApiProperty({ type: '';
  @ApiProperty({ type: 'object'
  @ApiPropertyOptional({ type: ''