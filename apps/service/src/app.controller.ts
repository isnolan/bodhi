import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  welcome(): string {
    console.log('Welcome to Bodhi AI!');
    return 'Welcome to Bodhi AI!';
  }

  @Get('health')
  getHealth(): string {
    return this.appService.getHealth();
  }
}
