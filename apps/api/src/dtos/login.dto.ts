import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com', description: "User's email address" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', description: "User's password" })
  @IsString()
  @MinLength(8)
  password!: string;
}
