import { ApiProperty } from '@nestjs/swagger';

class SubscriptionQuotas {
  @ApiProperty()
  type: string;

  @ApiProperty()
  quotas: number;

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
