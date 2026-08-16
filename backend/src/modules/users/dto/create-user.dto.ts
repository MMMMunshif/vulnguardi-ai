import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Mohamed' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Mujahidh' })
  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'analyst@vulnguard.ai' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123' })
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: '+94 771234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'organization-id-here' })
  @IsNotEmpty()
  @IsString()
  organizationId!: string;

  @ApiProperty({ example: 'department-id-here' })
  @IsNotEmpty()
  @IsString()
  departmentId!: string;

  @ApiProperty({ example: 'Security Analyst' })
  @IsNotEmpty()
  @IsString()
  roleName!: string;
}