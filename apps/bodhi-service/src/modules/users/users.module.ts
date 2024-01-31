import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import Service from './service';
import Entity from './entity';

@Module({
  imports: [TypeOrmModule.forFeature([...Entity])],
  controllers: [UsersController],
  providers: [UsersService, ...Service],
  exports: [UsersService],
})
export class UsersModule {}
