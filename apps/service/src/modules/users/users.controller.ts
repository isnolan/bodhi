import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateKeyDto, KeyListDto, UpdateKeyCreditsDto } from './dto/create-keys.dto';
import { ProjectDto } from './dto/find-project.dto';
import { UserKeyService, UserProjectService } from './service';
import { UsersService } from './users.service';

@ApiTags('user')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('user')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly keys: UserKeyService,
    private readonly project: UserProjectService,
  ) {}

  @Get('project')
  @ApiOperation({ summary: 'find project list', description: 'find project list' })
  @ApiResponse({ status: 200, description: 'success', type: [ProjectDto] })
  async findProjectList(@Request() req): Promise<ProjectDto[]> {
    const { user_id } = req.user;
    return this.project.findList(user_id);
  }

  @Post('keys/create')
  @ApiOperation({ summary: 'Create API Keys', description: 'Create API Keys' })
  @ApiResponse({ status: 201, description: 'success', type: KeyListDto })
  async createKey(@Request() req, @Body() payload: CreateKeyDto): Promise<KeyListDto> {
    const { user_id } = req.user;
    const { project_id, credits, name, expires_at } = payload;
    const { id, sk, update_at } = await this.users.createKey(user_id, { project_id, name, credits, expires_at });
    return { id, sk, name, credits, expires_at, update_at };
  }

  @Post('keys/credits')
  @ApiOperation({ summary: 'Update Key Credits', description: 'Update Key Credits' })
  @ApiResponse({ status: 201, description: 'success' })
  async updateKeyCredits(@Request() req, @Body() payload: UpdateKeyCreditsDto) {
    const { user_id } = req.user;
    try {
      const { sk, credits } = payload;
      this.users.updateKeyCredits(user_id, sk, credits);
      return;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
