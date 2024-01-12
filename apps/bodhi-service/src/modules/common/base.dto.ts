import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';

export class resultRes {
  @ApiProperty()
  message: string;

  @ApiProperty()
  status_code: number;
}

export class ErrorDto {
  @ApiProperty({ example: '400' })
  status: number;

  @ApiProperty({ example: 'Invalid verify code!' })
  message: string;

  @ApiProperty({ example: '2023-10-08T08:10:46.045Z' })
  timestamp: string;

  @ApiProperty({ example: '/v1/auth/login' })
  path: string;
}

export class PaginationQueryDto {
  @ApiProperty()
  @IsOptional()
  @IsInt()
  limit: number;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  page: number;
}

export interface PaginatedResultDto<T> {
  items: T[];

  total: number;
}
