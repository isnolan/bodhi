import validator from 'validator';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Req, Ip, Post, Body, Get, Query, Request, Delete } from '@nestjs/common';
import { HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ProviderCredentialsService } from './service/credentials.service';
import { ProviderService } from './service';

@ApiTags('provider')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('provider')
export class ProviderController {
  constructor(private readonly provider: ProviderService, private readonly credential: ProviderCredentialsService) {}

  @Get('test')
  @ApiOperation({ summary: 'Get product list', description: 'Get product list' })
  async test() {
    return this.provider.findActive([1000]);
  }

  @Get('product')
  @ApiOperation({ summary: 'Get product list', description: 'Get product list' })
  @ApiResponse({ status: 200, description: 'success' })
  async findProducts(@Request() req) {
    const { user_id } = req.user;
    return this.provider.findByUserId(user_id);
  }

  @Get('credentials')
  @ApiOperation({ summary: 'Get credential list', description: 'Get credential list' })
  @ApiResponse({ status: 200, description: 'success' })
  async findCredentials(@Request() req) {
    const { user_id } = req.user;
    return this.credential.findByUserId(user_id);
  }
}
