import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// @ts-ignore
import * as paypal from '@paypal/checkout-server-sdk';
import axios from 'axios';

@Injectable()
export class PayPalService {
  private environment: any;
  private client: any;
  private readonly logger = new Logger(PayPalService.name);

  // Token caching
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    if (clientId && clientSecret) {
      this.environment = isProduction
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret);
      this.client = new paypal.core.PayPalHttpClient(this.environment);
    } else {
      this.logger.warn('PayPal credentials not found. PayPal service will not function correctly.');
    }
  }

  async createOrder(price: number, currency = 'USD') {
    if (!this.client) throw new Error('PayPal client not initialized');

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: price.toString(),
          },
        },
      ],
    });

    try {
      const order = await this.client.execute(request);
      return order.result;
    } catch (err) {
      this.logger.error('PayPal Create Order Error:', err);
      throw err;
    }
  }

  async captureOrder(orderId: string) {
    if (!this.client) throw new Error('PayPal client not initialized');

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
      const capture = await this.client.execute(request);
      return capture.result;
    } catch (err) {
      this.logger.error('PayPal Capture Order Error:', err);
      throw err;
    }
  }

  // --- Subscription Methods (REST API) ---

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const baseUrl = isProduction ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    try {
      const response = await axios.post(
        `${baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const data = response.data;
      this.cachedToken = data.access_token;
      // Buffer by 60s
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60000;
      return this.cachedToken!;
    } catch (error) {
      this.logger.error('Failed to retrieve PayPal access token', error);
      throw new Error('PayPal Auth Failed');
    }
  }

  async createSubscription(planId: string, customId: string = '') {
    const accessToken = await this.getAccessToken();
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const baseUrl = isProduction ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const apiUrl = this.configService.get<string>('API_URL') || 'http://localhost:3000';

    try {
      const response = await axios.post(
        `${baseUrl}/v1/billing/subscriptions`,
        {
          plan_id: planId,
          custom_id: customId,
          application_context: {
            brand_name: 'The New Fuse Marketplace',
            locale: 'en-US',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
            return_url: `${apiUrl}/api/marketplace/subscriptions/success`,
            cancel_url: `${apiUrl}/api/marketplace/subscriptions/cancel`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Prefer: 'return=representation',
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('PayPal Create Subscription Error:', error);
      throw error;
    }
  }
}
