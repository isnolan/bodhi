import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';
import { RedisIoAdapter } from './core/adapters/redis-io.adapter';

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
  const nestWinston = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(nestWinston);
  app.useGlobalPipes(new ValidationPipe());
  app.use(compression());

  if (process.env.NODE_ENV !== 'production') {
    // swagger
    const options = new DocumentBuilder()
      .setTitle('Bodhi API')
      .setVersion('1.0')
      // .addServer('http://127.0.0.1:3200', 'Local')
      .addServer('https://api.zhangguiyi.cn/rest/bodhi', 'Dev')
      .addServer('https://api.zhangguiyi.com/rest/bodhi', 'Stage')
      .addServer('https://api.chatonce.cn/rest/bodhi', 'Prod')
      .addBearerAuth()
      .addApiKey(
        { type: 'apiKey', name: 'x-api-key', in: 'header' },
        'api-key', // This name will be used to refer to the scheme
      )
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api', app, document, swaggerCustomOptions);
  }

  // listen
  // await app.startAllMicroservices();
  app.enableCors(); // 启用 CORS
  await app.listen(process.env.NODE_PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
