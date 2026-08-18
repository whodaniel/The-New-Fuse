import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';

// Mock nodemailer types and functionality
interface MailOptions {
  from?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface Transporter {
  sendMail(options: MailOptions): Promise<any>;
}

// Mock handlebars
interface TemplateDelegate {
  (context: any): string;
}

const handlebars = {
  compile: (template: string): TemplateDelegate => {
    return (context: any) => {
      // Simple template replacement
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] || match;
      });
    };
  },
};

@Injectable()
export class EmailService {
  private transporter?: Transporter;

  constructor(private configService: ConfigService) {
    // SMTP transport is intentionally unset in this deployment until real provider wiring is configured.
    this.transporter = undefined;
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.error('Email transporter is not configured; email send skipped.');
        return false;
      }

      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM') || 'noreply@example.com',
        to,
        subject,
        html,
        text,
      });

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Welcome to The New Fuse!';
    const html = `
      <h1>Welcome ${name}!</h1>
      <p>Thank you for joining The New Fuse platform.</p>
      <p>Get started by exploring our features.</p>
    `;
    const text = `Welcome ${name}! Thank you for joining The New Fuse platform.`;

    return this.sendEmail(to, subject, html, text);
  }

  async sendResetPasswordEmail(to: string, resetToken: string): Promise<boolean> {
    const subject = 'Reset Your Password';
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const html = `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
    `;
    const text = `Reset your password by visiting: ${resetUrl}`;

    return this.sendEmail(to, subject, html, text);
  }

  async sendTemplateEmail(
    to: string,
    templateName: string,
    subject: string,
    data: Record<string, any>
  ): Promise<boolean> {
    try {
      // Mock template loading
      const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
      let template = '<p>{{content}}</p>'; // Fallback template

      try {
        template = await fs.readFile(templatePath, 'utf-8');
      } catch (error) {
        console.warn(`Template ${templateName} not found, using fallback`);
      }

      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate(data);

      return this.sendEmail(to, subject, html);
    } catch (error) {
      console.error('Failed to send template email:', error);
      return false;
    }
  }
}
