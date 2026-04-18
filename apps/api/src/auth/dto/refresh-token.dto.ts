import { IsString } from 'class-validator.js';

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}