import { v4 as uuidv4 } from 'uuid';
import { Controller, Res, Post, Req, Body, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

import { CreateCompletionDto } from './dto/create-completions.dto';
import { ChatService } from './chat.service';
import { ChatConversationService } from './conversation.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { Request, Response } from 'express';
import { JwtOrApiKeyGuard } from '../auth/guard/mixed.guard';
import { RequestWithUser } from '../../core/common/request.interface';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtOrApiKeyGuard)
@ApiSecurity('api-key', [])
export class ChatController {
  constructor(private readonly service: ChatService, private readonly conversation: ChatConversationService) {}

  /**
   * 创建聊天会话
   * TODO: Get a provider according to policy distribution
   */
  @Post('completions')
  @ApiBody({ type: CreateCompletionDto })
  @ApiOperation({ description: 'chat completions' })
  @ApiResponse({ status: 201, description: 'success' })
  @ApiResponse({ status: 400, description: 'exception' })
  async completions(@Req() req: RequestWithUser, @Res() res: Response, @Body() payload: CreateCompletionDto) {
    // user
    const { user_id, user_key_id = 0 } = req.user; // from jwt or apikey
    // session
    const { conversation_id = uuidv4(), message_id = uuidv4(), parent_id } = payload;
    // model
    const { messages = [], tools = [], model, temperature, top_p, top_k, context_limit, n } = payload;
    console.log(`[chat]completions`, payload);

    // 设置响应头
    // res.setHeader('Content-Type', 'text/event-stream');
    // res.setHeader('Cache-Control', 'no-cache');
    // res.setHeader('Connection', 'keep-alive');

    // 获取或创建会话
    const d = { model, temperature, top_p, top_k, user_id, user_key_id, context_limit, n };
    const conversation = await this.conversation.findAndCreateOne(conversation_id, d);
    const channel = `completions:${conversation.id}`;
    const listener = (chl: string, message: string) => {
      if (chl === channel) {
        const d = JSON.parse(message);
        // process & result
        if (typeof d === 'object') {
          res.write(`data: ${message}\n\n`);
        }
        if (d.useage) {
          res.write(`data: [DONE]\n\n`);
          setTimeout(() => res.end(), 100);
        }
        if (d.error) {
          res.status(400).json(d);
        }
      }
    };
    this.service.subscribe(channel, listener);

    req.on('close', () => {
      this.service.unsubscribe(channel, listener);
    });

    // 发送消息
    const options: SendMessageDto = { messages, message_id, parent_id };
    await this.service.send(conversation, options, channel);
  }

  // @Post('agent')
  // @ApiBody({ type: CreateAgentDto })
  // @ApiOperation({ description: 'Chat Agent' })
  // @ApiResponse({ status: 201, description: 'success' })
  // @ApiResponse({ status: 400, description: 'exception' })
  // async agent(@Req() req: Request, @Body() payload: CreateAgentDto) {
  //   const { conversation_id, parent_id = '', prompt } = payload;
  //   const channel = `agent:${conversation_id}:${+new Date()}`;
  //   console.log(`[chat]agent`, channel, payload);
  //   // 获取或创建会话
  //   const conversation = await this.conversation.findOneByConversationId(conversation_id);
  //   if (!conversation) {
  //     throw new HttpException('Invalid conversation', HttpStatus.BAD_REQUEST);
  //   }

  //   // `What would be a less than 50 character short and relevant title for this chat? No other text are allowed.`;
  //   // Please make 3 short inspiring tips on the content of the chat. No other text are allowed.
  //   return new Promise(async (resolve) => {
  //     const listener = (chl: string, message: string) => {
  //       if (chl !== channel) return;
  //       this.service.unsubscribe(channel, listener);
  //       resolve(message);
  //     };
  //     this.service.subscribe(channel, listener);

  //     req.on('close', () => {
  //       this.service.unsubscribe(channel, listener);
  //     });

  //     // 发送消息
  //     await this.service.autoAgent(conversation, channel, { parent_id, prompt });
  //   });
  // }
}
