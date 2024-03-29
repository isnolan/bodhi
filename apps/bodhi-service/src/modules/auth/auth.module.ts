import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import Strategy from './strategies';
import { AuthSession } from './entity';
import { AuthVerification } from './entity/verification.entity';
import { AuthController } from './auth.controller';
import { NoticeModule } from '../notice/notice.module';
import { AuthService } from './auth.service';
import { AuthSessionService, AuthVerificationsService } from './service';
import { UsersModule } from '../users/users.module';

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
