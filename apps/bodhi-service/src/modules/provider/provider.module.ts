import { Module } from '@nestjs/common';
import { ProviderController } from './provider.controller';
import Service, { ProviderCredentialsService, ProviderService } from './service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Entity from './entity';

@Module({
  imports: [TypeOrmModule.forFeature([...Entity])],
  controllers: [ProviderController],
  providers: [...Service],
  exports: [ProviderService, ProviderCredentialsService],
})
export class ProviderModule {}
