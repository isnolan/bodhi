import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { File } from './entity/file.entity';
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
  providers: [FilesService, ...Service],
  exports: [FilesService],
})
export class FilesModule {}
