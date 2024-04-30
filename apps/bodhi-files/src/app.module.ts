import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule, RedisModuleOptions } from '@liaoliaots/nestjs-redis';

import Modules from './modules';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import configuration from './config/configuration';

@Module({
  imports: [
    // Instance Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env`, `.env.development`, `.env.production`],
      load: [configuration],
    }),

    // TypeORM
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('database') as any,
    }),

    // Redis
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<RedisModuleOptions> => {
        return {
          config: config.get('redis'),
        };
      },
    }),

    // Logs
    WinstonModule.forRoot({
      transports: [
        new winston.transports.DailyRotateFile({
          dirname: 'logs',
          filename: 'access-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '7d',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
      ],
    }),

    ...Modules,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
