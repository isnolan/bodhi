import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from '../service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subscription: SubscriptionService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.subscription = await this.checkSubscription(request.user.id);
    return true;
  }

  private checkSubscription(userId: number) {
    return this.subscription.findActivePlansByUserId(userId);
  }
}
