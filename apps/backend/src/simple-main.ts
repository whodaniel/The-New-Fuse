import { NestFactory } from '@nestjs/core';
import { SimpleAppModule } from './simple-app.module';

async function bootstrap() {
  const app = await NestFactory.create(SimpleAppModule);
  
  // Enable CORS for frontend access
  app.enableCors();
  
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