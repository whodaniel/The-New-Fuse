import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { A2AModule } from '../../modules/A2AModule.js';
import { A2ATestUtils } from '../utils/A2ATestUtils.js';

describe('A2A Workflow E2E', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [A2AModule],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();
    });

    describe('Workflow Execution', () => {
        it('should execute complete workflow with multiple agents', async () => {
            const workflow = await request(app.getHttpServer())
                .post('/api/workflow')
                .send({
                    name: 'test-workflow',
                    nodes: [
                        { type: 'A2A_AGENT', config: { agentType: 'TASK_EXECUTION' } },
                        { type: 'A2A_AGENT', config: { agentType: 'DATA_PROCESSING' } }
                    ]
                })
                .expect(201);

            const result = await request(app.getHttpServer())
                .post(`/api/workflow/${workflow.body.id}/execute`)
                .send({ input: { test: 'data' } })
                .expect(200);

            expect(result.body.status).toBe('completed');
        });
    });

    afterAll(async () => {
        await app.close();
    });
});