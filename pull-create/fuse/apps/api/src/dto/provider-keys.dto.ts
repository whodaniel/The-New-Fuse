import { IsString, MaxLength, MinLength } from 'class-validator';

export class SaveProviderKeyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  provider!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(4096)
  apiKey!: string;
}
