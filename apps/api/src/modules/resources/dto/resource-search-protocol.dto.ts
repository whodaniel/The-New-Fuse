import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import {
  ResourceDto,
  ResourceSearchEnvelopeDto,
  ResourceSearchRequestDto,
} from './resource-search.dto';

export class ResourceSearchProtocolActorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: [String] })
  roles!: string[];
}

export class ResourceSearchProtocolTraceDto {
  @ApiProperty()
  correlation_id!: string;

  @ApiProperty({ nullable: true })
  causation_id!: string | null;
}

export class ResourceSearchProtocolRequestEnvelopeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ default: 'sgp/0.1' })
  spec!: 'sgp/0.1';

  @ApiProperty({ enum: ['DISCOVER.REQUEST', 'QUERY.REQUEST'] })
  type!: 'DISCOVER.REQUEST' | 'QUERY.REQUEST';

  @ApiProperty()
  tenant!: string;

  @ApiProperty()
  resource!: string;

  @ApiProperty()
  sent_at!: string;

  @ApiProperty({ type: ResourceSearchProtocolActorDto })
  actor!: ResourceSearchProtocolActorDto;

  @ApiProperty({ type: ResourceSearchProtocolTraceDto })
  trace!: ResourceSearchProtocolTraceDto;

  @ApiProperty({ type: ResourceSearchRequestDto })
  payload!: ResourceSearchRequestDto;

  @ApiPropertyOptional()
  sig?: string;
}

export class ResourceSearchProtocolResponseEnvelopeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ default: 'sgp/0.1' })
  spec!: 'sgp/0.1';

  @ApiProperty({ enum: ['DISCOVER.RESPONSE', 'QUERY.RESPONSE', 'ERROR'] })
  type!: 'DISCOVER.RESPONSE' | 'QUERY.RESPONSE' | 'ERROR';

  @ApiProperty()
  tenant!: string;

  @ApiProperty()
  resource!: string;

  @ApiProperty()
  sent_at!: string;

  @ApiProperty({ type: ResourceSearchProtocolActorDto })
  actor!: ResourceSearchProtocolActorDto;

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
  payload!: any;

  @ApiPropertyOptional()
  sig?: string;
}
