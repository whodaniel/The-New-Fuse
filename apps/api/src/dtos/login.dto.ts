import { IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com', description: 'User\'s email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User\'s password' })
  @IsString()
  @MinLength(8)
  password: string;
}
