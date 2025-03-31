import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { File } from './entity/file.entity';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import Process from './process';
import Service from './service';

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),

    // Redis Queue
    BullModule.registerQueueAsync({
      name: 'bodhi',
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        redis: config.get('redis'),
        defaultJobOptions: { attempts: 2, removeOnComplete: true, removeOnFail: true },
      }),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, ...Service, ...Process],
  exports: [FilesService],
})
export class FilesModule {}
