import { join } from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';

import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      // transport: 'smtps://user@example.com:topsecret@smtp.example.com',
      transport: {
        host: process.env.SMTP_HOST,
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      },
      defaults: {
        from: '"Bodhi" <bodhi@bodhi.ai>',
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
        options: { strict: true },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class NotificationModule {}
