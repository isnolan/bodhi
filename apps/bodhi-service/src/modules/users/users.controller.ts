import validator from 'validator';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Req, Ip, Post, Body, Get, Query, Request } from '@nestjs/common';
import { HttpException, HttpStatus, UseGuards } from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateKeysDto } from './dto/create-keys.dto';
import { UsersKeysService } from './keys.service';
import { GetKeysDto } from './dto/get-keys.dto';
import { DeleteKeysDto } from './dto/delete-keys.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService, private readonly keys: UsersKeysService) {}

  @Get('keys')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get API Keys', description: 'Get API Keys' })
  @ApiResponse({ status: 200, description: 'success', type: [GetKeysDto] })
  async getKeys(@Request() req): Promise<GetKeysDto[]> {
    const { user_id } = req.user;
    return await this.keys.getList(user_id);
  }

  @Post('keys/create')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create API Keys', description: 'Create API Keys' })
  @ApiResponse({ status: 201, description: 'success', type: GetKeysDto })
  @ApiResponse({ status: 401, description: 'session is expired!' })
  async createKeys(@Request() req, @Body() payload: CreateKeysDto): Promise<GetKeysDto> {
    const { user_id } = req.user;
    const { quota, foreign_id, note, expire_at } = payload;
    const { id, secret_key, create_time } = await this.keys.create(user_id, { foreign_id, note, expire_at });
    return { id, secret_key, quota, foreign_id, note, expire_at, create_time };
  }

  @Post('keys/delete')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create API Keys', description: 'Create API Keys' })
  @ApiResponse({ status: 201, description: 'success' })
  @ApiResponse({ status: 401, description: 'session is expired!' })
  async deleteKeys(@Request() req, @Body() payload: DeleteKeysDto) {
    const { user_id } = req.user;
    const { foreign_id } = payload;
    return await this.keys.delete(user_id, foreign_id);
  }

  @Post('keys/update')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create API Keys', description: 'Create API Keys' })
  @ApiResponse({ status: 201, description: 'success' })
  @ApiResponse({ status: 401, description: 'session is expired!' })
  async updateKeys(@Request() req, @Body() payload: CreateKeysDto) {
    const { user_id } = req.user;
    const { foreign_id, quota, note } = payload;
    return await this.keys.update(user_id, foreign_id, { quota, note });
  }
}
