import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  RemediationActionType,
  RemediationStatus,
  RemediationVerificationStatus,
} from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateRemediationActionDto {
  @ApiPropertyOptional({ example: 'Update Google Chrome to fixed version' })
  @IsOptional()
  @IsString()
  actionTitle?: string;

  @ApiPropertyOptional({
    example: 'Updated remediation action description.',
  })
  @IsOptional()
  @IsString()
  actionDescription?: string;

  @ApiPropertyOptional({
    example: 'Install latest Chrome version and verify patch status.',
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
    example: 'IN_PROGRESS',
    enum: RemediationStatus,
  })
  @IsOptional()
  @IsEnum(RemediationStatus)
  status?: RemediationStatus;

  @ApiPropertyOptional({
    example: 'VERIFIED',
    enum: RemediationVerificationStatus,
  })
  @IsOptional()
  @IsEnum(RemediationVerificationStatus)
  verificationStatus?: RemediationVerificationStatus;

  @ApiPropertyOptional({ example: '2026-08-25T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: '2026-08-20T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional({ example: '2026-08-21T15:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional({ example: 'Patch verified successfully.' })
  @IsOptional()
  @IsString()
  verificationNotes?: string;

  @ApiPropertyOptional({ example: 'Remediation work updated.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'assigned-user-id-here' })
  @IsOptional()
  @IsString()
  assignedUserId?: string;
}