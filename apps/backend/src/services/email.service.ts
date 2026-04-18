import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: options.from || process.env.FROM_EMAIL || 'noreply@the-new-fuse.com',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      
      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendNotificationEmail(to: string, type: string, data: any): Promise<void> {
    const subject = `New ${type} notification`;
    const html = `
      <h1>New ${type}</h1>
      <p>You have a new ${type} notification.</p>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `;

    await this.sendEmail({ to, subject, html });
  }
}