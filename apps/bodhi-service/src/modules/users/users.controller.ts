import validator from 'validator';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Req, Ip, Post, Body, Get, Query, Request } from '@nestjs/common';
import { HttpException, HttpStatus, UseGuards } from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateAuthKeysDto } from './dto/create-keys.dto';
import { UsersKeysService } from './keys.service';
import { GetKeysDto } from './dto/get-keys.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService, private readonly keys: UsersKeysService) {}

  @Post('keys/create')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create API Keys', description: 'Create API Keys' })
  @ApiResponse({ status: 201, description: 'success', type: GetKeysDto })
  @ApiResponse({ status: 401, description: 'session is expired!' })
  async createKeys(@Request() req, @Body() payload: CreateAuthKeysDto): Promise<GetKeysDto> {
    const { user_id } = req.user;
    const { foreign_id, note, expire_at } = payload;
    const { id, secret_key, create_time } = await this.keys.create(user_id, { foreign_id, note, expire_at });
    return { id, secret_key, foreign_id, note, expire_at, create_time };
  }

  @Get('keys')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get API Keys', description: 'Get API Keys' })
  @ApiResponse({ status: 200, description: 'success', type: [GetKeysDto] })
  async getKeys(@Request() req): Promise<GetKeysDto[]> {
    const { user_id } = req.user;
    return await this.keys.getKeysList(user_id);
  }
}
