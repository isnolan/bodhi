import validator from 'validator';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Req, Ip, Post, Body, Get, Query, Request, Delete } from '@nestjs/common';
import { HttpException, HttpStatus, UseGuards } from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateKeysDto } from './dto/create-keys.dto';
import { GetKeysDto } from './dto/get-keys.dto';
import { DeleteKeysDto } from './dto/delete-keys.dto';
import { LimitKeysDto } from './dto/limit-keys.dto';
import { UserKeyService } from './service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService, private readonly keys: UserKeyService) {}

  @Get('keys')
  @ApiOperation({ summary: 'Get API Keys', description: 'Get API Keys' })
  @ApiResponse({ status: 200, description: 'success', type: [GetKeysDto] })
  async findKeyList(@Request() req): Promise<GetKeysDto[]> {
    const { user_id } = req.user;
    return this.keys.getList(user_id);
  }

  @Post('keys/create')
  @ApiOperation({ summary: 'Create API Keys', description: 'Create API Keys' })
  @ApiResponse({ status: 201, description: 'success', type: GetKeysDto })
  async createKey(@Request() req, @Body() payload: CreateKeysDto): Promise<GetKeysDto> {
    const { user_id } = req.user;
    const { client_user_id, remark, expires_at } = payload;
    const { id, secret_key, update_at } = await this.keys.createKey(user_id, { client_user_id, remark, expires_at });
    return { id, client_user_id, secret_key, remark, expires_at, update_at };
  }

  @Delete('keys/delete')
  @ApiOperation({ summary: 'Create API Keys', description: 'Create API Keys' })
  @ApiResponse({ status: 201, description: 'success' })
  async deleteKey(@Request() req, @Body() payload: DeleteKeysDto) {
    const { user_id } = req.user;
    const { client_user_id } = payload;
    try {
      const key = await this.keys.findActive(user_id, client_user_id);
      if (!key) {
        throw new Error('key not found');
      }
      return this.keys.delete(key.id);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('usage/allocate')
  @ApiOperation({ summary: 'Allocate usage to client user', description: 'Allocate usage to client user' })
  @ApiResponse({ status: 201, description: 'success' })
  async allocateUsage(@Request() req, @Body() payload: LimitKeysDto) {
    const { user_id } = req.user;
    try {
      return this.users.allocateUsage(user_id, payload);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
