import { v4 as uuidv4 } from 'uuid';
import { Controller, Res, Post, Req, Body, Get, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

import { CreateCompletionDto } from './dto/create-completions.dto';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { Request, Response } from 'express';
import { JwtOrApiKeyGuard } from '../auth/guard/mixed.guard';
import { RequestWithUser } from '../../core/common/request.interface';
import { ChatConversationService } from './service';
import { SubscriptionService } from '../subscription/service';
import { ProviderService } from '../provider/service';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtOrApiKeyGuard)
@ApiSecurity('api-key', [])
export class ChatController {
  constructor(
    private readonly service: ChatService,
    private readonly provider: ProviderService,
    private readonly conversation: ChatConversationService,
    private readonly subscription: SubscriptionService,
  ) {}

  /**
   * Find subscribed models
   */
  @Get('models')
  @ApiOperation({ description: 'find purchased models', summary: 'find purchased models' })
  @ApiResponse({ status: 201, description: 'success' })
  async models(@Req() req: RequestWithUser) {
    const { user_id } = req.user;

    try {
      const provider_ids = await this.subscription.findActiveProvidersByUser(user_id);
      return this.provider.findModelsByProviderIds(provider_ids);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.FORBIDDEN);
    }
  }

  /**
   * Chat completions
   */
  @Post('completions')
  @ApiBody({ type: CreateCompletionDto })
  @ApiOperation({ description: 'chat completions', summary: 'chat completions' })
  @ApiResponse({ status: 201, description: 'success' })
  @ApiResponse({ status: 400, description: 'exception' })
  async completions(@Req() req: RequestWithUser, @Res() res: Response, @Body() payload: CreateCompletionDto) {
    const { user_id, user_key_id = 0 } = req.user; // from jwt or apikey
    const { conversation_id = uuidv4(), message_id = uuidv4(), parent_id } = payload;
    const { messages = [], tools = [], model, temperature, top_p, top_k, context_limit, n } = payload;
    // console.log(`[chat]completions`, payload);

    try {
      // check valid subscription
      const providers = await this.subscription.findActiveProvidersByUser(user_id);
      const provider_ids = await this.provider.filterProviderByModelId(providers, model);
      if (provider_ids.length === 0) {
        throw new Error(`No valid supplier for model:${model}`);
      }

      // find or create conversation
      const d = { model, temperature, top_p, top_k, user_id, user_key_id, context_limit, n };
      const conversation = await this.conversation.findAndCreateOne(conversation_id, d);
      const channel = `completions:${conversation.id}`;
      const listener = (chl: string, message: string) => {
        if (chl === channel) {
          const d = JSON.parse(message);
          if (d.error) {
            res.status(400).json(d);
            return;
          }

          // process & result
          if (typeof d === 'object') {
            res.write(`data: ${message}\n\n`);
          }
          if (d.useage) {
            res.write(`data: [DONE]\n\n`);
            setTimeout(() => res.end(), 100);
          }
        }
      };
      this.service.subscribe(channel, listener);

      req.on('close', () => {
        this.service.unsubscribe(channel, listener);
      });

      // 发送消息
      const options: SendMessageDto = { provider_ids, messages, message_id, parent_id };
      await this.service.send(channel, conversation, options);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.FORBIDDEN);
    }
  }

  @Post('agent')
  @ApiBody({ type: CreateAgentDto })
  @ApiOperation({ description: 'Chat Agent' })
  @ApiResponse({ status: 201, description: 'success' })
  @ApiResponse({ status: 400, description: 'exception' })
  async agent(@Req() req: Request, @Body() payload: CreateAgentDto) {
    // const { user_id, user_key_id = 0 } = req.user; // from jwt or apikey
    const { conversation_id, parent_id, message } = payload;
    const channel = `agent:${conversation_id}:${+new Date()}`;
    console.log(`[chat]agent`, channel, payload);
    // 获取或创建会话
    const conversation = await this.conversation.findOneByConversationId(conversation_id);
    if (!conversation) {
      throw new HttpException('Invalid conversation', HttpStatus.BAD_REQUEST);
    }

    // `What would be a less than 50 character short and relevant title for this chat? No other text are allowed.`;
    // Please make 3 short inspiring tips on the content of the chat. No other text are allowed.
    return new Promise(async (resolve) => {
      const listener = (chl: string, message: string) => {
        if (chl !== channel) return;
        this.service.unsubscribe(channel, listener);
        resolve(message);
      };
      this.service.subscribe(channel, listener);

      req.on('close', () => {
        this.service.unsubscribe(channel, listener);
      });

      // 发送消息
      await this.service.autoAgent(conversation, channel, { parent_id, message });
    });
  }
}
