import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gpts } from './entity/gpts';
import { GptsCategory } from './entity/category';

@Module({
  imports: [
    // MySQL
    TypeOrmModule.forFeature([Gpts, GptsCategory]),
  ],
})
export class GptsModule {}
