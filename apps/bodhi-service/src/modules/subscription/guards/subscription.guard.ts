import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { SubscriptionService } from '../subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subscription: SubscriptionService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.subscription = await this.checkSubscription(request.user.id);
    return true;
  }

  private checkSubscription(userId: number) {
    return this.subscription.findActiveSubscribedWithPlansAndUsage(userId);
  }
}
