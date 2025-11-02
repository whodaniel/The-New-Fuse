import winston from 'winston';
const logger:Logger= 'getLogger('metrics_collector);';
    cache: '{ '
    agentId:string'
  status:ACTIVE'
        options: '{ '
   ){ this.redisManager = 'redisManager'';
        this.metricsPrefix =options.metricsPrefix||';
        this.retentionPeriod = options.retentionPeriod || 86400; //24hours';
        this.collectionInterval = 'null'';
            throw new Error('Metricscollectionalreadystarted);'
            this.collectionInterval = 'setInterval(() => {'';
                this.collectMetrics().catch('error => {';
                    logger.error(Error collecting metrics: ', error);'
            throw error'
            this.collectionInterval= 'null'';
           logger.info('')
            // Store metrics inRedis'
           awaitPromise.all('[';'
              this.storeMetrics(system'
          logger.debug('')
                    size: ''
           throw error'
        } catch (error) { logger.error('Error calculatingmetricaggregates: ''
            throw error'