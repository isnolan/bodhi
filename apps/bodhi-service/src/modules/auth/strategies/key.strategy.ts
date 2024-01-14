import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthKeysService } from '../service';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, 'api-key') {
  constructor(private readonly keys: AuthKeysService) {
    super({ header: 'X-API-KEY', prefix: '' }, true, async (apiKey, done) => {
      return this.validate(apiKey, done);
    });
  }

  public async validate(apiKey: string, done: (error: Error, data) => {}) {
    const key = await this.keys.validateKey(apiKey);
    if (key) {
      done(null, { user_id: key.user_id, foreign_id: key.foreign_id });
    }
    done(new UnauthorizedException(), null);
  }
}
