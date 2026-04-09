import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import type {
  ResourceSearchProtocolActor,
  ResourceSearchProtocolRequestEnvelope,
  ResourceSearchProtocolResponseEnvelope,
  ResourceSearchProtocolTrace,
  ResourceSearchResponse,
} from '@the-new-fuse/types';
import {
  ResourceDto,
  ResourceSearchEnvelopeDto,
  ResourceSearchRequestDto,
} from './resource-search.dto';

export class ResourceSearchProtocolActorDto implements ResourceSearchProtocolActor {
  @ApiPropertyOptional()
  id?: string;

  @ApiPropertyOptional({ type: [String] })
  roles?: string[];
}

export class ResourceSearchProtocolTraceDto implements ResourceSearchProtocolTrace {
  @ApiProperty()
  correlation_id!: string;

  @ApiProperty({ nullable: true })
  causation_id!: string | null;
}

export class ResourceSearchProtocolRequestEnvelopeDto implements ResourceSearchProtocolRequestEnvelope {
  @ApiProperty()
  id!: string;

  @ApiProperty({ default: 'sgp/0.1' })
  spec!: string;

  @ApiProperty({ enum: ['RESOURCE.SEARCH.REQUEST'] })
  type!: 'RESOURCE.SEARCH.REQUEST';

  @ApiProperty()
  tenant!: string;

  @ApiProperty()
  resource!: string;

  @ApiProperty()
  sent_at!: string;

  @ApiPropertyOptional({ type: ResourceSearchProtocolActorDto })
  actor?: ResourceSearchProtocolActorDto;

  @ApiProperty({ type: ResourceSearchProtocolTraceDto })
  trace!: ResourceSearchProtocolTraceDto;

  @ApiProperty({ type: ResourceSearchRequestDto })
  payload!: ResourceSearchRequestDto;
}

export class ResourceSearchProtocolResponseEnvelopeDto implements ResourceSearchProtocolResponseEnvelope<ResourceDto> {
  @ApiProperty()
  id!: string;

  @ApiProperty({ default: 'sgp/0.1' })
  spec!: string;

  @ApiProperty({ enum: ['RESOURCE.SEARCH.RESPONSE'] })
  type!: 'RESOURCE.SEARCH.RESPONSE';

  @ApiProperty()
  tenant!: string;

  @ApiProperty()
  resource!: string;

  @ApiProperty()
  sent_at!: string;

  @ApiPropertyOptional({ type: ResourceSearchProtocolActorDto })
  actor?: ResourceSearchProtocolActorDto;

  @ApiProperty({ type: ResourceSearchProtocolTraceDto })
  trace!: ResourceSearchProtocolTraceDto;

  @ApiProperty({
    oneOf: [
      {
        type: 'array',
        items: { $ref: getSchemaPath(ResourceDto) },
      },
      {
        $ref: getSchemaPath(ResourceSearchEnvelopeDto),
      },
    ],
  })
  payload!: ResourceSearchResponse<ResourceDto>;
}
