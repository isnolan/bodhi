import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthResponse } from './interface/user.interface';
import { AuthUsersService, AuthSessionService } from './service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly user: AuthUsersService,
    private readonly session: AuthSessionService,
  ) {}

  async login(userId: number, clientIp?: string): Promise<AuthResponse> {
    // session
    const session = await this.session.createOne(userId, clientIp);
    // profile & token
    const user = await this.user.findOne(userId);
    const access_token = await this.jwt.signAsync({ user_id: userId, session_id: session.id });
    delete user['id'];
    return { profile: user, abilities: [], access_token };
  }

  async validateUser(email: string, pass: string): Promise<AuthResponse> {
    const user = await this.user.findOneByEmail(email);
    if (user && user.password === pass) {
      return await this.login(user.id);
    }
    throw new UnauthorizedException('account or password is invalid!');
  }

  async validateSession(sessionId: number): Promise<AuthResponse> {
    const session = await this.session.findOne(sessionId);
    if (session.expire_at < new Date() || session.status < 1) {
      throw new UnauthorizedException('session is invalid!');
    }

    // profile & token
    const user = await this.user.findOne(session.user_id);
    const access_token = await this.jwt.signAsync({ user_id: session.user_id, session_id: session.id });
    delete user['id'];
    return { profile: user, abilities: [], access_token };
  }
}
