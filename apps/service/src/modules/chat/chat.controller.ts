/* eslint max-params: */
import { chat } from '@isnolan/bodhi-adapter';
import { Body, Controller, Get, HttpException, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { RequestWithUser } from '@/core/common/request.interface';

import { JwtOrApiKeyGuard } from '../auth/guard/mixed.guard';
import { FilesService } from '../files/files.service';
import { ProviderService } from '../provider/service';
import { UsersService } from '../users/users.service';
import { ChatService } from './chat.service';
import { CreateCompletionsDto, CreateConversationDto } from './dto/create-completions.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatConversationService } from './service';

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
    private readonly file: FilesService,
  ) {}

  @Get('models')
  @ApiOperation({ description: 'find models', summary: 'find models' })
  @ApiResponse({ status: 201, description: 'success' })
  async models() {
    return this.provider.findList();
  }

  /**
   * Chat conversation
   */
  @Post('conversation')
  @ApiOperation({ description: 'chat conversation', summary: 'chat conversation' })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({ status: 200, description: 'success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 402, description: 'No available quotas.' })
  @ApiResponse({ status: 403, description: 'No valid supplier for model.' })
  @ApiResponse({ status: 429, description: 'Not enough quota.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async conversation(@Req() req: RequestWithUser, @Res() res: Response, @Body() payload: CreateConversationDto) {
    const { user_id, key_id = 0 } = req.user; // from jwt or apikey
    const { model, messages, conversation_id = uuidv4(), message_id = uuidv4() } = payload;
    const { stream = true, parent_id, temperature, top_p, top_k, context_limit, n } = payload;

    try {
      // validate subscription
      const abilities = this.checkAbilities(messages);
      const providers = await this.validateSubscription(user_id, model, key_id, abilities);
      // console.log(`->`, providers);
      // find or create conversation
      const d = { model, temperature, top_p, top_k, user_id, key_id, context_limit, n };
      const conversation = await this.conversations.findAndCreateOne(conversation_id, d);
      const channel = `conversation:${conversation.id}`;
      const listener = this.createListener(channel, res, stream);
      this.service.subscribe(channel, listener);
      req.on('close', () => this.service.unsubscribe(channel, listener));

      // 检查是否存在File docs
      // replace file id to file object with last message
      const file_ids = messages[0].parts
        .filter((p) => p.type === 'file' && p.mimetype === 'application/pdf')
        .map((p: chat.FilePart) => p.id);
      if (file_ids.length > 0) {
        const files = await this.file.findExtractByFileIds(file_ids);
        if (files) {
          messages[0].parts = messages[0].parts.map((part) => {
            if (part.type === 'file') {
              const file = files.find((f) => f.id === part.id);
              return {
                ...part,
                extract: `Attachment: ${file.name} \n\nSize: ${file.size} \n\nContent: ${file.extract}`,
              };
            } else {
              return part;
            }
          });
        }
      }

      // 发送消息
      const options: SendMessageDto = { providers, messages: [], message_id, parent_id };
      Object.assign(options, { messages });
      await this.service.completion(channel, conversation, options);
    } catch (err) {
      if (err instanceof HttpException) {
        const code = err.getStatus();
        res.status(code).json({ error: { message: err.getResponse(), code } });
      } else {
        res.status(500).json({ error: { message: err.message, code: 500 } });
      }
      // res.status(400).json({ error: { message: err.message, code: 400 } });
    }
  }

  @Post('completions')
  @ApiOperation({ description: 'Chat completions', summary: 'Chat completions' })
  @ApiBody({ type: CreateCompletionsDto })
  @ApiResponse({ status: 200, description: 'success' })
  @ApiResponse({ status: 400, description: 'exception' })
  async completions(@Req() req: RequestWithUser, @Res() res: Response, @Body() payload: CreateCompletionsDto) {
    const { user_id, key_id = 0 } = req.user; // from jwt or apikey
    const { model = 'gemini-pro', messages = [], stream = true } = payload;
    const { temperature = 0.8, top_p = 1, top_k = 1, n = 1 } = payload;

    try {
      // validate subscription
      const abilities = this.checkAbilities(messages);
      const providers = await this.validateSubscription(user_id, model, key_id, abilities);

      // Get or create conversation
      const conversation_id = uuidv4();
      const context_limit = messages.length;
      const d = { model, temperature, top_p, top_k, context_limit, n, user_id, key_id };
      const conversation = await this.conversations.findAndCreateOne(conversation_id, d);
      if (!conversation) {
        throw new Error('Invalid conversation');
      }

      const channel = `completions:${conversation_id}:${+new Date()}`;
      const listener = this.createListener(channel, res, stream);
      this.service.subscribe(channel, listener);
      req.on('close', () => this.service.unsubscribe(channel, listener));

      const options: SendMessageDto = { providers, messages, message_id: uuidv4() };
      await this.service.completion(channel, conversation, options);
    } catch (err) {
      if (err instanceof HttpException) {
        const code = err.getStatus();
        res.status(code).json({ error: { message: err.getResponse(), code } });
      } else {
        res.status(500).json({ error: { message: err.message, code: 500 } });
      }
      // res.status(400).json({ error: { message: err.message, code: 400 } });
    }
  }

  private checkAbilities(messages) {
    const abilities = new Set();
    messages.forEach((message) => {
      message.parts
        .filter((p) => p.type === 'file')
        .forEach((part) => {
          if (part.type === 'file') {
            // text
            if (part.mimetype.startsWith('application') || part.mimetype.startsWith('text')) {
              abilities.add('text');
            }
            part.mimetype.startsWith('image') && abilities.add('vision');
            part.mimetype.startsWith('audio') && abilities.add('audio');
            part.mimetype.startsWith('video') && abilities.add('video');
          }
          // tools
          if (part.type === 'tools') {
            abilities.add('tools');
          }
        });
    });
    // 转换为数组后返回
    return Array.from(abilities) as string[];
  }

  private async validateSubscription(user_id: number, model: string, key_id: number, abilities?: string[]) {
    // provider: validate model & abilities
    const providers = await this.provider.filterProviderByModel(model, abilities);
    if (providers.length === 0) {
      throw new HttpException(`No valid supplier for model:${model}`, 403);
    }

    // 余额不足
    const wallet = await this.users.checkAvailableBalance(user_id);
    if (!wallet || wallet.balance <= 0) {
      throw new HttpException(`Insufficient funds`, 402);
    }

    // validate key balance, if key_id is provided
    if (key_id > 0) {
      const key = await this.users.checkAvailableQuota(user_id, key_id);
      if (!key || key.credits < key.consumed) {
        throw new HttpException(`Not enough credits balance.`, 402);
      }
    }

    return providers.map((provider) => provider.id);
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
