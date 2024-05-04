import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NoticeModule } from '../notice/notice.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSession } from './entity';
import { AuthVerification } from './entity/verification.entity';
import { AuthSessionService, AuthVerificationsService } from './service';
import Strategy from './strategies';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthSession, AuthVerification]),

    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('jwt') as JwtModuleOptions,
    }),

    UsersModule,
    NoticeModule,
  ],

  controllers: [AuthController],
  providers: [AuthService, AuthSessionService, AuthVerificationsService, ...Strategy],
})
export class AuthModule {}
