import { ApiPropertyOptional } from '@nestjs/swagger';
import { SoftwareUpdateStatus, UpdateCheckSource } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateSoftwareUpdateFindingDto {
  @ApiPropertyOptional({ example: '126.0.6478.127' })
  @IsOptional()
  @IsString()
  installedVersion?: string;

  @ApiPropertyOptional({ example: '127.0.6533.100' })
  @IsOptional()
  @IsString()
  latestVersion?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  updateAvailable?: boolean;

  @ApiPropertyOptional({ example: 'OUTDATED', enum: SoftwareUpdateStatus })
  @IsOptional()
  @IsEnum(SoftwareUpdateStatus)
  status?: SoftwareUpdateStatus;

  @ApiPropertyOptional({ example: 'MANUAL', enum: UpdateCheckSource })
  @IsOptional()
  @IsEnum(UpdateCheckSource)
  source?: UpdateCheckSource;

  @ApiPropertyOptional({ example: 'Updated after manual verification' })
  @IsOptional()
  @IsString()
  notes?: string;
}