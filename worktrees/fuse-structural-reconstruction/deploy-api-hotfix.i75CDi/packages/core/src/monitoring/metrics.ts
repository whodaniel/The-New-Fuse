import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MetricsService {
    private readonly logger = new Logger(MetricsService.name);

    constructor(private readonly configService: ConfigService) {}

    increment(name: string, value = 1, tags: Record<string, string> = {}): void {
        this.logger.log(`Incrementing metric: ${name} by ${value}`, tags);
        // This is a placeholder for a more robust implementation that would send
        // this metric to a service like Prometheus or InfluxDB.
    }

    gauge(name: string, value: number, tags: Record<string, string> = {}): void {
        this.logger.log(`Setting gauge metric: ${name} = ${value}`, tags);
        // This is a placeholder for a more robust implementation that would send
        // this metric to a service like Prometheus or InfluxDB.
    }
}
