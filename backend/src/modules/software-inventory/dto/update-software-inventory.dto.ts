import { ApiPropertyOptional } from '@nestjs/swagger';
import { SoftwareSource, SoftwareStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateSoftwareInventoryDto {
  @ApiPropertyOptional({ example: 'Google Chrome Updated' })
  @IsOptional()
  @IsString()
  softwareName?: string;

  @ApiPropertyOptional({ example: 'Google LLC' })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({ example: '127.0.6533.100' })
  @IsOptional()
  @IsString()
  installedVersion?: string;

  @ApiPropertyOptional({ example: 'C:\\Program Files\\Google\\Chrome' })
  @IsOptional()
  @IsString()
  installedPath?: string;

  @ApiPropertyOptional({ example: '2026-08-16T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  installDate?: string;

  @ApiPropertyOptional({ example: '2026-08-16T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  lastUsedAt?: string;

  @ApiPropertyOptional({ example: 'MANUAL', enum: SoftwareSource })
  @IsOptional()
  @IsEnum(SoftwareSource)
  source?: SoftwareSource;

  @ApiPropertyOptional({ example: 'INSTALLED', enum: SoftwareStatus })
  @IsOptional()
  @IsEnum(SoftwareStatus)
  status?: SoftwareStatus;
}