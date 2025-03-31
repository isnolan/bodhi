import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  // constructor(private configService: ConfigService) {}

  getHealth(): string {
    // console.log(`-> NACOS_HOST:`, this.configService.get<string>('server'));
    return 'success';
  }
}
