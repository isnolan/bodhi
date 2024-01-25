import validator from 'validator';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Req, Ip, Post, Body, Get, Query, Request } from '@nestjs/common';
import { HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ProviderProductService, ProviderService } from './service';
import { ProviderCredentialsService } from './service/credentials.service';

@ApiTags('provider')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('provider')
export class ProviderController {
  constructor(
    private readonly provider: ProviderService,
    private readonly product: ProviderProductService,
    private readonly credential: ProviderCredentialsService,
  ) {}

  @Get('product')
  @ApiOperation({ summary: 'Get product list', description: 'Get product list' })
  @ApiResponse({ status: 200, description: 'success' })
  async findProducts(@Request() req) {
    const { user_id } = req.user;
    return this.product.find(user_id);
  }

  @Post('product/create')
  @ApiOperation({ summary: 'Create a product for model', description: 'Create a product for model' })
  @ApiResponse({ status: 201, description: 'success' })
  async createProduct(@Request() req, @Body() payload) {
    const { user_id } = req.user;
    return;
  }

  @Post('product/delete')
  @ApiOperation({ summary: 'Delete a product for model', description: 'Delete a product for model' })
  @ApiResponse({ status: 201, description: 'success' })
  async deleteProduct(@Request() req, @Body() payload) {
    const { user_id } = req.user;
    return;
  }

  @Get('credentials')
  @ApiOperation({ summary: 'Get product list', description: 'Get product list' })
  @ApiResponse({ status: 200, description: 'success' })
  async findCredentials(@Request() req) {
    const { user_id } = req.user;
    return this.product.find(user_id);
  }

  @Post('credentials/create')
  @ApiOperation({ summary: 'Create a product for model', description: 'Create a product for model' })
  @ApiResponse({ status: 201, description: 'success' })
  async createCredential(@Request() req, @Body() payload) {
    const { user_id } = req.user;
    return;
  }

  @Post('credentials/update')
  @ApiOperation({ summary: 'Create a product for model', description: 'Create a product for model' })
  @ApiResponse({ status: 201, description: 'success' })
  async updateCredential(@Request() req, @Body() payload) {
    const { user_id } = req.user;
    return;
  }

  @Post('credentials/delete')
  @ApiOperation({ summary: 'Delete a product for model', description: 'Delete a product for model' })
  @ApiResponse({ status: 201, description: 'success' })
  async deleteCredential(@Request() req, @Body() payload) {
    const { user_id } = req.user;
    return;
  }
}
