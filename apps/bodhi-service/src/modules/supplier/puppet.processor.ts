import Redis from 'ioredis';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable, OnModuleInit } from '@nestjs/common';

import { SupplierService } from './supplier.service';
import { ChatConversationService } from '../chat/conversation.service';
import { ChatMessageService } from '../chat/message.service';
import { ChatService } from '../chat/chat.service';
import { QueueMessageDto } from '../chat/dto/queue-message.dto';
import { FilesService } from '../files/files.service';
import { ChatConversation } from '../chat/entity/conversation.entity';
import { Supplier } from './entity/supplier.entity';
import { FileDto } from '../files/dto/upload.dto';
import { FilePuppetDto } from '../files/dto/queue-file.dto';

const importDynamic = new Function('modulePath', 'return import(modulePath)');

@Injectable()
export class SupplierPuppetProcessor implements OnModuleInit {
  private readonly subscriber;
  private readonly apis: any;
  private readonly files: { [key: string]: { [key: string]: FileDto } } = {};

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('chatbot')
    private readonly queue: Queue,
    @InjectRedis()
    private readonly redis: Redis,
    private readonly file: FilesService,
    private readonly supplier: SupplierService,
    private readonly service: ChatService,
    private readonly message: ChatMessageService,
    private readonly conversation: ChatConversationService,
  ) {
    // redis
    const option = this.configService.get('redis');
    this.subscriber = new Redis(option);

    this.apis = {};

    const serverId = Number(process.env.CHATBOT_EPID) || 0;
    this.initPuppet(serverId);
  }

  async onModuleInit(): Promise<void> {
    // 订阅 Redis
    this.subscriber.subscribe('puppet', (error, count) => {
      if (error) {
        throw new Error(`Failed to subscribe: ${error.message}`);
      }
      console.log(`[redis]subscribed to puppet channel.`, count);
    });

    this.subscriber.subscribe('attachment', (error, count) => {
      if (error) {
        throw new Error(`Failed to subscribe: ${error.message}`);
      }
      console.log(`[redis]subscribed to attachment channel.`, count);
    });

    this.subscriber.on('message', (channel, json) => {
      const message = JSON.parse(json);
      console.log(`[redis]subscriber`, channel, message);
      if (channel === 'puppet' && this.apis[message.supplier_id]) {
        this.sendMessage(message);
        return;
      }

      if (channel === 'attachment' && message.model) {
        this.uploadFile(message);
      }
    });
  }

  /**
   * 初始化 initPuppet 节点
   */
  async initPuppet(serverId: number) {
    // 获取该节点所有 Puppet 实例
    const services = await this.supplier.findSuppliersByNode(serverId);
    console.log(`[subscribe]puppet:`, serverId, services.length);
    if (services.length == 0) {
      return;
    }
    // 初始化Puppet
    const { Puppet, ChatGPTPuppet, ChatClaudePuppet } = await importDynamic('@yhostc/chatbot-puppet');
    const puppet = new Puppet({ proxyAgent: process.env.PROXY_AGENT });
    await puppet.start();
    // 初始化Page
    for (const supplier of services) {
      // 解析账号授权信息
      const { username, password, cookies } = JSON.parse(supplier.authorisation);
      // 创建ChatGPT实例
      let page;
      const opts = { pageId: `chat${supplier.id}`, username, password, cookies };
      switch (supplier.provider) {
        case 'chatgpt':
          page = new ChatGPTPuppet(puppet, opts);
          break;
        case 'claude':
          page = new ChatClaudePuppet(puppet, opts);
          break;
        default:
          continue;
      }
      this.apis[supplier.id] = page;

      // 准备就绪:允许流量接入
      page.on('active', async ({ pageId, cookies }: any) => {
        console.log(`[puppet]active`, pageId);
        // 保存cookies
        const newAuth = JSON.stringify({ username, password, cookies });
        await this.supplier.updateAuthoriazations(supplier.id, newAuth);
      });

      // 会话失效: 不允许流量接入
      page.on('inactive', async ({ pageId }: any) => {
        console.log(`[puppet]inactive`, pageId);
        await this.supplier.updateState(supplier.id, 0);
      });

      // 会话异常: 可继续提供服务
      page.on('error', async ({ pageId, message }: any) => {
        console.log(`[puppet]error:`, pageId, message);
      });

      try {
        await page.initSession();
        console.log(`[puppet]initialization:complete`, supplier.id);
      } catch (err) {
        console.log(`[puppet]error:`, err);
        await this.supplier.updateState(supplier.id, -1);
      }
    }
  }

  /**
   * 服务降级
   * @param data {SendMessageDto}
   */
  private async downgrade(data: QueueMessageDto) {
    // 获取当前会话
    const { conversation_id } = data;
    const conversation = (await this.conversation.findOne(conversation_id)) as ChatConversation;
    // 获取降级节点
    try {
      const supplier = await this.supplier.getInactive(conversation.model, conversation_id, true); // configuration.model
      await this.conversation.updateSupplier(conversation_id, supplier.id);
      // 消息队列
      Object.assign(data, { supplier_id: supplier.id, model: supplier.model });
      const job = await this.queue.add('openapi', data, { priority: 1, delay: 10 });
      console.log(`[puppet]downgrade`, supplier.provider, supplier.id, job.id);
    } catch (err) {
      console.warn(`[puppet]downgrade`, err);
    }
  }

  /**
   * 发送消息
   * @param data
   */
  async sendMessage(data: QueueMessageDto) {
    const { channel, supplier_id, conversation_id, parent_id, content, attachments = [] } = data;
    const conversation = (await this.conversation.findOne(conversation_id)) as ChatConversation;
    const message = await this.message.getLastMessage(conversation_id);
    const supplier = (await this.supplier.get(supplier_id)) as Supplier;

    // 发送消息
    const opts: any = {};
    if (conversation?.parent_conversation_id) {
      opts['conversation_id'] = conversation.parent_conversation_id;
    }

    // transform local file to supplier file
    if (attachments.length > 0) {
      const files = await this.file.findFilesByIds(attachments);
      opts['attachments'] = files.map((r) => ({ id: r.file_id, name: r.name, size: r.size, mimetype: r.mimetype }));
    }
    if (message?.message_id) {
      opts['parent_id'] = message.message_id;
    }
    // if (configuration?.system) {
    //   content += `\n------\n# System Instructions:\n${configuration.system}\n------`;
    // }
    console.log(`[puppet]opts`, opts);
    try {
      this.files[conversation_id] = {};
      // console.log(`[chatgpt]`, supplierId, 2, typeof this.apis[supplierId]);
      const res = await this.apis[supplier_id].sendMessage(content, {
        model: supplier.model,
        ...opts,
        id: uuidv4(),
        timeoutMs: 120000,
        onProgress: ({ choices }: any) => {
          console.log(`[puppet]progress`, supplier_id, supplier.model, new Date().toLocaleTimeString('zh-CN'));
          console.log(`->1`, JSON.stringify(choices));
          // try {
          // multiple choice
          const c = choices.map((row: any) => {
            const { attachments = [] } = row.message;
            if (attachments && attachments.length > 0 && this.files[conversation_id]) {
              attachments.map((file: any) => this.transformFile(conversation_id, file));
            }
            row.message.attachments = Object.values(this.files[conversation_id]);
            console.log(`->choice:`, row.message.content);
            return row;
          });
          this.service.reply(channel, c);
          //   console.log(`->2`);
          // } catch (err) {
          //   console.warn(`->0`, err);
          // }
        },
      });
      console.log(`[puppet]result`, res);
      // 封存消息
      res.choices = res.choices.map((row: any) => {
        const { content, attachments = [] } = row.message;
        const payload = { conversation_id, role: 'assistant', content, message_id: res.id, parent_id };
        // 异步同步文件
        if (attachments && attachments.length > 0) {
          const atts = Object.values(this.files[conversation_id]);
          Object.assign(payload, { attachments: atts.map((r) => r.id) });
          row.message.attachments = atts;
        }
        this.queue.add('archives', { ...payload, parent_conversation_id: res.conversation_id });
        return row;
      });

      console.log(`[puppet]result`, JSON.stringify(res, null, 2));

      // delete this.files[conversation_id];
      this.service.reply(channel, { ...res, conversation_id: conversation.conversation_id });
    } catch (err) {
      // 尝试捕获消息发送异常，进行降级
      console.warn(`[puppet]catch`, err);
      this.service.reply(channel, { choices: [{ message: { content: err.message } }] });
      // 服务降级
      await this.downgrade(data);
      // expire the cache key
      // await this.supplier.RenewalProvider(supplier_id, conversation_id, 30);
      // return;
    }

    // expire the cache key
    await this.supplier.RenewalProvider(supplier_id, conversation_id, 60);
  }

  /**
   * Transform supplier file to local file object
   */
  async transformFile(conversation_id: number, remote: any) {
    if (!this.files[conversation_id] || this.files[conversation_id][remote.id]) {
      return;
    }
    this.files[conversation_id][remote.id] = { id: remote.id, name: remote.name, url: remote.url };
    this.file
      .uploadByURL(remote.id, remote.name, remote.url)
      .then(({ id, name, url }) => {
        this.files[conversation_id][remote.id] = { id, name, url };
        console.log(`[puppet]transform`, { id, name, url });
      })
      .catch((err) => {
        console.warn(`[puppet]transform`, err);
      });
  }

  /**
   * Upload Attachment to supplier
   */
  async uploadFile(data: FilePuppetDto) {
    console.log(`[puppet]upload`, data);
    const { model, id: file_id, url } = data;
    const supplier = (await this.supplier.getSupplierBySlug(model)) as Supplier;
    console.log(`[puppet]upload`, supplier.id, file_id, url);
    if (supplier && supplier.instance === 'puppet') {
      const file = await this.file.get(file_id);

      if (['chatgpt'].includes(supplier.provider)) {
        const { name, size, mimetype }: any = file;
        if (this.apis[supplier.id]) {
          const uploaded = await this.apis[supplier.id].uploadFile({ id: file_id, name, size, mimetype }, url);
          this.file.update(file_id, { file_id: uploaded.file_id });
          console.log(`[puppet]upload:chatgpt`, supplier.id, file_id, uploaded);
        }
        console.log(`[puppet]upload:chatgpt`, `no supplier`, supplier.id, file_id);
      }

      if (['claude'].includes(supplier.provider)) {
        console.log(`[puppet]upload:claude`, supplier.id, file_id);
      }
    }
  }

  /**
   * Upload Attachment to supplier
   * only for claude
   */
  // async uploadFileByClaude(data: UploadAttachmentDto) {
  //   const { model, file_id, file_url } = data;
  //   // 判断文件类型，是否进行解码
  //   const decodes = ['.pdf', '.pdf', '.doc', '.docx', '.rtf', '.epub', '.odt', '.odp', '.pptx'];
  //   if (decodes.includes(extname(file_url))) {
  //     const attachment = await this.apis[supplier_id].uploadFile(file_url);
  //     // 加入缓存
  //     await this.redis.set(`attachment:${file_id}`, JSON.stringify(attachment), 'EX', 300);
  //     console.log(`[attachment]decode`, attachment);
  //   } else {
  //     await fetch(file_url)
  //       .then(async (res) => {
  //         const extracted_content = await res.text();
  //         const attachment = {
  //           extracted_content,
  //           file_name: `029323${extname(file_url)}`,
  //           file_size: extracted_content.length,
  //           file_type: res.headers.get('Content-Type'),
  //         };
  //         // 加入缓存
  //         await this.redis.set(`attachment:${file_id}`, JSON.stringify(attachment), 'EX', 300);
  //         console.log(`[attachment]file`, attachment);
  //       })
  //       .catch((e) => {
  //         console.warn(e);
  //       });
  //   }
  // }
}
