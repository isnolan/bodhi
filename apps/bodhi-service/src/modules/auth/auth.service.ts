import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { AuthResponse } from './interface/user.interface';
import { AuthSessionService } from './service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly user: UsersService,
    private readonly session: AuthSessionService,
  ) {}

  async login(userId: number, clientIp?: string, locale?: string): Promise<AuthResponse> {
    // session
    const session = await this.session.createOne(userId, clientIp, locale);
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
    if (session.expires_at < new Date() || session.status < 1) {
      throw new UnauthorizedException('session is invalid!');
    }

    // profile & token
    const user = await this.user.findOne(session.user_id);
    delete user['id'];
    return { profile: user, abilities: [] };
  }
}
