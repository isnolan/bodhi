import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import Service from './service';
import Entity from './entity';

@Module({
  imports: [TypeOrmModule.forFeature([...Entity])],
  providers: [UsersService, ...Service],
  exports: [UsersService],
})
export class UsersModule {}
