import { NestFactory } from '@nestjs/core';
import { SimpleAppModule } from './simple-app.module';
const cors = require('cors');

async function bootstrap() {
  const app = await NestFactory.create(SimpleAppModule);
  
  // Enable CORS for frontend access using direct cors middleware
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization'
  }));
  
  const port = process.env.PORT || 3005;
  await app.listen(port);
  
  console.log(`🚀 API Integration Layer is running on: http://localhost:${port}`);
  console.log(`📋 Agent API endpoints available at:`);
  console.log(`   POST   http://localhost:${port}/api/agents`);
  console.log(`   GET    http://localhost:${port}/api/agents`);
  console.log(`   GET    http://localhost:${port}/api/agents/active`);
  console.log(`   GET    http://localhost:${port}/api/agents/:id`);
  console.log(`   PUT    http://localhost:${port}/api/agents/:id`);
  console.log(`   PUT    http://localhost:${port}/api/agents/:id/status`);
  console.log(`   DELETE http://localhost:${port}/api/agents/:id`);
}

bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});