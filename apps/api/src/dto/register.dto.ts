import { IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'User display name' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'p@ssw0rd!',
    description: 'Initial password (min length 6)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
