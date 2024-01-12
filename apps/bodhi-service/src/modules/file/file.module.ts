import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { FileService } from './file.service';
import { FileController } from './file.controller';
import { File } from './entity/file.entity';
import { FileProcessor } from './file.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),

    // Redis Queue
    BullModule.registerQueueAsync({
      name: 'chatbot',
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        redis: config.get('redis'),
        defaultJobOptions: { attempts: 2, removeOnComplete: true, removeOnFail: true },
      }),
    }),
  ],
  controllers: [FileController],
  providers: [FileService, FileProcessor],
  exports: [FileService],
})
export class FileModule {}
