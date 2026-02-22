import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string = '';

  @ApiProperty()
  @IsString()
  password: string = '';
}

export class RegisterDto {
  @ApiProperty({
    required: false,
    description: 'Required when invite-only registration is enabled',
  })
  @IsString()
  @IsOptional()
  inviteCode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty()
  @IsEmail()
  email: string = '';

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string = '';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lastName?: string;
}

export class TokenDto {
  @ApiProperty()
  @IsString()
  accessToken: string = '';

  @ApiProperty()
  @IsString()
  refreshToken: string = '';
}
