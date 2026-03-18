import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const toBoolean = (value: unknown, defaultValue: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  if (typeof value === 'number') return value !== 0;
  return defaultValue;
};

export class TerminalGraphQueryDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit = 200;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value, false))
  @IsBoolean()
  includeCommands = false;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value, true))
  @IsBoolean()
  includeProcessNodes = true;
}

