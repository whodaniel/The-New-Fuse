var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
import { Injectable } from '@nestjs/common';
import { LoggingService } from './logging.service';
let EmailService = class EmailService {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    async sendEmail(options) {
        try {
            // TODO: Implement actual email sending logic
            // For now, just log the email details
            this.logger.info(`Email would be sent: ${options.subject}, {
        to: options.to,
        from: options.from || 'noreply@example.com'
      });

      return true;
    } catch (error) {`, this.logger.error(`Failed to send email: ${options.subject}`, error));
            return false;
        }
        finally {
        }
    }
    async sendWelcomeEmail(email, name) {
        return this.sendEmail({
            to: email,
            subject: 'Welcome to The New Fuse!',
            html: Welcome, $
        }, { name } || 'User');
    }
};
EmailService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof LoggingService !== "undefined" && LoggingService) === "function" ? _a : Object])
], EmailService);
export { EmailService };
!/h1><p>Thank you for joining The New Fuse platform.</p > ,
;
;
async;
sendPasswordResetEmail(email, string, resetToken, string);
Promise < boolean > {} `
    const resetUrl = ${process.env.FRONTEND_URL || 'http://localhost:3000'}` / reset - password ? token = $ : ;
{
    resetToken;
}
;
return this.sendEmail({} `
      to: email,`, subject, 'Password Reset Request', html, Password, Reset < /h1><p>Click <a href="${resetUrl}">here</a > to, reset, your, password. < /p>`,);
//# sourceMappingURL=email.service.js.map