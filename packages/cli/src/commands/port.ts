// packages/cli/src/commands/port.ts
import { PortRegistryService } from '@the-new-fuse/port-management';
import { Command } from 'commander';

export function createPortCommand(): Command {
  const portService = new PortRegistryService();
  const command = new Command('port').description('Manage registered service ports');

  // List all port registrations
  command
    .command('list')
    .description('List all registered ports')
    .action(() => {
      const registrations = portService.getAllRegistrations();
      if (registrations.length === 0) {
        console.log('No ports registered.');
      } else {
        console.table(
          registrations.map(({ id, serviceName, port, status, environment }) => ({
            id,
            serviceName,
            port,
            status,
            environment,
          }))
        );
      }
    });

  // Register a new port
  command
    .command('register')
    .description('Register a port for a service')
    .requiredOption('-s, --service <name>', 'Service name')
    .requiredOption(
      '-t, --type <type>',
      'Service type (frontend|api|backend|broker|database|other)'
    )
    .option('-e, --env <env>', 'Environment', 'development')
    .option('-p, --port <number>', 'Port number', parseInt)
    .action(async (options) => {
      const { service, type, env, port } = options;
      const registration = await portService.registerPort({
        serviceName: service,
        serviceType: type,
        environment: env,
        port,
      });
      console.log('Port registered:');
      console.table([
        {
          id: registration.id,
          service: registration.serviceName,
          port: registration.port,
          status: registration.status,
          environment: registration.environment,
        },
      ]);
    });

  // Reassign an existing port
  command
    .command('reassign')
    .description('Reassign a service to a new port')
    .requiredOption('-i, --id <id>', 'Registration ID')
    .requiredOption('-p, --port <number>', 'New port number', parseInt)
    .action(async (options) => {
      const { id, port } = options;
      await portService.reassignPort(id, port);
      console.log(`Port for registration '${id}' reassigned to ${port}`);
    });

  return command;
}
