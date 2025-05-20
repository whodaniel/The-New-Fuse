import { Injectable } from '@nestjs/common';
import { AgentMetrics, MetricType } from '../types/metrics.js';
import { Repository } from 'typeorm'; // Assuming TypeORM
import { InjectRepository } from '@nestjs/typeorm';
// import { AgentState } from '../entities/agent-state.entity'; // Assuming you have an AgentState entity

@Injectable()
export class AgentPersistenceService {
    constructor(
        @InjectRepository(AgentMetrics)
        private metricsRepository: Repository<AgentMetrics>,
        // @InjectRepository(AgentState) // Uncomment and define AgentState entity
        // private stateRepository: Repository<AgentState> // Uncomment
    ) {}

    async saveMetrics(agentId: string, metrics: AgentMetrics): Promise<void> {
        await this.metricsRepository.save({
            agentId,
            ...metrics,
            timestamp: Date.now()
        });
    }

    async getMetricsHistory(agentId: string, type: MetricType, timeRange: number): Promise<AgentMetrics[]> {
        return this.metricsRepository.find({
            where: {
                agentId,
                timestamp: {
                    $gte: Date.now() - timeRange
                }
            },
            order: {
                timestamp: 'DESC'
            }
        });
    }

    async saveAgentState(agentId: string, state: any): Promise<void> {
        // This needs stateRepository to be properly injected
        // await this.stateRepository.save({
        //     agentId,
        //     state,
        //     timestamp: Date.now()
        // });
        console.warn('stateRepository not implemented in AgentPersistenceService.saveAgentState');
    }
}