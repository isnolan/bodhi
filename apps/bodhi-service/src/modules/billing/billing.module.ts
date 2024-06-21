import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import Entity from './entity';
import Services from './service';

@Module({
  imports: [TypeOrmModule.forFeature([...Entity])],
  controllers: [BillingController],
  providers: [BillingService, ...Services],
  exports: [],
})
export class BillingModule {}
