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
    return this.provider.find(user_id);
  }

  @Post('product/create')
  @ApiOperation({ summary: 'Create a product for model', description: 'Create a product for model' })
  @ApiResponse({ status: 201, description: 'success' })
  async createProduct(@Request() req, @Body() payload) {
    const { user_id } = req.user;
    return;
  }

  @Delete('product/delete')
  @ApiOperation({ summary: 'Delete a product for model', description: 'Delete a product for model' })
  @ApiResponse({ status: 201, description: 'success' })
  async deleteProduct(@Request() req, @Body() payload) {
    const { user_id } = req.user;
    return;
  }

  @Get('credentials')
  @ApiOperation({ summary: 'Get credential list', description: 'Get credential list' })
  @ApiResponse({ status: 200, description: 'success' })
  async findCredentials(@Request() req) {
    const { user_id } = req.user;
    return this.provider.find(user_id);
  }

  @Post('credentials/create')
  @ApiOperation({ summary: 'Create a credential', description: 'Create a credential' })
  @ApiResponse({ status: 201, description: 'success' })
  async createCredential(@Request() req, @Body() payload) {
    const { user_id } = req.user;
    return;
  }

  @Post('credentials/update')
  @ApiOperation({ summary: 'Update a credential', description: 'Update a credential' })
  @ApiResponse({ status: 201, description: 'success' })
  async updateCredential(@Request() req, @Body() payload) {
    const { user_id } = req.user;
    return;
  }

  @Delete('credentials/delete')
  @ApiOperation({ summary: 'Delete a credential', description: 'Delete a credential' })
  @ApiResponse({ status: 201, description: 'success' })
  async deleteCredential(@Request() req, @Body() payload) {
    const { user_id } = req.user;
    return;
  }
}
