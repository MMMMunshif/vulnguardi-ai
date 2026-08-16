import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({ example: 'DESKTOP-IT-001' })
  @IsNotEmpty()
  @IsString()
  hostname!: string;

  @ApiPropertyOptional({ example: '192.168.1.10' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ example: '00:1A:2B:3C:4D:5E' })
  @IsOptional()
  @IsString()
  macAddress?: string;

  @ApiPropertyOptional({ example: 'Windows' })
  @IsOptional()
  @IsString()
  osName?: string;

  @ApiPropertyOptional({ example: 'Windows 11 Pro' })
  @IsOptional()
  @IsString()
  osVersion?: string;

  @ApiPropertyOptional({ example: 'LAPTOP', enum: DeviceType })
  @IsOptional()
  @IsEnum(DeviceType)
  deviceType?: DeviceType;

  @ApiProperty({ example: 'organization-id-here' })
  @IsNotEmpty()
  @IsString()
  organizationId!: string;

  @ApiPropertyOptional({ example: 'user-id-here' })
  @IsOptional()
  @IsString()
  assignedUserId?: string;
}