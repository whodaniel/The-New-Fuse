import { IsString, IsEmail } from 'class-validator.js';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
