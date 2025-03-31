import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import Entity from './entity';
import { ProviderController } from './provider.controller';
import Service, { ProviderCredentialsService, ProviderService } from './service';

@Module({
  imports: [TypeOrmModule.forFeature([...Entity])],
  controllers: [ProviderController],
  providers: [...Service],
  exports: [ProviderService, ProviderCredentialsService],
})
export class ProviderModule {}
