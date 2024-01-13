import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import Strategy from './strategies';
import { AuthSession } from './entity/session.entity';
import { AuthVerification } from './entity/verification.entity';
import { AuthController } from './auth.controller';
import { NotificationModule } from '../notification/notification.module';
import { AuthUsers } from './entity/users.entity';
import { AuthUsersService, AuthSessionService, AuthVerificationsService } from './service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthUsers, AuthSession, AuthVerification]),

    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => config.get('jwt') as JwtModuleOptions,
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    NotificationModule,
  ],

  controllers: [AuthController],
  providers: [AuthService, AuthUsersService, AuthSessionService, AuthVerificationsService, ...Strategy],
})
export class AuthModule {}
