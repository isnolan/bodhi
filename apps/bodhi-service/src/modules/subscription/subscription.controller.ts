import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SubscriptionService, SubscriptionSubscribedService } from './service';
import { SubscriptionGuard } from './guards/subscription.guard';
import { RequestWithUser } from '@/core/common/request.interface';

@ApiTags('subscription')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscribed: SubscriptionSubscribedService,
    private readonly subscription: SubscriptionService,
  ) {}

  // @Get('test')
  // @UseGuards(SubscriptionGuard)
  // async test(@Req() req: RequestWithUser) {
  //   const usages = await this.subscription.findActiveUsageWithQuota(1, true);
  //   return usages;
  // }
}
