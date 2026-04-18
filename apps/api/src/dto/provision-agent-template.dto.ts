import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class ProvisionAgentTemplateDto {
  @IsString()
  @IsIn(['tnf', 'claude'])
  bank!: 'tnf' | 'claude';

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  filename!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  provider!: string;
}
