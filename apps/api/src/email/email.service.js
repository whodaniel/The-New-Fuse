var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { promises as fs } from 'fs';
const handlebars = {
    compile: (template) => {
        return (context) => {
            // Simple template replacement
            return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                return context[key] || match;
            });
        };
    }
};
let EmailService = class EmailService {
    configService;
    transporter;
    constructor(configService) {
        this.configService = configService;
        // Mock transporter implementation
        this.transporter = {
            sendMail: async (options) => {
                console.log('Mock email sent:', options);
                return { messageId: 'mock-' + Date.now() };
            }
        };
    }
    async sendEmail(to, subject, html, text) {
        try {
            if (!this.transporter) {
                throw new Error('Email transporter not initialized');
            }
            await this.transporter.sendMail({
                from: this.configService.get('SMTP_FROM') || 'noreply@example.com',
                to,
                subject,
                html,
                text
            });
            return true;
        }
        catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }
    async sendWelcomeEmail(to, name) {
        const subject = 'Welcome to The New Fuse!';
        const html = `
      <h1>Welcome ${name}!</h1>
      <p>Thank you for joining The New Fuse platform.</p>
      <p>Get started by exploring our features.</p>
    `;
        const text = `Welcome ${name}! Thank you for joining The New Fuse platform.`;
        return this.sendEmail(to, subject, html, text);
    }
    async sendResetPasswordEmail(to, resetToken) {
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
    async sendTemplateEmail(to, templateName, subject, data) {
        try {
            // Mock template loading
            const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
            let template = '<p>{{content}}</p>'; // Fallback template
            try {
                template = await fs.readFile(templatePath, 'utf-8');
            }
            catch (error) {
                console.warn(`Template ${templateName} not found, using fallback`);
            }
            const compiledTemplate = handlebars.compile(template);
            const html = compiledTemplate(data);
            return this.sendEmail(to, subject, html);
        }
        catch (error) {
            console.error('Failed to send template email:', error);
            return false;
        }
    }
};
EmailService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], EmailService);
export { EmailService };
//# sourceMappingURL=email.service.js.map