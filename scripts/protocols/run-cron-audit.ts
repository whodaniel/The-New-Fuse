import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../apps/api/src/app.module';
import { ChronologicalProcessesService } from '../../apps/api/src/modules/admin/chronological-processes.service';

async function runAudit() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(ChronologicalProcessesService);
  
  const actor = {
    actorId: 'system-ci-cd',
    actorRoles: ['super_admin']
  };

  const result = await service.auditChronologicalProcesses(actor);
  
  if (result.status !== 'healthy') {
    console.error(`Audit failed with ${result.issuesFound} issues.`);
    process.exit(1);
  }
  
  console.log('Audit completed successfully.');
  await app.close();
}

runAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
