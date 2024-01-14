import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Users } from './entity/users.entity';
import { UsersKeys } from './entity/keys.entity';
import { UsersKeysService } from './keys.service';

@Module({
  imports: [TypeOrmModule.forFeature([Users, UsersKeys])],
  controllers: [UsersController],
  providers: [UsersService, UsersKeysService],
  exports: [UsersService, UsersKeysService],
})
export class UsersModule {}
