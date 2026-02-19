import { Body, Controller, Headers, Post, Req, UnauthorizedException, Logger } from '@nestjs/common';
import { PayPalService } from './paypal.service';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import * as crypto from 'crypto';

@Controller('billing/paypal')
export class PayPalController {
  private readonly logger = new Logger(PayPalController.name);

  constructor(private readonly paypalService: PayPalService) {}

  @Post('webhook')
  async handleWebhook(@Headers() headers: any, @Body() body: any) {
    // Verify webhook signature
    const isValid = await this.verifyPayPalWebhookSignature(headers, body);
    if (!isValid) {
      this.logger.warn('Invalid PayPal webhook signature - rejecting');
      throw new UnauthorizedException('Invalid webhook signature');
    }
    
    await this.paypalService.handleWebhook(headers, body);
    return { received: true };
  }

  @Post('subscribe')
  @UseGuards(AuthGuard('jwt'))
  async recordSubscription(
    @Body() body: { subscriptionID: string; planID: string },
    @Req() req: any
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    await this.paypalService.createSubscriptionRecord(userId, body.subscriptionID, body.planID);
    return { success: true };
  }

  /**
   * Verify PayPal webhook signature
   * https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
   */
  private async verifyPayPalWebhookSignature(headers: any, body: any): Promise<boolean> {
    try {
      const transmissionId = headers['paypal-transmission-id'];
      const transmissionTime = headers['paypal-transmission-time'];
      const certUrl = headers['paypal-cert-url'];
      const authAlgo = headers['paypal-auth-algo'] || 'SHA256';
      const transmissionSig = headers['paypal-transmission-sig'];
      
      // Required headers check
      if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig) {
        this.logger.error('Missing required PayPal webhook headers');
        return false;
      }

      // Fetch the certificate
      const certResponse = await fetch(certUrl);
      if (!certResponse.ok) {
        this.logger.error(`Failed to fetch PayPal certificate from ${certUrl}`);
        return false;
      }
      const cert = await certResponse.text();

      // Construct the expected signature string
      const expectedSig = `${transmissionId}|${transmissionTime}|${process.env.PAYPAL_WEBHOOK_ID}|${JSON.stringify(body)}`;
      
      // Verify signature using the certificate's public key
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(expectedSig);
      
      // Extract public key from certificate and verify
      // For production, you may want to cache certificates
      const publicKey = this.extractPublicKeyFromCert(cert);
      const isValid = verifier.verify(publicKey, transmissionSig, 'base64');
      
      return isValid;
    } catch (error) {
      this.logger.error('Error verifying PayPal webhook signature:', error);
      return false;
    }
  }

  private extractPublicKeyFromCert(cert: string): string {
    // The certificate is in PEM format, we can use it directly for verification
    return cert;
  }
}
