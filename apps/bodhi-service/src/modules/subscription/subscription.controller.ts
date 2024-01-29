import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './service';

@ApiTags('subscription')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscription: SubscriptionService) {}

  @Get('test')
  async allocateQuotas() {
    return this.subscription.allocateQuotas();
  }
}
