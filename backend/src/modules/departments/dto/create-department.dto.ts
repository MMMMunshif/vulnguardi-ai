import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Infrastructure' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'Infrastructure and network operations team',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'organization-id-here',
  })
  @IsNotEmpty()
  @IsString()
  organizationId!: string;
}