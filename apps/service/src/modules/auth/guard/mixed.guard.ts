import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOrApiKeyGuard extends AuthGuard(['jwt', 'api-key']) {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    // console.log(`[auth]strategy`, request.headers['x-api-key'], request.headers['authorization']);

    if (request.headers['x-api-key']) {
      (this as any).strategy = 'api-key';
    } else {
      (this as any).strategy = 'jwt';
    }
    return (await super.canActivate(context)) as boolean;
  }

  // handleRequest(err, user, info, context) {
  //   if (err || !user) {
  //     throw err || new UnauthorizedException();
  //   }
  //   return user;
  // }
}
