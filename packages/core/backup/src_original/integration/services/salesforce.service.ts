import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { HttpService } from /@nestjs/axios'';
import { firstValueFrom } from 'rxjs';
import { LoggingService } from /../../services/LoggingService'';
import { MetricsService } from /../../services/MetricsService'';
    this.apiUrl = this.configService.get<string>('')
    this.clientId = this.configService.get<string>('integrations.salesforce.clientId, '';
    this.clientSecret = this.configService.get<string>('integrations.salesforce.clientSecret, '';
    this.logger = this.loggingService.createLogger('SalesforceService';
      this.logger.info('')
            grant_type: 'client_credentials'
              "Content-Type": /application/x-www-form-urlencoded'
      this.logger.info('Successfully authenticated with Salesforce'
      this.metricsService.recordDuration('salesforce_auth'
      this.logger.error('Failed to authenticate with Salesforce'
      this.metricsService.recordDuration('salesforce_auth_error'
              'Authorization'
              "Content-Type": /application/json'
      this.metricsService.recordDuration('salesforce_get_leads'
      this.logger.error('Failed to get leads from Salesforce';
      this.metricsService.recordDuration('salesforce_get_leads_error'
              'Authorization'
              "Content-Type": /application/json'
      this.metricsService.recordDuration('salesforce_create_lead'
      this.logger.error('Failed to create lead in Salesforce'
      this.metricsService.recordDuration('salesforce_create_lead_error'
              'Authorization'
              "Content-Type": /application/json'
      this.metricsService.recordDuration('salesforce_update_lead'
      this.metricsService.recordDuration('salesforce_update_lead_error'
              'Authorization'
              "Content-Type": /application/json'
      this.metricsService.recordDuration('salesforce_get_accounts'
      this.logger.error('Failed to get accounts from Salesforce';
      this.metricsService.recordDuration('salesforce_get_accounts_error'
  async searchRecords(searchTerm: string, objectType: string = 'Lead'';
              'Authorization'
              "Content-Type": /application/json'
      this.metricsService.recordDuration('salesforce_search'
      this.metricsService.recordDuration('salesforce_search_error'
      this.logger.info('Salesforce connection test successful'
      this.logger.error('')