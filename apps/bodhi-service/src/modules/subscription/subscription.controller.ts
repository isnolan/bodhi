import { Controller, Get, HttpException, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequestWithUser } from '@/core/common/request.interface';

import { PlanListDto } from './dto/plans.dto';
import { SubscriptionSubscribedService } from './service';
import { SubscriptionService } from './subscription.service';

@ApiTags('subscription')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscribed: SubscriptionSubscribedService,
    private readonly subscription: SubscriptionService,
  ) {}

  @Get('plans')
  @ApiOperation({ description: 'Find plan list', summary: 'Find plan list' })
  @ApiResponse({ status: 200, description: 'success', type: PlanListDto })
  async findPlanList(): Promise<PlanListDto[]> {
    try {
      return await this.subscription.findPlans();
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('trail')
  @ApiOperation({ description: 'Join trial subscription', summary: 'Join trial subscription' })
  @ApiResponse({ status: 201, description: 'success' })
  async joinTrail(@Request() req: RequestWithUser) {
    const { user_id } = req.user;
    try {
      const { id, start_at, expires_at } = await this.subscription.createTrial(user_id);
      return { id, start_at, expires_at };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
