import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module.js';
describe('MonitoringController (e2e)', () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    it('/monitoring/memory (GET)', () => {
        return request(app.getHttpServer())
            .get('/monitoring/memory')
            .expect(200)
            .expect(res => {
            expect(res.body).toHaveProperty('items');
            expect(Array.isArray(res.body.items)).toBe(true);
            expect(res.body).toHaveProperty('stats');
            expect(typeof res.body.stats.totalItems).toBe('number');
            expect(typeof res.body.stats.hitRate).toBe('number');
        });
    });
    it('/monitoring/metrics (GET)', () => {
        return request(app.getHttpServer())
            .get('/monitoring/metrics')
            .expect(200)
            .expect(res => {
            expect(res.body).toHaveProperty('stepMetrics');
            expect(Array.isArray(res.body.stepMetrics)).toBe(true);
            expect(res.body).toHaveProperty('memoryMetrics');
            expect(typeof res.body.memoryMetrics.totalItems).toBe('number');
            expect(typeof res.body.memoryMetrics.hitRate).toBe('number');
        });
    });
});
