import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersKeysService } from './service';
import Entity from './entity';

@Module({
  imports: [TypeOrmModule.forFeature([...Entity])],
  controllers: [UsersController],
  providers: [UsersService, UsersKeysService],
  exports: [UsersService, UsersKeysService],
})
export class UsersModule {}
