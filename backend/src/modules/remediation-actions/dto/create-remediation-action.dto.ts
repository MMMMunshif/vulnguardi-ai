import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RemediationActionType,
  RemediationStatus,
  RemediationVerificationStatus,
} from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRemediationActionDto {
  @ApiProperty({ example: 'Update Google Chrome to fixed version' })
  @IsNotEmpty()
  @IsString()
  actionTitle!: string;

  @ApiPropertyOptional({
    example: 'Update Chrome from affected version to the latest secure version.',
  })
  @IsOptional()
  @IsString()
  actionDescription?: string;

  @ApiPropertyOptional({
    example: 'Install Google Chrome version 127.0.6533.100 or later.',
  })
  @IsOptional()
  @IsString()
  recommendedFix?: string;

  @ApiPropertyOptional({
    example: 'UPDATE_SOFTWARE',
    enum: RemediationActionType,
  })
  @IsOptional()
  @IsEnum(RemediationActionType)
  actionType?: RemediationActionType;

  @ApiPropertyOptional({
    example: 'PENDING',
    enum: RemediationStatus,
  })
  @IsOptional()
  @IsEnum(RemediationStatus)
  status?: RemediationStatus;

  @ApiPropertyOptional({
    example: 'NOT_VERIFIED',
    enum: RemediationVerificationStatus,
  })
  @IsOptional()
  @IsEnum(RemediationVerificationStatus)
  verificationStatus?: RemediationVerificationStatus;

  @ApiPropertyOptional({ example: '2026-08-25T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Initial remediation task created.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'vulnerability-finding-id-here' })
  @IsNotEmpty()
  @IsString()
  vulnerabilityFindingId!: string;

  @ApiPropertyOptional({ example: 'assigned-user-id-here' })
  @IsOptional()
  @IsString()
  assignedUserId?: string;
}