import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GenerateRemediationRecommendationDto {
  @ApiProperty({
    example: 'Google Chrome Remote Code Execution Vulnerability',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example:
      'The installed Chrome version may contain a security vulnerability that can allow remote code execution.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Google Chrome',
  })
  @IsOptional()
  @IsString()
  softwareName?: string;

  @ApiPropertyOptional({
    example: '126.0.6478.127',
  })
  @IsOptional()
  @IsString()
  affectedVersion?: string;

  @ApiPropertyOptional({
    example: '127.0.6533.100',
  })
  @IsOptional()
  @IsString()
  fixedVersion?: string;

  @ApiPropertyOptional({
    example: 'PUBLIC_EXPLOIT_AVAILABLE',
  })
  @IsOptional()
  @IsString()
  exploitAvailability?: string;

  @ApiPropertyOptional({
    example: 'FIX_AVAILABLE',
  })
  @IsOptional()
  @IsString()
  fixAvailability?: string;

  @ApiPropertyOptional({
    example: 'OPEN',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    example: 'CVE-2024-12345',
  })
  @IsOptional()
  @IsString()
  cveId?: string;
}