import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import Strategy from './strategies';
import { AuthKeys, AuthSession, AuthUsers } from './entity';
import { AuthVerification } from './entity/verification.entity';
import { AuthController } from './auth.controller';
import { NotificationModule } from '../notification/notification.module';
import { AuthService } from './auth.service';
import { AuthUsersService, AuthSessionService, AuthVerificationsService, AuthKeysService } from './service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthUsers, AuthSession, AuthVerification, AuthKeys]),

    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('jwt') as JwtModuleOptions,
    }),
    NotificationModule,
  ],

  controllers: [AuthController],
  providers: [
    AuthService,
    AuthUsersService,
    AuthKeysService,
    AuthSessionService,
    AuthVerificationsService,
    ...Strategy,
  ],
})
export class AuthModule {}
