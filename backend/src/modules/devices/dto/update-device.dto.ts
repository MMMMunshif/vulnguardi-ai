import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceStatus, DeviceType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateDeviceDto {
  @ApiPropertyOptional({ example: 'DESKTOP-IT-001-UPDATED' })
  @IsOptional()
  @IsString()
  hostname?: string;

  @ApiPropertyOptional({ example: '192.168.1.20' })
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

  @ApiPropertyOptional({ example: 'ACTIVE', enum: DeviceStatus })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiPropertyOptional({ example: 'organization-id-here' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ example: 'user-id-here' })
  @IsOptional()
  @IsString()
  assignedUserId?: string;
}