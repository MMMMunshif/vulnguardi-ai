import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SoftwareUpdateStatus, UpdateCheckSource } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSoftwareUpdateFindingDto {
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

  @ApiPropertyOptional({ example: 'New version available from vendor website' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'software-inventory-id-here' })
  @IsNotEmpty()
  @IsString()
  softwareInventoryId!: string;
}