import { NestFactory } from '@nestjs/core';
// import { ValidationPipe } from '@nestjs/common';
// import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';

const swaggerCustomOptions: SwaggerCustomOptions = { swaggerOptions: { persistAuthorization: true } };
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('v1');
  app.enableCors();
  app.disable('x-powered-by', 'X-Powered-By');

  // redis
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // logger
  // const nestWinston = app.get(WINSTON_MODULE_NEST_PROVIDER);
  // app.useLogger(nestWinston);
  // app.useGlobalPipes(new ValidationPipe());

  // swagger
  const options = new DocumentBuilder()
    .setTitle('ChatBot API')
    .setVersion('1.0')
    .addServer('https://api.zhangguiyi.com/rest/chatbot', 'Stage')
    .addServer('https://api.zhangguiyi.cn/rest/chatbot', 'Dev')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document, swaggerCustomOptions);

  // listen
  // await app.startAllMicroservices();
  app.enableCors(); // 启用 CORS
  await app.listen(process.env.NODE_PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();