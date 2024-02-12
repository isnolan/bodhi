import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Request, Get, UseGuards, Req, Post, HttpException, HttpStatus } from '@nestjs/common';
import { SubscriptionSubscribedService } from './service';
import { SubscriptionGuard } from './guards/subscription.guard';
import { RequestWithUser } from '@/core/common/request.interface';
import { SubscriptionService } from './subscription.service';
import { PlanListDto } from './dto/plans.dto';

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
  @ApiOperation({ description: 'Find plans', summary: 'Find plans' })
  @ApiResponse({ status: 200, description: 'success', type: PlanListDto })
  async getPlanList(): Promise<PlanListDto[]> {
    try {
      // 获得产品及配额列表
      const plans = await this.subscription.findPlans();
      // 获取 providers
      // const providers = plans.flatMap((item) => item.quotas.map((quota) => quota.providers));
      // const bots = await this.bots.findByIds([...new Set(providers.flat().map(Number))]);

      // 注入 bots
      const rows: PlanListDto[] = plans.map((product) => ({
        ...product,
        // quotas: product.quotas.map((item) => {
        //   return { ...item, bots: bots.filter((b) => item.providers.includes(b.id)) };
        // }),
      }));

      return rows;
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
