// @ts-ignore
// @ts-ignore
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PersonalSkillDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  instructions!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({ type: Object })
  metadata!: Record<string, unknown>;

  @ApiProperty()
  isPrivate!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CreatePersonalSkillDto {
  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  instructions!: string;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, unknown>;
}

export class UpdatePersonalSkillDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  instructions?: string;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, unknown>;
}
