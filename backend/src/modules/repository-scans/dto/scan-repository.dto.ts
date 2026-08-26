import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class ScanRepositoryDto {
  @ApiProperty({ example: 'https://github.com/owner/repository' })
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  repositoryUrl!: string;

  @ApiPropertyOptional({ example: 'main' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  branch?: string;
}
