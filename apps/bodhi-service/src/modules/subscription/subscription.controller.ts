import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { SubscriptionService, SubscriptionSubscribedService } from './service';
import { Subscription } from 'rxjs';

@ApiTags('subscription')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscribed: SubscriptionSubscribedService,
    private readonly subscription: SubscriptionService,
  ) {}

  @Get('test')
  async allocateQuotas() {
    return this.subscription.findActivePlansByUserId(1);
  }
}
