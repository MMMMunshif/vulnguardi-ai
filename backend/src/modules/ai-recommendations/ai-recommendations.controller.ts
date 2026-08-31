import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiRecommendationsService } from './ai-recommendations.service';
import { GenerateRemediationRecommendationDto } from './dto/generate-remediation-recommendation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-recommendations')
export class AiRecommendationsController {
  constructor(
    private readonly aiRecommendationsService: AiRecommendationsService,
  ) {}

  @Post('remediation')
  @ApiOperation({
    summary: 'Generate smart remediation recommendation',
  })
  generateRemediationRecommendation(
    @Body() dto: GenerateRemediationRecommendationDto,
    @Req() request: Request & { user: { organizationId: string } },
  ) {
    return this.aiRecommendationsService.generateRemediationRecommendation(dto, request.user.organizationId);
  }
}
