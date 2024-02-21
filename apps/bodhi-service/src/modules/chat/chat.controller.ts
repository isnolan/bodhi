import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Controller, Res, Post, Req, Body, Get, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

import { JwtOrApiKeyGuard } from '../auth/guard/mixed.guard';
import { ChatConversationService } from './service';
import { ProviderService } from '../provider/service';
import { UsersService } from '../users/users.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CreateCompletionsDto, CreateConversationDto, CreateAgentDto } from './dto/create-completions.dto';
import { RequestWithUser } from '@/core/common/request.interface';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtOrApiKeyGuard)
@ApiSecurity('api-key', [])
export class ChatController {
  constructor(
    private readonly users: UsersService,
    private readonly service: ChatService,
    private readonly provider: ProviderService,
    private readonly conversations: ChatConversationService,
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
      const usages = await this.subscription.findActiveUsageWithQuota(user_id);
      const providers = usages.flatMap((usage) => usage.quota.providers);
      return this.provider.findModelsByProviders(providers);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.FORBIDDEN);
    }
  }

  /**
   * Chat conversation
   */
  @Post('conversation')
  @ApiOperation({ description: 'chat conversation', summary: 'chat conversation' })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({ status: 200, description: 'success' })
  @ApiResponse({ status: 400, description: 'exception' })
  async conversation(@Req() req: RequestWithUser, @Res() res: Response, @Body() payload: CreateConversationDto) {
    const { user_id, client_user_id = '' } = req.user; // from jwt or apikey
    const { model, message, conversation_id = uuidv4(), message_id = uuidv4() } = payload;
    const { stream = true, parent_id, temperature, top_p, top_k, context_limit, n } = payload;
    try {
      // validate subscription
      const abilities = this.checkAbilities([message]);
      const subscription = await this.validateSubscription(user_id, model, client_user_id, abilities);
      const { usages, provider_ids, user_usage_id } = subscription;
      // console.log(`->`, provider_ids);
      // find or create conversation
      const d = { model, temperature, top_p, top_k, user_id, user_usage_id, context_limit, n };
      const conversation = await this.conversations.findAndCreateOne(conversation_id, d);
      const channel = `conversation:${conversation.id}`;
      const listener = this.createListener(channel, res, stream);
      this.service.subscribe(channel, listener);
      req.on('close', () => this.service.unsubscribe(channel, listener));

      // 发送消息
      const options: SendMessageDto = { usages, provider_ids, messages: [], message_id, parent_id };
      Object.assign(options, { messages: [message] });
      await this.service.completion(channel, conversation, options);
    } catch (err) {
      res.status(400).json({ error: { message: err.message, code: 400 } });
    }
  }

  // Generate a less than 50 character short and relevant title for this chat. No other text are allowed. Follow the language user use before.
  // Make 3 short and high relevant  tips base on  the latest chat to  keep conversation going .  No other text are allowed. Follow the language user use before..
  @Post('agent')
  @ApiOperation({ description: 'Chat conversation agent', summary: 'Chat conversation agent' })
  @ApiBody({ type: CreateAgentDto })
  @ApiResponse({ status: 200, description: 'success' })
  @ApiResponse({ status: 400, description: 'exception' })
  async agent(@Req() req: RequestWithUser, @Res() res: Response, @Body() payload: CreateAgentDto) {
    const { user_id, client_user_id = '' } = req.user; // from jwt or apikey
    const { model = 'gemini-pro', conversation_id, prompt = '' } = payload;

    try {
      // validate subscription
      const subscription = await this.validateSubscription(user_id, model, client_user_id, []);
      const { usages, provider_ids, user_usage_id } = subscription;

      const d = { model, user_id, user_usage_id };
      const conversation = await this.conversations.findAndCreateOne(conversation_id, d);
      if (!conversation) {
        throw new Error('Invalid conversation');
      }

      const channel = `agent:${conversation_id}:${+new Date()}`;
      const listener = this.createListener(channel, res, false);
      this.service.subscribe(channel, listener);
      req.on('close', () => this.service.unsubscribe(channel, listener));

      const messages = [{ role: 'user', parts: [{ type: 'text', text: prompt }] }];
      const options: SendMessageDto = { usages, provider_ids, messages: [], message_id: uuidv4() }; //
      Object.assign(options, { messages, status: 0 });
      await this.service.completion(channel, conversation, options);
    } catch (err) {
      res.status(400).json({ error: { message: err.message, code: 400 } });
    }
  }

  @Post('completions')
  @ApiOperation({ description: 'Chat completions', summary: 'Chat completions' })
  @ApiBody({ type: CreateCompletionsDto })
  @ApiResponse({ status: 200, description: 'success' })
  @ApiResponse({ status: 400, description: 'exception' })
  async completions(@Req() req: RequestWithUser, @Res() res: Response, @Body() payload: CreateCompletionsDto) {
    const { user_id, client_user_id = '' } = req.user; // from jwt or apikey
    const { model = 'gemini-pro', messages = [], stream = true } = payload;
    const { temperature = 0.8, top_p = 1, top_k = 1, n = 1 } = payload;

    try {
      // validate subscription
      const abilities = this.checkAbilities(messages);
      const subscription = await this.validateSubscription(user_id, model, client_user_id, abilities);
      const { usages, provider_ids, user_usage_id } = subscription;

      // Get or create conversation
      const conversation_id = uuidv4();
      const context_limit = messages.length;
      const d = { model, temperature, top_p, top_k, context_limit, n, user_id, user_usage_id };
      const conversation = await this.conversations.findAndCreateOne(conversation_id, d);
      if (!conversation) {
        throw new Error('Invalid conversation');
      }

      const channel = `completions:${conversation_id}:${+new Date()}`;
      const listener = this.createListener(channel, res, stream);
      this.service.subscribe(channel, listener);
      req.on('close', () => this.service.unsubscribe(channel, listener));

      const options: SendMessageDto = { usages, provider_ids, messages, message_id: uuidv4() };
      await this.service.completion(channel, conversation, options);
    } catch (err) {
      res.status(400).json({ error: { message: err.message, code: 400 } });
    }
  }

  private checkAbilities(messages) {
    const abilities = new Set();
    messages.forEach((message) => {
      message.parts.forEach((part) => {
        part.type === 'image' && abilities.add('vision');
        part.type === 'tools' && abilities.add('tools');
        part.type === 'docs' && abilities.add('docs');
      });
    });
    // 转换为数组后返回
    return Array.from(abilities) as string[];
  }

  private async validateSubscription(user_id: number, model: string, client_user_id: string, abilities?: string[]) {
    // validate subscription
    const usages = await this.subscription.findActiveUsageWithQuota(user_id, true);
    if (usages.length === 0) {
      throw new Error(`No active subscription or available quota.`);
    }

    // validate provider
    const ids = [...new Set(usages.flatMap((usage) => usage.quota.providers))];
    const provider_ids = await this.provider.filterProviderByModel(ids as [], model, abilities);
    if (provider_ids.length === 0) {
      throw new Error(`No valid supplier for model:${model}`);
    }

    // check keys limit
    let user_usage_id = 0;
    if (client_user_id) {
      const kui = await this.users.checkAvailableQuota(client_user_id, model);
      if (kui > 0) {
        user_usage_id = kui;
      } else {
        throw new Error(`Not enough quota for the key.`);
      }
    }

    return { usages, provider_ids, user_usage_id };
  }

  private createListener(channel: string, res, stream: boolean = true) {
    const listener = (chl: string, message: string) => {
      if (chl === channel && !res.writableEnded) {
        const d = JSON.parse(message);
        if (d.error) {
          if (!res.headersSent) {
            res.status(400).json(d);
          }
          this.service.unsubscribe(channel, listener);
          return;
        }

        // process & result
        if (typeof d === 'object') {
          if (stream) {
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'text/event-stream');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');
            }
            res.write(`data: ${message}\n\n`);
            // TODO:
            // 这将提升响应速度的同时会造成服务器buffer聚集而提升服务器压力
            // 如果服务器压力过大，可以考虑2秒钟flush一次，但是这样会造成消息延迟
            res.flush();
          }

          if (d.usage) {
            if (stream) {
              res.write(`data: [DONE]\n\n`);
              res.end();
            } else {
              res.status(200).json(d);
            }

            this.service.unsubscribe(channel, listener);
            return;
          }
        }
      }
    };
    return listener;
  }
}
