import { ApiProperty } from '@nestjs/swagger';

class SubscriptionQuotas {
  @ApiProperty()
  times_limit: number;

  @ApiProperty()
  tokens_limit: number;

  // @ApiProperty()
  // bots: BotsSimpleDto[];
}

export class PlanSimapleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;
}

export class PlanListDto extends PlanSimapleDto {
  @ApiProperty()
  product_id: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  annual_price: number;

  @ApiProperty({ type: [SubscriptionQuotas] })
  quotas: SubscriptionQuotas[];
}
