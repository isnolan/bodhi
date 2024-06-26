import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(name, email, token: string) {
    const url = `https://chat.draftai.cn/auth/confirm?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Welcome to Nice App! Confirm your Email',
      template: './confirmation', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        name,
        url,
      },
    });
  }

  async signInVersation(email: string, code) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Your verification code is ${code}`,
      template: './verification', // `.hbs` extension is appended automatically
      context: { code },
    });
  }
}
