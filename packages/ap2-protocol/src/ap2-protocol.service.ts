import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';

@Injectable()
export class Ap2ProtocolService {
  private readonly logger = new Logger(Ap2ProtocolService.name);
  private readonly pythonServerUrl = 'http://localhost:8000'; // Assuming the Python server runs on port 8000

  constructor(private readonly httpService: HttpService) {
    this.logger.log('AP2 Protocol Service Initialized');
  }

  async createPayment(paymentDetails: { value: number; currency: string }): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.pythonServerUrl}/create_payment`, paymentDetails)
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('Error creating payment:', error.response?.data || error.message);
      } else {
        this.logger.error('An unknown error occurred', error);
      }
      throw error;
    }
  }
}
