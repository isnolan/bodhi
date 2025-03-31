import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthSessionService } from '../service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly session: AuthSessionService,
    private readonly config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt').secret,
    });
    // console.log(`[jwt]`, process.env.JWT_SECRET);
  }

  async validate({ user_id, session_id, iat }: any) {
    // console.log(`[auth]jwt`, user_id, session_id, iat);
    // 验证session是否有效
    const session = await this.session.validateSession(session_id);
    // console.log(`[auth]jwt`, session);
    if (session) {
      return { user_id, session_id, iat };
    }
    throw new UnauthorizedException();
  }
}

export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest so it never throws an error
  handleRequest(err, user) {
    return user;
  }
}
