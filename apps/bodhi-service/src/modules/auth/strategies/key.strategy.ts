import { UsersService } from '@/modules/users/users.service';
import { Injectable, UnauthorizedException, HttpException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, 'api-key') {
  constructor(private readonly users: UsersService) {
    super({ header: 'X-API-KEY', prefix: '' }, true, async (apiKey, done) => {
      return this.validate(apiKey, done);
    });
  }

  public async validate(apiKey: string, done: (error: Error, data) => {}) {
    const key = await this.users.validateKey(apiKey);
    if (key) {
      // if (key.quota < 1) {
      //   done(new HttpException('You exceeded your current quota, please check your plan.', 402), null);
      //   return;
      // }
      done(null, { user_id: key.user_id, user_key_id: key.id });
      return;
    }
    done(new UnauthorizedException(), null);
  }
}
