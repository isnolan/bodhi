import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GptsCategory } from './entity/category';
import { Gpts } from './entity/gpts';

@Module({
  imports: [
    // MySQL
    TypeOrmModule.forFeature([Gpts, GptsCategory]),
  ],
})
export class GptsModule {}
