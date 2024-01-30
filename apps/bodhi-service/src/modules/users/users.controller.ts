import validator from 'validator';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Req, Ip, Post, Body, Get, Query, Request, Delete } from '@nestjs/common';
import { HttpException, HttpStatus, UseGuards } from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateKeysDto } from './dto/create-keys.dto';
import { UsersKeysService } from './service/';
import { GetKeysDto } from './dto/get-keys.dto';
import { DeleteKeysDto } from './dto/delete-keys.dto';
import { UsersKeysQuota } from './entity';
import { LimitKeysDto } from './dto/limit-keys.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService, private readonly keys: UsersKeysService) {}

  @Get('keys')
  @ApiOperation({ summary: 'Get API Keys', description: 'Get API Keys' })
  @ApiResponse({ status: 200, description: 'success', type: [GetKeysDto] })
  async getKeys(@Request() req): Promise<GetKeysDto[]> {
    const { user_id } = req.user;
    return this.keys.getList(user_id);
  }

  @Post('keys/create')
  @ApiOperation({ summary: 'Create API Keys', description: 'Create API Keys' })
  @ApiResponse({ status: 201, description: 'success', type: GetKeysDto })
  async createKeys(@Request() req, @Body() payload: CreateKeysDto): Promise<GetKeysDto> {
    const { user_id } = req.user;
    const { foreign_user_id, note, expires_at } = payload;
    const { id, secret_key, create_time } = await this.keys.createKey(user_id, { foreign_user_id, note, expires_at });
    return { id, secret_key, foreign_user_id, note, expires_at, create_time };
  }

  @Post('keys/updateLimit')
  @ApiOperation({ summary: 'Allocate quota to one key', description: 'Allocate quota to one key' })
  @ApiResponse({ status: 201, description: 'success' })
  async updateKeysLimit(@Request() req, @Body() payload: LimitKeysDto) {
    const { user_id } = req.user;
    const { foreign_user_id, ...opts } = payload;
    try {
      await this.keys.updateKeyLimit(user_id, foreign_user_id, opts);
      return;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('keys/delete')
  @ApiOperation({ summary: 'Create API Keys', description: 'Create API Keys' })
  @ApiResponse({ status: 201, description: 'success' })
  async deleteKeys(@Request() req, @Body() payload: DeleteKeysDto) {
    const { user_id } = req.user;
    const { foreign_user_id } = payload;
    try {
      const key = await this.keys.findKey(user_id, foreign_user_id);
      if (!key) {
        throw new HttpException('key not found', HttpStatus.BAD_REQUEST);
      }
      return this.keys.deleteKey(key.id);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
