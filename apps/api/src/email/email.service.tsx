import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { TemplateDelegate } from 'handlebars';
import { fileURLToPath } from 'url';
import * as path from 'path';
import fs from 'fs/promises';

@Injectable()
export class EmailService {
  private transporter?: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: Number(this.configService.get<string>('SMTP_PORT')) === 465,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      } as nodemailer.AuthOptions,
    });
  }

  async send2FACode(to: string, code: string): Promise<void> {
    const template = await this.loadTemplate('2fa-code');

    const html = template({
      code,
      expiryMinutes: 10,
      year: new Date().getFullYear(),
      appName: this.configService.get<string>('APP_NAME'),
    });

    await this.transporter.sendMail({
      from: `"${this.configService.get<string>('EMAIL_FROM_NAME')}" <${this.configService.get<string>('EMAIL_FROM_ADDRESS')}>`,
      to,
      subject: `${this.configService.get<string>('APP_NAME')} - Your 2FA Code`,
      html,
    });
  }

  private async loadTemplate(name: string): Promise<TemplateDelegate<any>> {
    const __filename = fileURLToPath(import.meta.url);
    const dirname = path.dirname(__filename);
    const templatePath = path.join(
      dirname,
      '../templates',
      `${name}.hbs`,
    );
    const template = await fs.promises.readFile(templatePath, 'utf-8');
    return handlebars.compile<TemplateDelegate<any>>(template);
  }
}
