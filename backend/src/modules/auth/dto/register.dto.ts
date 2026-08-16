import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
  } from 'class-validator';
  
  export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    firstName: string;
  
    @IsNotEmpty()
    @IsString()
    lastName: string;
  
    @IsEmail()
    email: string;
  
    @IsNotEmpty()
    @MinLength(8)
    password: string;
  }