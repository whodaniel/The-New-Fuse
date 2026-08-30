import type { Command } from 'commander';
import {
  formatDepartmentCard,
  loadDepartmentCatalog,
  loadDepartmentStaffing,
  resolveDepartment,
} from '../departments.js';
import { getOrCreateCommand } from './_registry.js';

export function registerDepartmentCommands(program: Command, repoRoot: string): Command {
  const department = getOrCreateCommand(
    program,
    'department',
    'Route TNF CLI work through operator-facing departments (HR, Marketing, Design, Legal, Tech, …)'
  );
  department.alias('dept');

  department
    .command('list')
    .description('List operator-facing departments and their clusters')
    .option('--json', 'Machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      const catalog = loadDepartmentCatalog(repoRoot);
      if (opts.json) {
        console.log(JSON.stringify(catalog, null, 2));
        return;
      }
      console.log('\nTNF departments\n');
      for (const dept of catalog.departments) {
        console.log(`  ${dept.name.padEnd(12)}  ${dept.id.padEnd(10)}  cluster=${dept.cluster}`);
        console.log(`               aliases: ${dept.aliases.join(', ')}`);
      }
      console.log(
        '\nRefer to a department by name: "ask Legal", "/hr", or `tnf department show legal`.\n'
      );
    });

  department
    .command('show')
    .description('Show one department card')
    .argument('<id>', 'Department id or alias (hr, legal, tech, …)')
    .option('--json', 'Machine-readable JSON')
    .action((id: string, opts: { json?: boolean }) => {
      const route = resolveDepartment(repoRoot, id);
      if (!route.matched || !route.department) {
        console.error(`Unknown department: ${id}`);
        process.exitCode = 1;
        return;
      }
      const staffing = loadDepartmentStaffing(repoRoot);
      if (opts.json) {
        console.log(
          JSON.stringify(
            {
              department: route.department,
              staffing: staffing?.departments?.[route.department.id] || null,
              progressive_injection: staffing?.policy?.progressive_injection,
            },
            null,
            2
          )
        );
        return;
      }
      console.log(`\n${formatDepartmentCard(route.department, staffing)}\n`);
    });

  department
    .command('route')
    .description('Resolve an operator utterance to a department')
    .argument('<utterance...>', 'Text that mentions or names a department')
    .option('--json', 'Machine-readable JSON')
    .action((parts: string[], opts: { json?: boolean }) => {
      const utterance = parts.join(' ');
      const route = resolveDepartment(repoRoot, utterance);
      if (opts.json) {
        console.log(JSON.stringify(route, null, 2));
        return;
      }
      if (!route.matched || !route.department) {
        console.log(`No department matched for: ${utterance}`);
        process.exitCode = 1;
        return;
      }
      console.log(`Routed to ${route.department.name} — ${route.reason}\n`);
      console.log(formatDepartmentCard(route.department, loadDepartmentStaffing(repoRoot)));
      console.log('');
    });

  return department;
}
