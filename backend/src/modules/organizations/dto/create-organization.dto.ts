import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'CyberShield Technologies' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'contact@cybershield.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+94 771234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'https://cybershield.com', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ example: 'Cyber Security', required: false })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({ example: 'Sri Lanka', required: false })
  @IsOptional()
  @IsString()
  country?: string;
}