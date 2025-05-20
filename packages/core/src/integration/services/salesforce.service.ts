import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoggingService } from '../../services/LoggingService.js';
import { MetricsService } from '../../services/MetricsService.js';

@Injectable()
export class SalesforceService {
  private readonly apiUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly loggingService: LoggingService,
    private readonly metricsService: MetricsService
  ) {
    this.apiUrl = this.configService.get<string>('integrations.salesforce.apiUrl', 'https://login.salesforce.com');
    this.clientId = this.configService.get<string>('integrations.salesforce.clientId', '');
    this.clientSecret = this.configService.get<string>('integrations.salesforce.clientSecret', '');
    this.logger = this.loggingService.createLogger('SalesforceService');
  }

  async authenticate(): Promise<string> {
    const startTime = Date.now();
    
    try {
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
        return this.accessToken;
      }

      await this.logger.info('Authenticating with Salesforce');
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/services/oauth2/token`,
          new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        )
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in;
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);

      // Track performance
      const duration = Date.now() - startTime;
      await this.metricsService.trackPerformance({
        duration,
        operation: 'salesforce.authenticate',
        success: true
      });

      return this.accessToken;
    } catch (error) {
      const duration = Date.now() - startTime;
      await Promise.all([
        this.logger.error('Failed to authenticate with Salesforce', {
          error: error.message,
          stack: error.stack
        }),
        this.metricsService.trackError({
          error: error.message,
          stack: error.stack,
          context: {
            operation: 'salesforce.authenticate'
          }
        }),
        this.metricsService.trackPerformance({
          duration,
          operation: 'salesforce.authenticate',
          success: false,
          metadata: {
            error: error.message
          }
        })
      ]);

      throw error;
    }
  }

  async getAccountById(accountId: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      const token = await this.authenticate();
      
      await this.logger.info('Retrieving Salesforce account', { accountId });
      
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.apiUrl}/services/data/v58.0/sobjects/Account/${accountId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      );

      // Track performance
      const duration = Date.now() - startTime;
      await this.metricsService.trackPerformance({
        duration,
        operation: 'salesforce.getAccountById',
        success: true,
        metadata: {
          accountId
        }
      });

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      await Promise.all([
        this.logger.error('Failed to retrieve Salesforce account', {
          accountId,
          error: error.message,
          stack: error.stack
        }),
        this.metricsService.trackError({
          error: error.message,
          stack: error.stack,
          context: {
            operation: 'salesforce.getAccountById',
            accountId
          }
        }),
        this.metricsService.trackPerformance({
          duration,
          operation: 'salesforce.getAccountById',
          success: false,
          metadata: {
            accountId,
            error: error.message
          }
        })
      ]);

      throw error;
    }
  }

  async createContact(contactData: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      const token = await this.authenticate();
      
      await this.logger.info('Creating Salesforce contact');
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/services/data/v58.0/sobjects/Contact`,
          contactData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
      );

      // Track performance
      const duration = Date.now() - startTime;
      await this.metricsService.trackPerformance({
        duration,
        operation: 'salesforce.createContact',
        success: true
      });

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      await Promise.all([
        this.logger.error('Failed to create Salesforce contact', {
          error: error.message,
          stack: error.stack
        }),
        this.metricsService.trackError({
          error: error.message,
          stack: error.stack,
          context: {
            operation: 'salesforce.createContact'
          }
        }),
        this.metricsService.trackPerformance({
          duration,
          operation: 'salesforce.createContact',
          success: false,
          metadata: {
            error: error.message
          }
        })
      ]);

      throw error;
    }
  }

  async queryRecords(soql: string): Promise<any[]> {
    const startTime = Date.now();
    
    try {
      const token = await this.authenticate();
      
      await this.logger.info('Executing Salesforce SOQL query');
      
      const encodedQuery = encodeURIComponent(soql);
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.apiUrl}/services/data/v58.0/query?q=${encodedQuery}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      );

      // Track performance
      const duration = Date.now() - startTime;
      await this.metricsService.trackPerformance({
        duration,
        operation: 'salesforce.queryRecords',
        success: true,
        metadata: {
          recordCount: response.data.records.length
        }
      });

      return response.data.records;
    } catch (error) {
      const duration = Date.now() - startTime;
      await Promise.all([
        this.logger.error('Failed to execute Salesforce SOQL query', {
          query: soql,
          error: error.message,
          stack: error.stack
        }),
        this.metricsService.trackError({
          error: error.message,
          stack: error.stack,
          context: {
            operation: 'salesforce.queryRecords',
            query: soql
          }
        }),
        this.metricsService.trackPerformance({
          duration,
          operation: 'salesforce.queryRecords',
          success: false,
          metadata: {
            error: error.message
          }
        })
      ]);

      throw error;
    }
  }

  async createOpportunity(opportunityData: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      const token = await this.authenticate();
      
      await this.logger.info('Creating Salesforce opportunity');
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/services/data/v58.0/sobjects/Opportunity`,
          opportunityData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
      );

      // Track performance
      const duration = Date.now() - startTime;
      await this.metricsService.trackPerformance({
        duration,
        operation: 'salesforce.createOpportunity',
        success: true
      });

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      await Promise.all([
        this.logger.error('Failed to create Salesforce opportunity', {
          error: error.message,
          stack: error.stack
        }),
        this.metricsService.trackError({
          error: error.message,
          stack: error.stack,
          context: {
            operation: 'salesforce.createOpportunity'
          }
        }),
        this.metricsService.trackPerformance({
          duration,
          operation: 'salesforce.createOpportunity',
          success: false,
          metadata: {
            error: error.message
          }
        })
      ]);

      throw error;
    }
  }
}