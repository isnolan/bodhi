import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tools } from './entity/tools';
import { ToolsService } from './tools.service';

@Module({
  imports: [
    // MySQL
    TypeOrmModule.forFeature([Tools]),
  ],
  providers: [ToolsService],
})
export class ToolsModule {}
