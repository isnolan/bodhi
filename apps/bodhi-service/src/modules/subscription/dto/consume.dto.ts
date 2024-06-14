import { ApiPropertyOptional } from '@nestjs/swagger';

export class SubscriptionConsumed {
  @ApiPropertyOptional()
  times?: number;

  @ApiPropertyOptional()
  tokens?: number;
}
