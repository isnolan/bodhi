import { Body, Controller, Delete, Get, Post, Request } from '@nestjs/common';
import { HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateKeysDto } from './dto/create-keys.dto';
import { DeleteKeysDto } from './dto/delete-keys.dto';
import { GetKeysDto } from './dto/get-keys.dto';
import { LimitKeysDto } from './dto/limit-keys.dto';
import { UserKeyService } from './service';
import { UsersService } from './users.service';

@ApiTags('user')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('user')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly keys: UserKeyService,
  ) {}

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
    const { credits, name, remark, expires_at } = payload;
    const { id, secret_key, update_at } = await this.keys.createKey(user_id, { name, remark, credits, expires_at });
    return { id, secret_key, name, remark, credits, expires_at, update_at };
  }

  @Delete('keys/delete')
  @ApiOperation({ summary: 'Create API Keys', description: 'Create API Keys' })
  @ApiResponse({ status: 201, description: 'success' })
  async deleteKey(@Request() req, @Body() payload: DeleteKeysDto) {
    const { user_id } = req.user;
    const { id } = payload;
    try {
      const key = await this.keys.findActive(user_id, id);
      if (!key) {
        throw new Error('key not found');
      }
      return this.keys.delete(key.id);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('keys/balance')
  @ApiOperation({ summary: 'update balance to the key', description: 'update balance to the key' })
  @ApiResponse({ status: 201, description: 'success' })
  async updateKeyBalance(@Request() req, @Body() payload: LimitKeysDto) {
    const { user_id } = req.user;
    try {
      const { id, balance } = payload;
      return this.users.resetKeyBalance(user_id, id, balance);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
