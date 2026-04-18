import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DepositResponse, Receipt } from './shared-state.types.js';

const SAFE_RUNTIME_PATTERN = /^[a-zA-Z0-9_-]+$/;

@Injectable()
export class SharedStateService {
  private readonly logger = new Logger(SharedStateService.name);
  private readonly apiBase: string;
  private readonly authToken: string;

  constructor(private readonly configService: ConfigService) {
    this.apiBase = this.configService.get<string>('SHAREDSTATE_API_BASE', '');
    this.authToken = this.configService.get<string>('SHAREDSTATE_AUTH_TOKEN', '');

    if (!this.apiBase) {
      this.logger.warn('SHAREDSTATE_API_BASE not configured');
    }
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'x-auth-token': this.authToken,
    };
  }

  async deposit(receipt: Partial<Receipt>): Promise<DepositResponse> {
    if (!this.apiBase) {
      throw new Error('SharedState API not configured');
    }

    try {
      const response = await axios.post<DepositResponse>(`${this.apiBase}/deposit`, receipt, {
        headers: this.headers,
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to deposit receipt: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getContext(runtime: string): Promise<any> {
    if (!this.apiBase) {
      throw new Error('SharedState API not configured');
    }

    if (!SAFE_RUNTIME_PATTERN.test(runtime)) {
      throw new BadRequestException('Invalid runtime identifier');
    }

    try {
      const response = await axios.get(
        `${this.apiBase}/context/${encodeURIComponent(runtime)}?inline=1`,
        {
          headers: this.headers,
        }
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch context for ${runtime}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async checkHealth(): Promise<any> {
    if (!this.apiBase) return { status: 'disabled' };
    try {
      const response = await axios.get(`${this.apiBase}/health`);
      return response.data;
    } catch (error: any) {
      return { status: 'down', error: error.message };
    }
  }
}
