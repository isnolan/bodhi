import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import Entity from './entity';
import Service from './service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([...Entity])],
  controllers: [UsersController],
  providers: [UsersService, ...Service],
  exports: [UsersService],
})
export class UsersModule {}
