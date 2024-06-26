import { Body, Controller, Get, Ip, Post, Query, Req, Request } from '@nestjs/common';
import { HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import validator from 'validator';

import { ErrorDto } from '../../core/common/base.dto';
import { RequestWithUser } from '../../core/common/request.interface';
import { MailService } from '../notice/mail.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { captchaDto, loginDto } from './dto/auth.dto';
import { VerificationState, VerificationType } from './entity';
import { AuthResponse } from './interface/user.interface';
import { AuthVerificationsService } from './service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly user: UsersService,
    private readonly mail: MailService,
    private readonly verification: AuthVerificationsService,
  ) {}

  @Get('captcha')
  @ApiOperation({ summary: '申请发送验证码', description: '申请发送验证码' })
  @ApiResponse({ status: 200, description: 'success' })
  @ApiResponse({ status: 400, description: 'exception', type: ErrorDto })
  async sendCaptcha(@Req() req: Request, @Ip() ip: string, @Query() payload: captchaDto) {
    const { account, locale } = payload;
    const forward = req.headers['x-original-forwarded-for'] || req.headers['x-forwarded-for'];
    const clientIp = forward?.split(',')[0] || ip;
    console.log(`[captcha]payload:`, account);

    // 检查locale
    if (!validator.isLocale(locale)) {
      throw new HttpException('Invalid locale!', HttpStatus.BAD_REQUEST);
    }

    // validate email
    if (validator.isEmail(account)) {
      const { code } = await this.verification.createOne(VerificationType.EMAIL, account, clientIp);
      await this.mail.signInVersation(account, code);
      console.warn(`[captcha]email`, account, code);
      return;
    }

    throw new HttpException('Unsupport auth type!', HttpStatus.BAD_REQUEST);
  }

  @Post('signIn')
  @ApiOperation({ summary: '通过验证码登录', description: '通过验证码登录' })
  @ApiResponse({ status: 201, description: 'success', type: AuthResponse })
  @ApiResponse({ status: 400, description: 'exception', type: ErrorDto })
  async SignIn(@Req() req: Request, @Ip() ip: string, @Body() dto: loginDto): Promise<AuthResponse> {
    const forward = req.headers['x-original-forwarded-for'] || req.headers['x-forwarded-for'];
    const clientIp = forward?.split(',')[0] || ip;
    const { account, code, locale } = dto;
    // checking locale
    if (!validator.isLocale(locale)) {
      throw new HttpException('Invalid locale!', HttpStatus.BAD_REQUEST);
    }

    // checking verify code
    const verify = await this.verification.isValid(account, code);
    console.log(`[login]`, verify);

    if (!verify || verify.state != VerificationState.PENDING) {
      throw new HttpException('Invalid verify code!', HttpStatus.BAD_REQUEST);
    }

    // consume verify code
    await this.verification.consume(verify.id);

    // Email
    if (validator.isEmail(account)) {
      let user = await this.user.findUserByEmail(account);
      if (!user) {
        user = await this.user.createUserWithEmail(account, { locale });
      }
      return this.auth.login(user.id, clientIp, locale);
    }

    throw new HttpException('Unsupport auth type!', HttpStatus.BAD_REQUEST);
  }

  @Get('status')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '获取用户会话状态', description: '获取会话状态' })
  @ApiResponse({ status: 200, description: 'success', type: AuthResponse })
  @ApiResponse({ status: 401, description: 'session is expired!' })
  async getSessionStatus(@Request() req: RequestWithUser): Promise<AuthResponse> {
    const { user_id, session_id } = req.user;
    console.log(`[auth]status`, user_id, session_id);

    return await this.auth.validateSession(session_id);
  }
}
