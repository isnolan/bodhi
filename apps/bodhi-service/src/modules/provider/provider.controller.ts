import { Controller, Get, Request } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ProviderService } from './service';
import { ProviderCredentialsService } from './service/credentials.service';

@ApiTags('provider')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('provider')
export class ProviderController {
  constructor(
    private readonly provider: ProviderService,
    private readonly credential: ProviderCredentialsService,
  ) {}

  // @Get('product')
  // @ApiOperation({ summary: 'Get product list', description: 'Get product list' })
  // @ApiResponse({ status: 200, description: 'success' })
  // async findProducts(@Request() req) {
  //   const { user_id } = req.user;
  //   return this.provider.findByUserId(user_id);
  // }

  // @Get('credentials')
  // @ApiOperation({ summary: 'Get credential list', description: 'Get credential list' })
  // @ApiResponse({ status: 200, description: 'success' })
  // async findCredentials(@Request() req) {
  //   const { user_id } = req.user;
  //   return this.credential.findByUserId(user_id);
  // }
}
