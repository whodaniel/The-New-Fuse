import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string = '';

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string = '';
}

export class RegisterDto {
  @ApiProperty()
  @IsString()
  username: string = '';

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
